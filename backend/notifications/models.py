from django.db import models
from django.conf import settings

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER', 'Appointment Reminder'
        BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION', 'Booking Confirmation'
        BOARDING_REMINDER = 'BOARDING_REMINDER', 'Boarding Reminder'
        VACCINATION_EXPIRY = 'VACCINATION_EXPIRY', 'Vaccination Expiry'
        MEDICATION_REMINDER = 'MEDICATION_REMINDER', 'Medication Reminder'
        PAYMENT_REMINDER = 'PAYMENT_REMINDER', 'Payment Reminder'
        INVOICE_GENERATION = 'INVOICE_GENERATION', 'Invoice Generated'
        CHECK_IN_REMINDER = 'CHECK_IN_REMINDER', 'Check-In Alert'
        CHECK_OUT_REMINDER = 'CHECK_OUT_REMINDER', 'Check-Out Alert'
        GENERAL = 'GENERAL', 'General Notification'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.GENERAL)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.recipient.email}: {self.title} ({'Read' if self.is_read else 'Unread'})"
