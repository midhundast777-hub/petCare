from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import MedicalRecord, Medication, MedicationLog, FeedingSchedule, FeedingLog
from .serializers import (
    MedicalRecordSerializer,
    MedicationSerializer,
    MedicationLogSerializer,
    FeedingScheduleSerializer,
    FeedingLogSerializer
)
from users.permissions import IsStaffOrAdmin

class MedicalRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = MedicalRecord.objects.select_related('pet', 'pet__owner').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(pet__owner__user=user)

        pet_id = self.request.query_params.get('pet')
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(diagnosis__icontains=search) |
                Q(veterinarian__icontains=search) |
                Q(pet__name__icontains=search)
            )

        return queryset

class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return MedicalRecord.objects.filter(pet__owner__user=user)
        return MedicalRecord.objects.all()

class MedicationListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Medication.objects.select_related('pet', 'pet__owner', 'assigned_staff').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(pet__owner__user=user)

        pet_id = self.request.query_params.get('pet')
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        return queryset

class MedicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Medication.objects.filter(pet__owner__user=user)
        return Medication.objects.all()

class MedicationLogCreateView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            medication = Medication.objects.get(pk=pk)
        except Medication.DoesNotExist:
            return Response({'error': 'Medication not found'}, status=status.HTTP_404_NOT_FOUND)

        log = MedicationLog.objects.create(
            medication=medication,
            staff=request.user,
            notes=request.data.get('notes', 'Administered scheduled dose')
        )
        return Response(MedicationLogSerializer(log).data, status=status.HTTP_201_CREATED)

class FeedingScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = FeedingSchedule.objects.select_related('pet', 'pet__owner', 'assigned_staff').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(pet__owner__user=user)

        pet_id = self.request.query_params.get('pet')
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)

        return queryset

class FeedingScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeedingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return FeedingSchedule.objects.filter(pet__owner__user=user)
        return FeedingSchedule.objects.all()

class FeedingLogCreateView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            schedule = FeedingSchedule.objects.get(pk=pk)
        except FeedingSchedule.DoesNotExist:
            return Response({'error': 'Feeding schedule not found'}, status=status.HTTP_404_NOT_FOUND)

        log = FeedingLog.objects.create(
            schedule=schedule,
            staff=request.user,
            amount_eaten=request.data.get('amount_eaten', 'All'),
            notes=request.data.get('notes', 'Fed per schedule')
        )
        schedule.last_fed_at = timezone.now()
        schedule.save()
        return Response(FeedingLogSerializer(log).data, status=status.HTTP_201_CREATED)
