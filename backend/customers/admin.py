from django.contrib import admin
from .models import Customer, CustomerNote

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_id', 'full_name', 'email', 'phone', 'city', 'status', 'registration_date')
    search_fields = ('customer_id', 'first_name', 'last_name', 'email', 'phone')
    list_filter = ('status', 'registration_date')

@admin.register(CustomerNote)
class CustomerNoteAdmin(admin.ModelAdmin):
    list_display = ('customer', 'interaction_type', 'author', 'created_at')
    list_filter = ('interaction_type', 'created_at')
