from django.contrib import admin
from .models import Room, BoardingBooking, BoardingChecklist, DailyCareLog

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'daily_rate', 'status')
    list_filter = ('room_type', 'status')

@admin.register(BoardingBooking)
class BoardingBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'customer', 'pet', 'room', 'package', 'check_in_date', 'expected_check_out_date', 'status')
    list_filter = ('status', 'package', 'payment_status')

@admin.register(BoardingChecklist)
class BoardingChecklistAdmin(admin.ModelAdmin):
    list_display = ('booking', 'checkin_completed', 'checkout_completed')

@admin.register(DailyCareLog)
class DailyCareLogAdmin(admin.ModelAdmin):
    list_display = ('booking', 'care_type', 'staff', 'logged_at')
