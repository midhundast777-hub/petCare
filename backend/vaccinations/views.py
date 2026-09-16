from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import date, timedelta
from django.db.models import Q
from .models import Vaccination
from .serializers import VaccinationSerializer
from pets.models import Pet

class VaccinationListCreateView(generics.ListCreateAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Vaccination.objects.select_related('pet', 'pet__owner').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(pet__owner__user=user)

        pet_id = self.request.query_params.get('pet')
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)

        status_param = self.request.query_params.get('status')
        today = date.today()
        if status_param == 'EXPIRED':
            queryset = queryset.filter(expiry_date__lt=today)
        elif status_param == 'EXPIRING_SOON':
            queryset = queryset.filter(expiry_date__gte=today, expiry_date__lte=today + timedelta(days=30))
        elif status_param == 'VALID':
            queryset = queryset.filter(expiry_date__gt=today + timedelta(days=30))

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(vaccine_name__icontains=search) |
                Q(pet__name__icontains=search) |
                Q(veterinarian__icontains=search) |
                Q(certificate_number__icontains=search)
            )

        return queryset

class VaccinationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Vaccination.objects.filter(pet__owner__user=user)
        return Vaccination.objects.all()

class PetVaccinationCheckView(APIView):
    """Checks if a pet has expired vaccinations before booking."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pet_id):
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        vaccinations = Vaccination.objects.filter(pet=pet)
        expired = vaccinations.filter(expiry_date__lt=today)
        expiring_soon = vaccinations.filter(expiry_date__gte=today, expiry_date__lte=today + timedelta(days=30))

        is_safe_to_book = not expired.exists()

        return Response({
            'pet_id': pet.id,
            'pet_name': pet.name,
            'is_safe_to_book': is_safe_to_book,
            'total_vaccinations': vaccinations.count(),
            'expired_count': expired.count(),
            'expiring_soon_count': expiring_soon.count(),
            'expired_vaccines': [v.vaccine_name for v in expired],
            'expiring_soon_vaccines': [v.vaccine_name for v in expiring_soon],
            'warning': "Warning: Pet has expired vaccinations!" if not is_safe_to_book else None
        })
