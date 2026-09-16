from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationGenerateRemindersView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('generate-reminders/', NotificationGenerateRemindersView.as_view(), name='notification_generate_reminders'),
]
