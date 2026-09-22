from rest_framework import serializers
from .models import Appointment
from customers.models import Customer
from users.models import User

class AppointmentSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )
    staff = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    service_name = serializers.ReadOnlyField(source='service.name')
    staff_name = serializers.ReadOnlyField(source='staff.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'appointment_id', 'customer', 'customer_name', 'customer_phone',
            'pet', 'pet_name', 'pet_species', 'service', 'service_name',
            'staff', 'staff_name', 'date', 'start_time', 'end_time',
            'status', 'status_display', 'notes', 'amount', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'appointment_id', 'created_at', 'updated_at')

    def validate(self, attrs):
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time') or (self.instance.end_time if self.instance else None)
        date = attrs.get('date') or (self.instance.date if self.instance else None)
        staff = attrs.get('staff') or (self.instance.staff if self.instance else None)

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})

        if staff and date and start_time and end_time:
            conflicts = Appointment.objects.filter(
                staff=staff,
                date=date,
                status__in=[Appointment.Status.CONFIRMED, Appointment.Status.CHECKED_IN, Appointment.Status.IN_PROGRESS]
            )
            if self.instance:
                conflicts = conflicts.exclude(id=self.instance.id)

            overlapping = conflicts.filter(
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            if overlapping.exists():
                raise serializers.ValidationError({"staff": "Selected staff member has a conflicting appointment at this time."})

        return attrs
