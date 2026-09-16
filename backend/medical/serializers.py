from rest_framework import serializers
from .models import MedicalRecord, Medication, MedicationLog, FeedingSchedule, FeedingLog

class MedicalRecordSerializer(serializers.ModelSerializer):
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    owner_name = serializers.ReadOnlyField(source='pet.owner.full_name')

    class Meta:
        model = MedicalRecord
        fields = (
            'id', 'pet', 'pet_name', 'pet_species', 'owner_name',
            'visit_date', 'veterinarian', 'diagnosis', 'symptoms',
            'treatment', 'prescription', 'notes', 'document_url',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class MedicationLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.full_name')

    class Meta:
        model = MedicationLog
        fields = ('id', 'medication', 'administered_at', 'staff', 'staff_name', 'notes')
        read_only_fields = ('id', 'administered_at')

class MedicationSerializer(serializers.ModelSerializer):
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    assigned_staff_name = serializers.ReadOnlyField(source='assigned_staff.full_name')
    administration_logs = MedicationLogSerializer(many=True, read_only=True)

    class Meta:
        model = Medication
        fields = (
            'id', 'pet', 'pet_name', 'pet_species', 'medicine_name',
            'dosage', 'frequency', 'start_date', 'end_date', 'instructions',
            'assigned_staff', 'assigned_staff_name', 'status',
            'administration_logs', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class FeedingLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.full_name')

    class Meta:
        model = FeedingLog
        fields = ('id', 'schedule', 'fed_at', 'staff', 'staff_name', 'amount_eaten', 'notes')
        read_only_fields = ('id', 'fed_at')

class FeedingScheduleSerializer(serializers.ModelSerializer):
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    assigned_staff_name = serializers.ReadOnlyField(source='assigned_staff.full_name')
    logs = FeedingLogSerializer(many=True, read_only=True)

    class Meta:
        model = FeedingSchedule
        fields = (
            'id', 'pet', 'pet_name', 'pet_species', 'food_type', 'quantity',
            'feeding_time', 'frequency', 'special_instructions',
            'assigned_staff', 'assigned_staff_name', 'last_fed_at',
            'logs', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
