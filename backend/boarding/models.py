from django.db import models
from django.conf import settings
from customers.models import Customer
from pets.models import Pet

class Room(models.Model):
    class RoomType(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard Suite'
        PREMIUM = 'PREMIUM', 'Premium Suite'
        LUXURY = 'LUXURY', 'Luxury Penthouse'
        DAYCARE = 'DAYCARE', 'Daycare Playpen'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        OCCUPIED = 'OCCUPIED', 'Occupied'
        MAINTENANCE = 'MAINTENANCE', 'Under Maintenance / Cleaning'

    room_number = models.CharField(max_length=50, unique=True)
    room_type = models.CharField(max_length=20, choices=RoomType.choices, default=RoomType.STANDARD)
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, default=35.00)
    capacity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['room_number']

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type}) - {self.status}"

class BoardingBooking(models.Model):
    class Package(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard Package'
        PREMIUM = 'PREMIUM', 'Premium Package'
        LUXURY = 'LUXURY', 'Luxury VIP Package'
        DAYCARE = 'DAYCARE', 'Daycare Only'

    class Status(models.TextChoices):
        RESERVED = 'RESERVED', 'Reserved'
        CHECKED_IN = 'CHECKED_IN', 'Checked In'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'

    booking_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='boarding_bookings')
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='boarding_bookings')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    package = models.CharField(max_length=20, choices=Package.choices, default=Package.STANDARD)
    check_in_date = models.DateField(db_index=True)
    expected_check_out_date = models.DateField(db_index=True)
    actual_check_out_date = models.DateField(null=True, blank=True)
    
    feeding_instructions = models.TextField(blank=True)
    medication_instructions = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=150, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RESERVED, db_index=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-check_in_date']

    def save(self, *args, **kwargs):
        if not self.booking_id:
            last_booking = BoardingBooking.objects.filter(booking_id__startswith='BRD-').order_by('-id').first()
            if last_booking and last_booking.booking_id:
                try:
                    num = int(last_booking.booking_id.split('-')[1]) + 1
                except (IndexError, ValueError):
                    num = 4001
            else:
                num = 4001
            self.booking_id = f"BRD-{num}"
        
        # Calculate approximate cost if total_cost is zero and room has daily_rate
        if not self.total_cost and self.room and self.check_in_date and self.expected_check_out_date:
            days = max((self.expected_check_out_date - self.check_in_date).days, 1)
            self.total_cost = self.room.daily_rate * days

        super().save(*args, **kwargs)

        # Ensure checklist exists
        BoardingChecklist.objects.get_or_create(booking=self)

    def __str__(self):
        return f"{self.booking_id} - {self.pet.name} ({self.status})"

class BoardingChecklist(models.Model):
    booking = models.OneToOneField(BoardingBooking, on_delete=models.CASCADE, related_name='checklist')
    # Check-in items
    checkin_vaccination_verified = models.BooleanField(default=False)
    checkin_health_condition_checked = models.BooleanField(default=False)
    checkin_weight_recorded = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    checkin_belongings_received = models.BooleanField(default=False)
    checkin_belongings_notes = models.TextField(blank=True)
    checkin_feeding_recorded = models.BooleanField(default=False)
    checkin_medication_recorded = models.BooleanField(default=False)
    checkin_emergency_verified = models.BooleanField(default=False)
    checkin_owner_instructions = models.BooleanField(default=False)
    checkin_payment_checked = models.BooleanField(default=False)
    checkin_completed = models.BooleanField(default=False)
    checkin_completed_at = models.DateTimeField(null=True, blank=True)
    checkin_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkins_completed')

    # Check-out items
    checkout_condition_checked = models.BooleanField(default=False)
    checkout_belongings_returned = models.BooleanField(default=False)
    checkout_medication_completed = models.BooleanField(default=False)
    checkout_final_services_verified = models.BooleanField(default=False)
    checkout_invoice_generated = models.BooleanField(default=False)
    checkout_payment_completed = models.BooleanField(default=False)
    checkout_owner_confirmation = models.BooleanField(default=False)
    checkout_completed = models.BooleanField(default=False)
    checkout_completed_at = models.DateTimeField(null=True, blank=True)
    checkout_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkouts_completed')

    def __str__(self):
        return f"Checklist for {self.booking.booking_id}"

class DailyCareLog(models.Model):
    class CareType(models.TextChoices):
        FEEDING = 'FEEDING', 'Feeding'
        MEDICATION = 'MEDICATION', 'Medication Administered'
        EXERCISE = 'EXERCISE', 'Exercise / Playtime'
        GROOMING = 'GROOMING', 'Grooming / Brushing'
        POTTY = 'POTTY', 'Potty Break'
        BEHAVIOR = 'BEHAVIOR', 'Behavior Observation'
        HEALTH_CHECK = 'HEALTH_CHECK', 'Health Check'

    booking = models.ForeignKey(BoardingBooking, on_delete=models.CASCADE, related_name='care_logs')
    care_type = models.CharField(max_length=30, choices=CareType.choices, default=CareType.FEEDING)
    notes = models.TextField()
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-logged_at']

    def __str__(self):
        return f"{self.care_type} for {self.booking.pet.name} at {self.logged_at.strftime('%Y-%m-%d %H:%M')}"
