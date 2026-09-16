from django.db import models
from django.conf import settings
from pets.models import Pet

class MedicalRecord(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='medical_records')
    visit_date = models.DateField(db_index=True)
    veterinarian = models.CharField(max_length=150)
    diagnosis = models.CharField(max_length=255)
    symptoms = models.TextField(blank=True)
    treatment = models.TextField(blank=True)
    prescription = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    document_url = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-visit_date']

    def __str__(self):
        return f"{self.pet.name} - {self.diagnosis} on {self.visit_date}"

class Medication(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        DISCONTINUED = 'DISCONTINUED', 'Discontinued'

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='medications')
    medicine_name = models.CharField(max_length=150)
    dosage = models.CharField(max_length=100, help_text="e.g. 1 tablet, 5ml, 2 drops")
    frequency = models.CharField(max_length=100, help_text="e.g. Twice daily, Every 8 hours")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    instructions = models.TextField(blank=True, help_text="Special instructions e.g. with food")
    assigned_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_medications'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-status', 'start_date']

    def __str__(self):
        return f"{self.medicine_name} for {self.pet.name} ({self.status})"

class MedicationLog(models.Model):
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='administration_logs')
    administered_at = models.DateTimeField(auto_now_add=True)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-administered_at']

    def __str__(self):
        return f"Given {self.medication.medicine_name} at {self.administered_at.strftime('%Y-%m-%d %H:%M')}"

class FeedingSchedule(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='feeding_schedules')
    food_type = models.CharField(max_length=150, help_text="e.g. Royal Canin Adult Dry Kibble")
    quantity = models.CharField(max_length=100, help_text="e.g. 1 cup (200g)")
    feeding_time = models.CharField(max_length=100, help_text="e.g. 08:00 AM & 06:00 PM")
    frequency = models.CharField(max_length=100, help_text="e.g. Twice a day")
    special_instructions = models.TextField(blank=True, help_text="e.g. Add warm water, separate from other dogs")
    assigned_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_feedings'
    )
    last_fed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['pet', 'feeding_time']

    def __str__(self):
        return f"Feeding for {self.pet.name}: {self.food_type} ({self.feeding_time})"

class FeedingLog(models.Model):
    schedule = models.ForeignKey(FeedingSchedule, on_delete=models.CASCADE, related_name='logs')
    fed_at = models.DateTimeField(auto_now_add=True)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    amount_eaten = models.CharField(max_length=100, default='All', help_text="e.g. All, Half, None")
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-fed_at']

    def __str__(self):
        return f"Fed {self.schedule.pet.name} at {self.fed_at.strftime('%Y-%m-%d %H:%M')}"
