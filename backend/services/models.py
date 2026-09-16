from django.db import models

class Service(models.Model):
    class Category(models.TextChoices):
        BOARDING = 'BOARDING', 'Pet Boarding'
        DAYCARE = 'DAYCARE', 'Doggy Daycare'
        GROOMING = 'GROOMING', 'Pet Grooming'
        TRAINING = 'TRAINING', 'Pet Training'
        VETERINARY = 'VETERINARY', 'Veterinary Checkup'
        BATHING = 'BATHING', 'Bathing & Spa'
        NAIL_TRIMMING = 'NAIL_TRIMMING', 'Nail Trimming'
        TRANSPORTATION = 'TRANSPORTATION', 'Pet Taxi / Transport'
        OTHER = 'OTHER', 'Other Service'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    name = models.CharField(max_length=150, unique=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GROOMING)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_minutes = models.PositiveIntegerField(default=60, help_text="Duration in minutes")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} (${self.price})"
