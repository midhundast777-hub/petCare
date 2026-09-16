from django.contrib import admin
from .models import Vaccination

@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = ('pet', 'vaccine_name', 'vaccination_date', 'expiry_date', 'veterinarian')
    search_fields = ('pet__name', 'vaccine_name', 'veterinarian')
    list_filter = ('expiry_date',)
