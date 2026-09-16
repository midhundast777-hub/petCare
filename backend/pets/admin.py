from django.contrib import admin
from .models import Pet

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('pet_id', 'name', 'species', 'breed', 'owner', 'gender', 'weight', 'status')
    search_fields = ('pet_id', 'name', 'breed', 'microchip_number', 'owner__first_name', 'owner__last_name')
    list_filter = ('species', 'gender', 'status')
