from rest_framework import serializers
from .models import Invoice, Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'invoice', 'amount', 'payment_method', 'transaction_id', 'payment_date', 'notes')
        read_only_fields = ('id', 'payment_date')

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    customer_email = serializers.ReadOnlyField(source='customer.email')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    customer_address = serializers.ReadOnlyField(source='customer.address')
    customer_city = serializers.ReadOnlyField(source='customer.city')
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    payments = PaymentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    paid_amount = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            'id', 'invoice_number', 'customer', 'customer_name', 'customer_email',
            'customer_phone', 'customer_address', 'customer_city', 'pet', 'pet_name',
            'pet_species', 'appointment', 'boarding_booking', 'items_data',
            'subtotal', 'discount', 'tax_rate', 'tax_amount', 'total_amount',
            'payment_status', 'status_display', 'payment_method', 'invoice_date',
            'due_date', 'paid_at', 'notes', 'payments', 'paid_amount', 'balance_due',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'invoice_number', 'subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at')

    def get_paid_amount(self, obj):
        return sum(float(p.amount) for p in obj.payments.all())

    def get_balance_due(self, obj):
        paid = sum(float(p.amount) for p in obj.payments.all())
        return max(round(float(obj.total_amount) - paid, 2), 0.0)
