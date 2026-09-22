from rest_framework import serializers
from .models import Room, BoardingBooking, BoardingChecklist, DailyCareLog
from customers.models import Customer
from pets.models import Pet

class RoomSerializer(serializers.ModelSerializer):
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    current_booking_id = serializers.SerializerMethodField()
    current_guest_name = serializers.SerializerMethodField()
    current_booking_status = serializers.SerializerMethodField()
    effective_status = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = (
            'id', 'room_number', 'room_type', 'room_type_display',
            'daily_rate', 'capacity', 'status', 'notes',
            'current_booking_id', 'current_guest_name', 'current_booking_status', 'effective_status'
        )

    def _get_active_or_reserved_booking(self, obj):
        # Prefer checked-in active booking, then upcoming reserved booking
        b = obj.bookings.filter(status=BoardingBooking.Status.CHECKED_IN).first()
        if not b:
            b = obj.bookings.filter(status=BoardingBooking.Status.RESERVED).first()
        return b

    def get_current_booking_id(self, obj):
        b = self._get_active_or_reserved_booking(obj)
        return b.booking_id if b else None

    def get_current_guest_name(self, obj):
        b = self._get_active_or_reserved_booking(obj)
        return b.pet.name if b and b.pet else None

    def get_current_booking_status(self, obj):
        b = self._get_active_or_reserved_booking(obj)
        return b.status if b else None

    def get_effective_status(self, obj):
        if obj.status == Room.Status.MAINTENANCE:
            return 'MAINTENANCE'
        b = self._get_active_or_reserved_booking(obj)
        if b:
            return b.status
        return 'AVAILABLE'

class DailyCareLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.full_name')

    class Meta:
        model = DailyCareLog
        fields = ('id', 'booking', 'care_type', 'notes', 'staff', 'staff_name', 'logged_at')
        read_only_fields = ('id', 'booking', 'staff', 'logged_at')

class BoardingChecklistSerializer(serializers.ModelSerializer):
    checkin_staff_name = serializers.ReadOnlyField(source='checkin_staff.full_name')
    checkout_staff_name = serializers.ReadOnlyField(source='checkout_staff.full_name')

    class Meta:
        model = BoardingChecklist
        fields = '__all__'
        read_only_fields = ('id', 'booking')

class BoardingBookingSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)
    pet = serializers.PrimaryKeyRelatedField(queryset=Pet.objects.all(), required=False, allow_null=True)
    check_in_date = serializers.DateField(required=False)
    expected_check_out_date = serializers.DateField(required=False, allow_null=True)
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    pet_name = serializers.ReadOnlyField(source='pet.name')
    pet_species = serializers.ReadOnlyField(source='pet.species')
    pet_breed = serializers.ReadOnlyField(source='pet.breed')
    pet_photo = serializers.ReadOnlyField(source='pet.photo')
    room_number = serializers.ReadOnlyField(source='room.room_number')
    room_type = serializers.ReadOnlyField(source='room.room_type')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    checklist = BoardingChecklistSerializer(read_only=True)

    class Meta:
        model = BoardingBooking
        fields = (
            'id', 'booking_id', 'customer', 'customer_name', 'customer_phone',
            'pet', 'pet_name', 'pet_species', 'pet_breed', 'pet_photo', 'room', 'room_number', 'room_type',
            'package', 'check_in_date', 'check_in_time', 'expected_check_out_date', 'check_out_time', 'actual_check_out_date',
            'feeding_instructions', 'medication_instructions', 'special_instructions',
            'emergency_contact', 'status', 'status_display', 'stay_photo', 'stay_photo_updated_at',
            'total_cost', 'payment_status', 'checklist', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'booking_id', 'created_at', 'updated_at')

    def validate(self, attrs):
        # Support fallback from dropOffDate / pickUpDate
        if not attrs.get('check_in_date') and self.initial_data.get('dropOffDate'):
            attrs['check_in_date'] = self.initial_data.get('dropOffDate')
        if not attrs.get('expected_check_out_date'):
            if self.initial_data.get('pickUpDate'):
                attrs['expected_check_out_date'] = self.initial_data.get('pickUpDate')
            elif attrs.get('check_in_date'):
                attrs['expected_check_out_date'] = attrs.get('check_in_date')

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
