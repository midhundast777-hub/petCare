from django.db import models
from datetime import date
from customers.models import Customer
from pets.models import Pet
from appointments.models import Appointment
from boarding.models import BoardingBooking

class Invoice(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        REFUNDED = 'REFUNDED', 'Refunded'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Credit / Debit Card'
        UPI = 'UPI', 'UPI'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        ONLINE = 'ONLINE', 'Online Payment'

    invoice_number = models.CharField(max_length=30, unique=True, blank=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    pet = models.ForeignKey(Pet, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    boarding_booking = models.ForeignKey(BoardingBooking, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    # Store list of items: [{'description': 'Dog Bathing', 'quantity': 1, 'unit_price': 45.0, 'total': 45.0}]
    items_data = models.JSONField(default=list, blank=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="Percentage e.g. 5.00%")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    invoice_date = models.DateField(default=date.today)
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last_inv = Invoice.objects.filter(invoice_number__startswith='INV-').order_by('-id').first()
            if last_inv and last_inv.invoice_number:
                try:
                    num = int(last_inv.invoice_number.split('-')[1]) + 1
                except (IndexError, ValueError):
                    num = 5001
            else:
                num = 5001
            self.invoice_number = f"INV-{num}"
        
        # Calculate subtotal if items_data provided
        if self.items_data and isinstance(self.items_data, list):
            calculated_subtotal = sum(
                float(item.get('total', float(item.get('quantity', 1)) * float(item.get('unit_price', 0))))
                for item in self.items_data
            )
            self.subtotal = calculated_subtotal

        # Tax and total
        taxable_amount = max(float(self.subtotal) - float(self.discount), 0.0)
        self.tax_amount = round(taxable_amount * (float(self.tax_rate) / 100.0), 2)
        self.total_amount = round(taxable_amount + float(self.tax_amount), 2)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.full_name} (${self.total_amount}) [{self.payment_status}]"

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Invoice.PaymentMethod.choices, default=Invoice.PaymentMethod.CARD)
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment of ${self.amount} for {self.invoice.invoice_number}"
