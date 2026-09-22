from rest_framework import generics, permissions
from django.db.models import Q
from .models import Pet
from .serializers import PetSerializer, PetDetailSerializer
from customers.models import Customer

class PetListCreateView(generics.ListCreateAPIView):
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Pet.objects.all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(Q(owner__user=user) | Q(owner__email__iexact=user.email))

        # Filters
        species = self.request.query_params.get('species')
        if species:
            queryset = queryset.filter(species=species.upper())

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status.upper())

        owner_id = self.request.query_params.get('owner')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search) |
                Q(microchip_number__icontains=search) |
                Q(owner__first_name__icontains=search) |
                Q(owner__last_name__icontains=search) |
                Q(pet_id__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            # Associate with the customer's profile automatically
            customer = getattr(user, 'customer_profile', None)
            if not customer:
                customer = Customer.objects.filter(user=user).first()
            if not customer:
                customer = Customer.objects.filter(email__iexact=user.email).first()
            if not customer:
                customer, _ = Customer.objects.get_or_create(
                    user=user,
                    defaults={
                        'first_name': user.first_name or 'Valued',
                        'last_name': user.last_name or 'Customer',
                        'email': user.email,
                        'phone': user.phone or '000-000-0000'
                    }
                )
            serializer.save(owner=customer)
        else:
            if not serializer.validated_data.get('owner'):
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'owner': ['Pet owner is required. Please select a customer.']})
            serializer.save()

class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PetDetailSerializer
        return PetSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Pet.objects.filter(owner__user=user)
        return Pet.objects.all()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            customer = getattr(user, 'customer_profile', None) or Customer.objects.filter(user=user).first()
            if customer:
                serializer.save(owner=customer)
            else:
                serializer.save()
        else:
            serializer.save()
