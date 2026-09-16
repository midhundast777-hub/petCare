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

class CustomerDetailSerializer(CustomerSerializer):
    timeline_notes = CustomerNoteSerializer(many=True, read_only=True)
    # pets, appointments, invoices will be added or fetched dynamically
    
    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ('timeline_notes',)
