from django.db import models
from django.conf import settings

class Customer(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    customer_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=25, db_index=True)
    alternate_phone = models.CharField(max_length=25, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=25, blank=True)
    notes = models.TextField(blank=True, help_text="General notes about the customer")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    registration_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registration_date']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        if not self.customer_id:
            last_cust = Customer.objects.filter(customer_id__startswith='CUST-').order_by('-id').first()
            if last_cust and last_cust.customer_id:
                try:
                    num = int(last_cust.customer_id.split('-')[1]) + 1
                except (IndexError, ValueError):
                    num = (last_cust.id + 1000)
            else:
                num = 1001
            self.customer_id = f"CUST-{num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_id} - {self.full_name}"

class CustomerNote(models.Model):
    class InteractionType(models.TextChoices):
        NOTE = 'NOTE', 'General Note'
        CALL = 'CALL', 'Phone Call'
        EMAIL = 'EMAIL', 'Email'
        IN_PERSON = 'IN_PERSON', 'In-Person Conversation'

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='timeline_notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    interaction_type = models.CharField(max_length=20, choices=InteractionType.choices, default=InteractionType.NOTE)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.interaction_type} for {self.customer} on {self.created_at.strftime('%Y-%m-%d')}"
