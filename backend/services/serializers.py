from rest_framework import serializers
from .models import Service

class ServiceSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Service
        fields = ('id', 'name', 'category', 'category_display', 'description', 'price', 'duration_minutes', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
