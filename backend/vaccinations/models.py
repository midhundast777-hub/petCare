from django.db import models
from datetime import date, timedelta
from pets.models import Pet

class Vaccination(models.Model):
    class Status(models.TextChoices):
        VALID = 'VALID', 'Valid'
        EXPIRING_SOON = 'EXPIRING_SOON', 'Expiring Soon'
        EXPIRED = 'EXPIRED', 'Expired'

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='vaccinations')
    vaccine_name = models.CharField(max_length=150, db_index=True)
    vaccination_date = models.DateField()
    expiry_date = models.DateField(db_index=True)
    veterinarian = models.CharField(max_length=150, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    document_url = models.URLField(max_length=500, blank=True, default='')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['expiry_date']

    @property
    def status(self):
        today = date.today()
        if self.expiry_date < today:
            return self.Status.EXPIRED
        elif self.expiry_date <= today + timedelta(days=30):
            return self.Status.EXPIRING_SOON
        return self.Status.VALID

    @property
    def days_until_expiry(self):
        today = date.today()
        delta = (self.expiry_date - today).days
        return delta

    def __str__(self):
        return f"{self.pet.name} - {self.vaccine_name} (Expires: {self.expiry_date})"
