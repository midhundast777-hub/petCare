from django.urls import path
from .views import (
    RoomListCreateView,
    RoomDetailView,
    BoardingBookingListCreateView,
    BoardingBookingDetailView,
    BoardingChecklistView,
    DailyCareLogListCreateView,
    DailyCareLogDetailView,
    PetDiaryListView
)

urlpatterns = [
    path('rooms/', RoomListCreateView.as_view(), name='room_list_create'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room_detail'),
    path('bookings/', BoardingBookingListCreateView.as_view(), name='boarding_booking_list_create'),
    path('bookings/<int:pk>/', BoardingBookingDetailView.as_view(), name='boarding_booking_detail'),
    path('bookings/<int:booking_id>/checklist/', BoardingChecklistView.as_view(), name='boarding_checklist'),
    path('bookings/<int:booking_id>/care-logs/', DailyCareLogListCreateView.as_view(), name='daily_care_logs'),
    path('bookings/<int:booking_id>/diary/', DailyCareLogListCreateView.as_view(), name='booking_digital_diary'),
    path('care-logs/<int:pk>/', DailyCareLogDetailView.as_view(), name='daily_care_log_detail'),
    path('diary/<int:pk>/', DailyCareLogDetailView.as_view(), name='digital_diary_detail'),
    path('pets/<int:pet_id>/diary/', PetDiaryListView.as_view(), name='pet_digital_diary'),
]

