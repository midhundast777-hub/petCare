from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from customers.models import Customer
from pets.models import Pet
from services.models import Service

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CHECKED_IN = 'CHECKED_IN', 'Checked-in'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No-show'

    appointment_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='appointments')
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='appointments')
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_appointments'
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': "End time must be after start time."})

        # Staff conflict validation
        if self.staff and self.date and self.start_time and self.end_time:
            conflicts = Appointment.objects.filter(
                staff=self.staff,
                date=self.date,
                status__in=[self.Status.CONFIRMED, self.Status.CHECKED_IN, self.Status.IN_PROGRESS]
            ).exclude(id=self.id)
            
            overlapping = conflicts.filter(
                models.Q(start_time__lt=self.end_time, end_time__gt=self.start_time)
            )
            if overlapping.exists():
                raise ValidationError({'staff': f"Staff member is already booked during this time slot."})

    def save(self, *args, **kwargs):
        if not self.appointment_id:
            last_apt = Appointment.objects.filter(appointment_id__startswith='APT-').order_by('-id').first()
            if last_apt and last_apt.appointment_id:
                try:
                    num = int(last_apt.appointment_id.split('-')[1]) + 1
                except (IndexError, ValueError):
                    num = 3001
            else:
                num = 3001
            self.appointment_id = f"APT-{num}"
        if not self.amount and self.service:
            self.amount = self.service.price
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.appointment_id} - {self.pet.name} ({self.service.name}) on {self.date}"
