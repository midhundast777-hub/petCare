from django.db import models
from datetime import date
from customers.models import Customer

class Pet(models.Model):
    class Species(models.TextChoices):
        DOG = 'DOG', 'Dog'
        CAT = 'CAT', 'Cat'
        BIRD = 'BIRD', 'Bird'
        RABBIT = 'RABBIT', 'Rabbit'
        OTHER = 'OTHER', 'Other'

    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        DECEASED = 'DECEASED', 'Deceased'
        TRANSFERRED = 'TRANSFERRED', 'Transferred'

    pet_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    name = models.CharField(max_length=100, db_index=True)
    owner = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='pets')
    species = models.CharField(max_length=20, choices=Species.choices, default=Species.DOG)
    breed = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE)
    date_of_birth = models.DateField(null=True, blank=True)
    color = models.CharField(max_length=50, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    microchip_number = models.CharField(max_length=50, blank=True, db_index=True)
    photo = models.URLField(max_length=500, blank=True, default='')
    blood_group = models.CharField(max_length=20, blank=True)
    allergies = models.TextField(blank=True, help_text="Known pet allergies")
    medical_conditions = models.TextField(blank=True, help_text="Pre-existing medical conditions")
    special_needs = models.TextField(blank=True, help_text="Physical or behavioral special care needs")
    dietary_preferences = models.TextField(blank=True, help_text="Brand, wet/dry, timing, quantity")
    personality_behavior = models.TextField(blank=True, help_text="Playful, anxious, dog-friendly, etc.")
    emergency_instructions = models.TextField(blank=True, help_text="In case of medical distress")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.pet_id:
            last_pet = Pet.objects.filter(pet_id__startswith='PET-').order_by('-id').first()
            if last_pet and last_pet.pet_id:
                try:
                    num = int(last_pet.pet_id.split('-')[1]) + 1
                except (IndexError, ValueError):
                    num = 2001
            else:
                num = 2001
            self.pet_id = f"PET-{num}"
        super().save(*args, **kwargs)

    @property
    def age(self):
        if not self.date_of_birth:
            return "Unknown"
        today = date.today()
        years = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        if years < 1:
            months = (today.year - self.date_of_birth.year) * 12 + today.month - self.date_of_birth.month
            return f"{max(months, 0)} mos"
        return f"{years} yrs"

    def __str__(self):
        return f"{self.name} ({self.species} - {self.pet_id})"
