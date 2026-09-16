from django.contrib import admin
from .models import Invoice, Payment

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'total_amount', 'payment_status', 'payment_method', 'invoice_date', 'due_date')
    list_filter = ('payment_status', 'payment_method', 'invoice_date')
    search_fields = ('invoice_number', 'customer__first_name', 'customer__last_name')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'payment_method', 'payment_date')
