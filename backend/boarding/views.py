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
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

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

class BoardingBookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BoardingBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return BoardingBooking.objects.filter(customer__user=user)
        return BoardingBooking.objects.all()

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

            # Process digital check-in
            if 'checkin_completed' in request.data:
                if request.data['checkin_completed']:
                    updated_checklist.checkin_completed_at = timezone.now()
                    updated_checklist.checkin_staff = request.user
                    updated_checklist.save()
                    booking.status = BoardingBooking.Status.CHECKED_IN
                    booking.save()
                    if booking.room:
                        booking.room.status = Room.Status.OCCUPIED
                        booking.room.save()

            # Process digital check-out
            if 'checkout_completed' in request.data:
                if request.data['checkout_completed']:
                    updated_checklist.checkout_completed_at = timezone.now()
                    updated_checklist.checkout_staff = request.user
                    updated_checklist.save()
                    booking.status = BoardingBooking.Status.CHECKED_OUT
                    booking.actual_check_out_date = timezone.now().date()
                    booking.save()
                    if booking.room:
                        booking.room.status = Room.Status.AVAILABLE
                        booking.room.save()

            return Response(BoardingChecklistSerializer(updated_checklist).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DailyCareLogListCreateView(generics.ListCreateAPIView):
    serializer_class = DailyCareLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs.get('booking_id')
        return DailyCareLog.objects.filter(booking_id=booking_id)

    def perform_create(self, serializer):
        booking_id = self.kwargs.get('booking_id')
        booking = BoardingBooking.objects.get(id=booking_id)
        serializer.save(booking=booking, staff=self.request.user)
