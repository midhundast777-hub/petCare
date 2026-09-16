from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'recipient', 'title', 'message', 'notification_type', 'type_display', 'is_read', 'link', 'created_at')
        read_only_fields = ('id', 'recipient', 'created_at')
