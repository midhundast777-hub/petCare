from rest_framework import serializers
from .models import Vaccination

class VaccinationSerializer(serializers.ModelSerializer):
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    owner_name = serializers.ReadOnlyField(source='pet.owner.full_name')
    owner_id = serializers.ReadOnlyField(source='pet.owner.id')
    status = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

    class Meta:
        model = Vaccination
        fields = (
            'id', 'pet', 'pet_name', 'pet_species', 'owner_id', 'owner_name',
            'vaccine_name', 'vaccination_date', 'expiry_date', 'veterinarian',
            'certificate_number', 'document_url', 'notes',
            'status', 'days_until_expiry', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'status', 'days_until_expiry', 'created_at', 'updated_at')
