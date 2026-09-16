from rest_framework import generics, permissions
from .models import Service
from .serializers import ServiceSerializer
from users.permissions import IsStaffOrAdmin

class ServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Service.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        elif self.request.user.role == 'CUSTOMER':
            queryset = queryset.filter(status='ACTIVE')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category.upper())
        return queryset

class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated()]
