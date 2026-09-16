from rest_framework import generics, permissions, filters
from django.db.models import Q
from .models import Customer, CustomerNote
from .serializers import CustomerSerializer, CustomerDetailSerializer, CustomerNoteSerializer
from users.permissions import IsStaffOrAdmin

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Customer.objects.filter(user=user)
        
        queryset = Customer.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(customer_id__icontains=search)
            )
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status.upper())
        return queryset

    def perform_create(self, serializer):
        serializer.save()

class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CustomerDetailSerializer
        return CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Customer.objects.filter(user=user)
        return Customer.objects.all()

class CustomerNoteCreateView(generics.CreateAPIView):
    serializer_class = CustomerNoteSerializer
    permission_classes = [IsStaffOrAdmin]

    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_id')
        customer = Customer.objects.get(id=customer_id)
        serializer.save(customer=customer, author=self.request.user)

class CustomerNotesListView(generics.ListAPIView):
    serializer_class = CustomerNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return CustomerNote.objects.filter(customer_id=customer_id)
