from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Appointment
from .serializers import AppointmentSerializer
from customers.models import Customer
from users.permissions import IsStaffOrAdmin

class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related('customer', 'pet', 'service', 'staff').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(customer__user=user)
        elif self.request.query_params.get('my_assignments') == 'true' and user.role == 'STAFF':
            queryset = queryset.filter(staff=user)

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        pet_id = self.request.query_params.get('pet')
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)

        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(appointment_id__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search) |
                Q(pet__name__icontains=search) |
                Q(service__name__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            customer = Customer.objects.filter(user=user).first()
            if not customer:
                customer = Customer.objects.filter(email__iexact=user.email).first()
                if customer and not customer.user:
                    customer.user = user
                    customer.save(update_fields=['user'])
            if not customer:
                pet_id = self.request.data.get('pet')
                if pet_id:
                    from pets.models import Pet
                    pet_obj = Pet.objects.filter(id=pet_id).first()
                    if pet_obj and pet_obj.owner:
                        customer = pet_obj.owner
                        if not customer.user:
                            customer.user = user
                            customer.save(update_fields=['user'])
            if customer:
                serializer.save(customer=customer, status=Appointment.Status.PENDING)
            else:
                serializer.save(status=Appointment.Status.PENDING)
        else:
            if not serializer.validated_data.get('customer'):
                pet = serializer.validated_data.get('pet')
                if pet and pet.owner:
                    serializer.save(customer=pet.owner)
                    return
            serializer.save()

class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Appointment.objects.filter(customer__user=user)
        return Appointment.objects.all()

class AppointmentStatusUpdateView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status and new_status in Appointment.Status.values:
            appointment.status = new_status
            appointment.save()
            return Response(AppointmentSerializer(appointment).data)
        return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
