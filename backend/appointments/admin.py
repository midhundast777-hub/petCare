from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('appointment_id', 'customer', 'pet', 'service', 'staff', 'date', 'start_time', 'status', 'amount')
    list_filter = ('status', 'date', 'service')
    search_fields = ('appointment_id', 'customer__first_name', 'customer__last_name', 'pet__name')
