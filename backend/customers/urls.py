from django.urls import path
from .views import (
    CustomerListCreateView,
    CustomerDetailView,
    CustomerNoteCreateView,
    CustomerNotesListView
)

urlpatterns = [
    path('', CustomerListCreateView.as_view(), name='customer_list_create'),
    path('<int:pk>/', CustomerDetailView.as_view(), name='customer_detail'),
    path('<int:customer_id>/notes/', CustomerNotesListView.as_view(), name='customer_notes_list'),
    path('<int:customer_id>/notes/create/', CustomerNoteCreateView.as_view(), name='customer_note_create'),
]
