from django.urls import path
from .views import (
    RoomListCreateView,
    RoomDetailView,
    BoardingBookingListCreateView,
    BoardingBookingDetailView,
    BoardingChecklistView,
    DailyCareLogListCreateView
)

urlpatterns = [
    path('rooms/', RoomListCreateView.as_view(), name='room_list_create'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room_detail'),
    path('bookings/', BoardingBookingListCreateView.as_view(), name='boarding_booking_list_create'),
    path('bookings/<int:pk>/', BoardingBookingDetailView.as_view(), name='boarding_booking_detail'),
    path('bookings/<int:booking_id>/checklist/', BoardingChecklistView.as_view(), name='boarding_checklist'),
    path('bookings/<int:booking_id>/care-logs/', DailyCareLogListCreateView.as_view(), name='daily_care_logs'),
]
