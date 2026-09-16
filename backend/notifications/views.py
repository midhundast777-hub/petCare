from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import date, timedelta
from .models import Notification
from .serializers import NotificationSerializer
from appointments.models import Appointment
from vaccinations.models import Vaccination
from boarding.models import BoardingBooking
from users.permissions import IsStaffOrAdmin

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        unread_only = self.request.query_params.get('unread')
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)
        return queryset

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response(NotificationSerializer(notif).data)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

class NotificationGenerateRemindersView(APIView):
    """Scans and triggers automated alerts."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        created_count = 0
        today = date.today()
        tomorrow = today + timedelta(days=1)
        two_weeks = today + timedelta(days=14)

        # 1. Vaccine expiring soon
        expiring_vax = Vaccination.objects.filter(expiry_date__gte=today, expiry_date__lte=two_weeks)
        for vax in expiring_vax:
            user = vax.pet.owner.user
            if user:
                exists = Notification.objects.filter(
                    recipient=user,
                    notification_type=Notification.NotificationType.VACCINATION_EXPIRY,
                    created_at__date=today
                ).exists()
                if not exists:
                    Notification.objects.create(
                        recipient=user,
                        title=f"Vaccine Expiring: {vax.vaccine_name}",
                        message=f"{vax.pet.name}'s {vax.vaccine_name} vaccine expires on {vax.expiry_date}. Please schedule an update.",
                        notification_type=Notification.NotificationType.VACCINATION_EXPIRY,
                        link=f"/pets/{vax.pet.id}"
                    )
                    created_count += 1

        # 2. Upcoming appointments tomorrow
        upcoming_apts = Appointment.objects.filter(date=tomorrow, status=Appointment.Status.CONFIRMED)
        for apt in upcoming_apts:
            user = apt.customer.user
            if user:
                exists = Notification.objects.filter(
                    recipient=user,
                    notification_type=Notification.NotificationType.APPOINTMENT_REMINDER,
                    created_at__date=today
                ).exists()
                if not exists:
                    Notification.objects.create(
                        recipient=user,
                        title=f"Appointment Reminder: {apt.service.name}",
                        message=f"Reminder: {apt.pet.name} has an appointment for {apt.service.name} tomorrow at {apt.start_time.strftime('%I:%M %p')}.",
                        notification_type=Notification.NotificationType.APPOINTMENT_REMINDER,
                        link=f"/appointments"
                    )
                    created_count += 1

        return Response({'message': f'Generated {created_count} automated notifications.'})
