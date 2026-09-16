from rest_framework import serializers
from .models import Room, BoardingBooking, BoardingChecklist, DailyCareLog

class RoomSerializer(serializers.ModelSerializer):
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)

    class Meta:
        model = Room
        fields = ('id', 'room_number', 'room_type', 'room_type_display', 'daily_rate', 'capacity', 'status', 'notes')

class DailyCareLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.full_name')

    class Meta:
        model = DailyCareLog
        fields = ('id', 'booking', 'care_type', 'notes', 'staff', 'staff_name', 'logged_at')
        read_only_fields = ('id', 'logged_at')

class BoardingChecklistSerializer(serializers.ModelSerializer):
    checkin_staff_name = serializers.ReadOnlyField(source='checkin_staff.full_name')
    checkout_staff_name = serializers.ReadOnlyField(source='checkout_staff.full_name')

    class Meta:
        model = BoardingChecklist
        fields = '__all__'
        read_only_fields = ('id', 'booking')

class BoardingBookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    room_number = serializers.ReadOnlyField(source='room.room_number')
    room_type = serializers.ReadOnlyField(source='room.room_type')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    checklist = BoardingChecklistSerializer(read_only=True)

    class Meta:
        model = BoardingBooking
        fields = (
            'id', 'booking_id', 'customer', 'customer_name', 'customer_phone',
            'pet', 'pet_name', 'pet_species', 'room', 'room_number', 'room_type',
            'package', 'check_in_date', 'expected_check_out_date', 'actual_check_out_date',
            'feeding_instructions', 'medication_instructions', 'special_instructions',
            'emergency_contact', 'status', 'status_display', 'total_cost', 'payment_status',
            'checklist', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'booking_id', 'created_at', 'updated_at')

    def validate(self, attrs):
        check_in = attrs.get('check_in_date') or (self.instance.check_in_date if self.instance else None)
        expected_out = attrs.get('expected_check_out_date') or (self.instance.expected_check_out_date if self.instance else None)
        room = attrs.get('room') or (self.instance.room if self.instance else None)

        if check_in and expected_out and check_in > expected_out:
            raise serializers.ValidationError({"expected_check_out_date": "Check-out date cannot be before check-in date."})

        # Room availability check
        if room and check_in and expected_out:
            conflicts = BoardingBooking.objects.filter(
                room=room,
                status__in=[BoardingBooking.Status.RESERVED, BoardingBooking.Status.CHECKED_IN]
            )
            if self.instance:
                conflicts = conflicts.exclude(id=self.instance.id)

            overlapping = conflicts.filter(
                check_in_date__lt=expected_out,
                expected_check_out_date__gt=check_in
            )
            if overlapping.exists():
                raise serializers.ValidationError({"room": f"Room {room.room_number} is already booked for these dates."})

        return attrs
