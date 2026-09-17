from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, AdminCreateUserSerializer
from .permissions import IsAdminUserRole, IsStaffOrAdmin
from rest_framework.exceptions import PermissionDenied

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class CheckUserExistsView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        identifier = request.query_params.get('identifier', '').strip()
        email = request.query_params.get('email', '').strip()
        phone = request.query_params.get('phone', '').strip()

        q = models.Q()
        if identifier:
            q |= models.Q(email__iexact=identifier) | models.Q(phone__iexact=identifier)
        if email:
            q |= models.Q(email__iexact=email)
        if phone:
            digits = ''.join(c for c in phone if c.isdigit())
            q |= models.Q(phone__iexact=phone)
            if digits and len(digits) >= 10:
                q |= models.Q(phone__endswith=digits[-10:])

        exists = False
        user_email = ''
        if q:
            user = User.objects.filter(q).first()
            if user:
                exists = True
                user_email = user.email

        return Response({'exists': exists, 'email': user_email})

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsStaffOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateUserSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.role == 'ADMIN' or user.is_superuser):
            raise PermissionDenied("Only administrators can create staff or user accounts.")
        serializer.save()

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role.upper())
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
        return queryset

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminCreateUserSerializer
        return UserSerializer
