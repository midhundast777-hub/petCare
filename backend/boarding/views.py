from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Room, BoardingBooking, BoardingChecklist, DailyCareLog
from .serializers import RoomSerializer, BoardingBookingSerializer, BoardingChecklistSerializer, DailyCareLogSerializer
from users.permissions import IsStaffOrAdmin
from customers.models import Customer

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
            queryset = queryset.filter(customer__user=user)

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
        if user.role == 'CUSTOMER' and not user.is_superuser:
            customer = Customer.objects.filter(user=user).first()
            if customer:
                serializer.save(customer=customer, status=BoardingBooking.Status.RESERVED)
            else:
                serializer.save()
        else:
            serializer.save()

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
