from django.urls import path
from .views import VaccinationListCreateView, VaccinationDetailView, PetVaccinationCheckView

urlpatterns = [
    path('', VaccinationListCreateView.as_view(), name='vaccination_list_create'),
    path('<int:pk>/', VaccinationDetailView.as_view(), name='vaccination_detail'),
    path('check-pet/<int:pet_id>/', PetVaccinationCheckView.as_view(), name='vaccination_check_pet'),
]
