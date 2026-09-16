from django.urls import path
from .views import (
    MedicalRecordListCreateView,
    MedicalRecordDetailView,
    MedicationListCreateView,
    MedicationDetailView,
    MedicationLogCreateView,
    FeedingScheduleListCreateView,
    FeedingScheduleDetailView,
    FeedingLogCreateView
)

urlpatterns = [
    # Medical Records
    path('records/', MedicalRecordListCreateView.as_view(), name='medical_record_list_create'),
    path('records/<int:pk>/', MedicalRecordDetailView.as_view(), name='medical_record_detail'),

    # Medications
    path('medications/', MedicationListCreateView.as_view(), name='medication_list_create'),
    path('medications/<int:pk>/', MedicationDetailView.as_view(), name='medication_detail'),
    path('medications/<int:pk>/log/', MedicationLogCreateView.as_view(), name='medication_log_create'),

    # Feeding
    path('feeding/', FeedingScheduleListCreateView.as_view(), name='feeding_schedule_list_create'),
    path('feeding/<int:pk>/', FeedingScheduleDetailView.as_view(), name='feeding_schedule_detail'),
    path('feeding/<int:pk>/log/', FeedingLogCreateView.as_view(), name='feeding_log_create'),
]
