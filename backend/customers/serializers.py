from rest_framework import serializers
from .models import Customer, CustomerNote

class CustomerNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name')

    class Meta:
        model = CustomerNote
        fields = ('id', 'customer', 'author', 'author_name', 'interaction_type', 'note', 'created_at')
        read_only_fields = ('id', 'created_at', 'author')

class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_pets = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = (
            'id', 'customer_id', 'user', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'alternate_phone', 'address', 'city',
            'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone',
            'notes', 'status', 'registration_date', 'total_pets', 'total_bookings', 'total_spent'
        )
        read_only_fields = ('id', 'customer_id', 'registration_date')

    def get_total_pets(self, obj):
        return obj.pets.count() if hasattr(obj, 'pets') else 0

    def get_total_bookings(self, obj):
        apt_count = obj.appointments.count() if hasattr(obj, 'appointments') else 0
        brd_count = obj.boarding_bookings.count() if hasattr(obj, 'boarding_bookings') else 0
        return apt_count + brd_count

    def get_total_spent(self, obj):
        if hasattr(obj, 'invoices'):
            paid_invoices = obj.invoices.filter(payment_status='PAID')
            return sum(float(inv.total_amount) for inv in paid_invoices)
        return 0.0

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email address is required.")
        norm = value.strip().lower()
        from django.core.validators import validate_email as django_validate_email
        try:
            django_validate_email(norm)
        except Exception:
            raise serializers.ValidationError("Please enter a valid email address.")
        return norm

    def validate_phone(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        digits = ''.join(c for c in str(value) if c.isdigit())
        if len(digits) != 10:
            raise serializers.ValidationError(f"Phone number must contain exactly 10 digits (currently {len(digits)} digits).")
        return digits

    def validate_alternate_phone(self, value):
        if value:
            digits = ''.join(c for c in str(value) if c.isdigit())
            if len(digits) != 10:
                raise serializers.ValidationError(f"Alternate phone must contain exactly 10 digits (currently {len(digits)} digits).")
            return digits
        return value

    def validate_emergency_contact_phone(self, value):
        if value:
            digits = ''.join(c for c in str(value) if c.isdigit())
            if len(digits) != 10:
                raise serializers.ValidationError(f"Emergency contact phone must contain exactly 10 digits (currently {len(digits)} digits).")
            return digits
        return value

class CustomerDetailSerializer(CustomerSerializer):
    timeline_notes = CustomerNoteSerializer(many=True, read_only=True)
    # pets, appointments, invoices will be added or fetched dynamically
    
    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ('timeline_notes',)
