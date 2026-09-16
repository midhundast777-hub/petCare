from rest_framework import serializers
from .models import Pet
from customers.models import Customer
from customers.serializers import CustomerSerializer

class PetSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )
    owner_name = serializers.ReadOnlyField(source='owner.full_name')
    owner_phone = serializers.ReadOnlyField(source='owner.phone')
    age = serializers.ReadOnlyField()

    class Meta:
        model = Pet
        fields = (
            'id', 'pet_id', 'name', 'owner', 'owner_name', 'owner_phone',
            'species', 'breed', 'gender', 'date_of_birth', 'age', 'color',
            'weight', 'microchip_number', 'photo', 'blood_group',
            'allergies', 'medical_conditions', 'special_needs',
            'dietary_preferences', 'personality_behavior', 'emergency_instructions',
            'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'pet_id', 'created_at', 'updated_at')

class PetDetailSerializer(PetSerializer):
    owner_details = CustomerSerializer(source='owner', read_only=True)
    vaccination_count = serializers.SerializerMethodField()
    active_medications_count = serializers.SerializerMethodField()

    class Meta(PetSerializer.Meta):
        fields = PetSerializer.Meta.fields + ('owner_details', 'vaccination_count', 'active_medications_count')

    def get_vaccination_count(self, obj):
        return obj.vaccinations.count() if hasattr(obj, 'vaccinations') else 0

    def get_active_medications_count(self, obj):
        return obj.medications.filter(status='ACTIVE').count() if hasattr(obj, 'medications') else 0
