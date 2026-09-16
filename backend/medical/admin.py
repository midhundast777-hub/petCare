from django.contrib import admin
from .models import MedicalRecord, Medication, MedicationLog, FeedingSchedule, FeedingLog

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('pet', 'visit_date', 'veterinarian', 'diagnosis')
    search_fields = ('pet__name', 'diagnosis', 'veterinarian')

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('pet', 'medicine_name', 'dosage', 'frequency', 'status', 'assigned_staff')
    list_filter = ('status',)

@admin.register(FeedingSchedule)
class FeedingScheduleAdmin(admin.ModelAdmin):
    list_display = ('pet', 'food_type', 'quantity', 'feeding_time', 'assigned_staff')
