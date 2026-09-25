from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Room, BoardingBooking, BoardingChecklist, DailyCareLog
from .serializers import RoomSerializer, BoardingBookingSerializer, BoardingChecklistSerializer, DailyCareLogSerializer
from users.permissions import IsStaffOrAdmin
from customers.models import Customer
from pets.models import Pet
from users.models import User
from notifications.models import Notification

class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        # Auto-sync room statuses with active CHECKED_IN bookings:
        # A room is OCCUPIED if and only if an active CHECKED_IN booking currently occupies it.
        # Maintenance rooms remain in MAINTENANCE.
        occupied_room_ids = list(
            BoardingBooking.objects.filter(
                status=BoardingBooking.Status.CHECKED_IN,
                room__isnull=False
            ).values_list('room_id', flat=True)
        )
        Room.objects.filter(id__in=occupied_room_ids).exclude(status=Room.Status.MAINTENANCE).update(status=Room.Status.OCCUPIED)
        Room.objects.exclude(id__in=occupied_room_ids).filter(status=Room.Status.OCCUPIED).update(status=Room.Status.AVAILABLE)
        return Room.objects.all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated()]

class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated()]

class BoardingBookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BoardingBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = BoardingBooking.objects.select_related('customer', 'pet', 'room').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(Q(customer__user=user) | Q(customer__email__iexact=user.email))

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        package = self.request.query_params.get('package')
        if package:
            queryset = queryset.filter(package=package.upper())

        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(booking_id__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search) |
                Q(pet__name__icontains=search) |
                Q(room__room_number__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        # 1. Resolve Customer
        customer = serializer.validated_data.get('customer')
        if not customer:
            if user and user.is_authenticated:
                customer = Customer.objects.filter(user=user).first()
                if not customer:
                    customer = Customer.objects.filter(email__iexact=user.email).first()
                    if customer and not customer.user:
                        customer.user = user
                        customer.save()
                if not customer:
                    customer = Customer.objects.create(
                        user=user,
                        first_name=user.first_name or 'Valued',
                        last_name=user.last_name or 'Customer',
                        email=user.email,
                        phone=user.phone or self.request.data.get('emergency_contact') or self.request.data.get('phone') or '000-000-0000'
                    )

        # 2. Resolve or Create Pet
        pet = serializer.validated_data.get('pet')
        if not pet and customer:
            dog_name = (
                self.request.data.get('dogName') or 
                self.request.data.get('dog_name') or 
                self.request.data.get('pet_name') or ''
            ).strip()
            breed = (self.request.data.get('breedSize') or self.request.data.get('breed') or '').strip()

            if dog_name:
                pet = Pet.objects.filter(owner=customer, name__iexact=dog_name).first()
                if not pet:
                    pet = Pet.objects.create(
                        owner=customer,
                        name=dog_name,
                        breed=breed,
                        species=Pet.Species.DOG
                    )
            else:
                pet = Pet.objects.filter(owner=customer).first()
                if not pet:
                    pet = Pet.objects.create(
                        owner=customer,
                        name='My Pet',
                        breed=breed,
                        species=Pet.Species.DOG
                    )

        # 3. Resolve dates
        check_in = (
            serializer.validated_data.get('check_in_date') or 
            self.request.data.get('dropOffDate') or 
            timezone.now().date()
        )
        expected_out = (
            serializer.validated_data.get('expected_check_out_date') or 
            self.request.data.get('pickUpDate') or 
            check_in
        )

        special_instructions = (
            serializer.validated_data.get('special_instructions') or 
            self.request.data.get('note') or ''
        )
        emergency_contact = (
            serializer.validated_data.get('emergency_contact') or 
            self.request.data.get('phone') or ''
        )

        save_kwargs = {
            'check_in_date': check_in,
            'expected_check_out_date': expected_out,
            'special_instructions': special_instructions,
            'emergency_contact': emergency_contact,
            'status': BoardingBooking.Status.RESERVED
        }
        if customer:
            save_kwargs['customer'] = customer
        if pet:
            save_kwargs['pet'] = pet

        booking = serializer.save(**save_kwargs)

        # 4. Notify Admin and Staff
        staff_and_admin = User.objects.filter(role__in=[User.Role.ADMIN, User.Role.STAFF])
        cust_name = customer.full_name if customer else (user.full_name if user else 'Customer')
        pet_display = pet.name if pet else 'Pet'

        for recipient in staff_and_admin:
            Notification.objects.create(
                recipient=recipient,
                title="New Boarding Stay Request",
                message=f"New booking request from {cust_name} for pet '{pet_display}' ({booking.check_in_date} to {booking.expected_check_out_date}).",
                notification_type=Notification.NotificationType.BOOKING_CONFIRMATION,
                link="/boarding"
            )

        # 5. Notify Customer
        if user and user.is_authenticated:
            Notification.objects.create(
                recipient=user,
                title="Boarding Request Received",
                message=f"Your booking request for '{pet_display}' ({booking.check_in_date} to {booking.expected_check_out_date}) has been submitted.",
                notification_type=Notification.NotificationType.BOOKING_CONFIRMATION,
                link="/profile"
            )

def sync_boarding_invoice(booking):
    """
    Creates or updates an Invoice in the Billing module only when the pet is checked in
    (or checked out), storing the suite occupancy, duration, and calculated cost.
    Stays with status 'RESERVED' do not have an invoice generated.
    """
    if not booking or not booking.customer:
        return None

    if booking.status not in [BoardingBooking.Status.CHECKED_IN, BoardingBooking.Status.CHECKED_OUT]:
        return None

    from billing.models import Invoice

    days = 1
    if booking.check_in_date and booking.expected_check_out_date:
        days = max((booking.expected_check_out_date - booking.check_in_date).days, 1)

    daily_rate = float(booking.room.daily_rate) if booking.room else 45.00
    room_desc = f"Room {booking.room.room_number} ({booking.room.get_room_type_display()})" if booking.room else "Boarding Kennel Suite"
    item_total = round(daily_rate * days, 2)

    items_data = [
        {
            'description': f"Boarding Stay ({booking.booking_id}): {room_desc} ({booking.check_in_date} to {booking.expected_check_out_date}, {days} nights)",
            'quantity': days,
            'unit_price': daily_rate,
            'total': item_total
        }
    ]

    due_date = booking.expected_check_out_date or booking.check_in_date or timezone.now().date()
    inv_date = booking.check_in_date or timezone.now().date()

    invoice, created = Invoice.objects.get_or_create(
        boarding_booking=booking,
        defaults={
            'customer': booking.customer,
            'pet': booking.pet,
            'items_data': items_data,
            'subtotal': item_total,
            'due_date': due_date,
            'invoice_date': inv_date,
            'payment_status': Invoice.PaymentStatus.PENDING,
            'notes': f"Auto-generated for Boarding Stay {booking.booking_id} upon Check-In & Suite Occupancy Confirmation."
        }
    )

    if not created:
        invoice.customer = booking.customer
        invoice.pet = booking.pet
        invoice.items_data = items_data
        invoice.subtotal = item_total
        invoice.due_date = due_date
        invoice.invoice_date = inv_date
        invoice.save()

    return invoice

class BoardingBookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BoardingBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return BoardingBooking.objects.filter(Q(customer__user=user) | Q(customer__email__iexact=user.email))
        return BoardingBooking.objects.all()

    def perform_update(self, serializer):
        booking = serializer.save()
        if booking.room:
            if booking.status == BoardingBooking.Status.CHECKED_IN:
                booking.room.status = Room.Status.OCCUPIED
                booking.room.save(update_fields=['status'])
            elif booking.status in [BoardingBooking.Status.CHECKED_OUT, BoardingBooking.Status.CANCELLED]:
                booking.room.status = Room.Status.AVAILABLE
                booking.room.save(update_fields=['status'])

        if booking.status in [BoardingBooking.Status.CHECKED_IN, BoardingBooking.Status.CHECKED_OUT]:
            sync_boarding_invoice(booking)

class BoardingChecklistView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, booking_id):
        try:
            booking = BoardingBooking.objects.get(id=booking_id)
            checklist, _ = BoardingChecklist.objects.get_or_create(booking=booking)
            serializer = BoardingChecklistSerializer(checklist)
            return Response(serializer.data)
        except BoardingBooking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, booking_id):
        try:
            booking = BoardingBooking.objects.get(id=booking_id)
            checklist, _ = BoardingChecklist.objects.get_or_create(booking=booking)
        except BoardingBooking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BoardingChecklistSerializer(checklist, data=request.data, partial=True)
        if serializer.is_valid():
            updated_checklist = serializer.save()

            # Update booking occupancy room and intake instructions if provided
            room_id = request.data.get('room') or request.data.get('room_id')
            if room_id is not None and str(room_id).strip() != '':
                try:
                    new_room = Room.objects.get(id=room_id)
                    old_room = booking.room
                    if old_room and old_room.id != new_room.id and old_room.status == Room.Status.OCCUPIED:
                        old_room.status = Room.Status.AVAILABLE
                        old_room.save(update_fields=['status'])
                    booking.room = new_room
                    if booking.check_in_date and booking.expected_check_out_date:
                        days = max((booking.expected_check_out_date - booking.check_in_date).days, 1)
                        booking.total_cost = new_room.daily_rate * days
                except (Room.DoesNotExist, ValueError):
                    pass

            for field in ['feeding_instructions', 'medication_instructions', 'special_instructions', 'emergency_contact']:
                if field in request.data:
                    setattr(booking, field, request.data[field])

            # Process digital check-in
            if 'checkin_completed' in request.data:
                if request.data['checkin_completed']:
                    updated_checklist.checkin_completed_at = timezone.now()
                    updated_checklist.checkin_staff = request.user
                    updated_checklist.save()
                    booking.status = BoardingBooking.Status.CHECKED_IN
                    if booking.room:
                        booking.room.status = Room.Status.OCCUPIED
                        booking.room.save(update_fields=['status'])
                    booking.save()
                    # Store record to billing invoice upon check-in
                    sync_boarding_invoice(booking)

                    # Auto-generate Arrival Digital Diary entry if not already present
                    if not DailyCareLog.objects.filter(booking=booking, stage=DailyCareLog.Stage.ARRIVAL).exists():
                        DailyCareLog.objects.create(
                            booking=booking,
                            stage=DailyCareLog.Stage.ARRIVAL,
                            care_type=DailyCareLog.CareType.ARRIVAL,
                            activity_title=f"{booking.pet.name} Arrived at Sanctuary",
                            mood=DailyCareLog.Mood.HAPPY,
                            activity_time=updated_checklist.checkin_completed_at or timezone.now(),
                            weight=updated_checklist.checkin_weight_recorded,
                            belongings_notes=updated_checklist.checkin_belongings_notes or 'Belongings received and verified.',
                            health_notes='Vaccination verified and intake health check passed.' if updated_checklist.checkin_vaccination_verified else 'Intake health check completed.',
                            notes=f"Welcome intake completed by {request.user.full_name or request.user.username}. {booking.pet.name} arrived safely and settled into room {booking.room.room_number if booking.room else 'reserved suite'}.",
                            staff=request.user
                        )

            # Process digital check-out
            if 'checkout_completed' in request.data:
                if request.data['checkout_completed']:
                    updated_checklist.checkout_completed_at = timezone.now()
                    updated_checklist.checkout_staff = request.user
                    updated_checklist.save()
                    booking.status = BoardingBooking.Status.CHECKED_OUT
                    booking.actual_check_out_date = timezone.now().date()
                    if booking.room:
                        booking.room.status = Room.Status.AVAILABLE
                        booking.room.save(update_fields=['status'])
                    booking.save()
                    sync_boarding_invoice(booking)

                    # Auto-generate Departure Digital Diary entry if not already present
                    if not DailyCareLog.objects.filter(booking=booking, stage=DailyCareLog.Stage.DEPARTURE).exists():
                        DailyCareLog.objects.create(
                            booking=booking,
                            stage=DailyCareLog.Stage.DEPARTURE,
                            care_type=DailyCareLog.CareType.DEPARTURE,
                            activity_title=f"{booking.pet.name} Ready for Home Departure",
                            mood=DailyCareLog.Mood.HAPPY,
                            activity_time=updated_checklist.checkout_completed_at or timezone.now(),
                            belongings_notes='All personal belongings, toys, and medications returned to pet owner.' if updated_checklist.checkout_belongings_returned else 'Belongings returned.',
                            health_notes='Post-stay condition checked. Pet is clean, healthy, and energized.' if updated_checklist.checkout_condition_checked else 'Departure condition inspection completed.',
                            notes=f"Check-out farewell inspection completed by {request.user.full_name or request.user.username}. Thank you for boarding with us! {booking.pet.name} was an absolute joy to care for.",
                            staff=request.user
                        )

            booking.save()

            return Response(BoardingChecklistSerializer(updated_checklist).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DailyCareLogListCreateView(generics.ListCreateAPIView):
    serializer_class = DailyCareLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs.get('booking_id')
        user = self.request.user
        queryset = DailyCareLog.objects.select_related('booking', 'booking__pet', 'staff').filter(
            Q(booking_id=booking_id) | Q(booking__booking_id=booking_id)
        )
        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(Q(booking__customer__user=user) | Q(booking__customer__email__iexact=user.email))

        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage.upper())

        care_type = self.request.query_params.get('care_type')
        if care_type:
            queryset = queryset.filter(care_type=care_type.upper())

        ordering = self.request.query_params.get('ordering', 'activity_time')
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    def perform_create(self, serializer):
        booking_id = self.kwargs.get('booking_id')
        try:
            booking = BoardingBooking.objects.get(id=booking_id)
        except (BoardingBooking.DoesNotExist, ValueError):
            booking = BoardingBooking.objects.get(booking_id=booking_id)

        # Infer stage if not provided
        care_type = serializer.validated_data.get('care_type', DailyCareLog.CareType.FEEDING)
        stage = serializer.validated_data.get('stage')
        if not stage:
            if care_type == DailyCareLog.CareType.ARRIVAL:
                stage = DailyCareLog.Stage.ARRIVAL
            elif care_type == DailyCareLog.CareType.DEPARTURE:
                stage = DailyCareLog.Stage.DEPARTURE
            else:
                stage = DailyCareLog.Stage.DAILY

        log = serializer.save(booking=booking, staff=self.request.user, stage=stage)

        # If photo provided, sync to booking stay_photo
        if log.photo:
            booking.stay_photo = log.photo
            booking.stay_photo_updated_at = timezone.now()
            booking.save(update_fields=['stay_photo', 'stay_photo_updated_at'])

class DailyCareLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DailyCareLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = DailyCareLog.objects.select_related('booking', 'booking__pet', 'staff').all()
        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(Q(booking__customer__user=user) | Q(booking__customer__email__iexact=user.email))
        return queryset

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated()]

class PetDiaryListView(generics.ListAPIView):
    serializer_class = DailyCareLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        pet_id = self.kwargs.get('pet_id')
        user = self.request.user
        queryset = DailyCareLog.objects.select_related('booking', 'booking__pet', 'staff').filter(
            Q(booking__pet_id=pet_id)
        )
        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(
                Q(booking__customer__user=user) | Q(booking__customer__email__iexact=user.email)
            )

        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage.upper())

        return queryset.order_by('-activity_time')

