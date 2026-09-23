import os
import uuid
from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
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
        if not (user.role == User.Role.ADMIN or user.is_superuser):
            raise PermissionDenied("Only administrators can create staff or user accounts.")
        serializer.save()

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            role_upper = role.upper()
            if role_upper in ['TEAM', 'ALL_TEAM']:
                queryset = queryset.filter(role__in=[User.Role.STAFF, User.Role.ADMIN])
            elif ',' in role_upper:
                roles = [r.strip() for r in role_upper.split(',') if r.strip()]
                queryset = queryset.filter(role__in=roles)
            else:
                queryset = queryset.filter(role=role_upper)
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
    permission_classes = [IsStaffOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminCreateUserSerializer
        return UserSerializer

    def perform_update(self, serializer):
        user = self.request.user
        if not (user.role == User.Role.ADMIN or user.is_superuser):
            raise PermissionDenied("Only administrators can modify staff or user accounts.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not (user.role == User.Role.ADMIN or user.is_superuser):
            raise PermissionDenied("Only administrators can delete staff accounts.")
        if instance == user:
            raise PermissionDenied("You cannot delete your own account.")
        instance.delete()

class UploadAvatarView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file') or request.FILES.get('avatar') or request.FILES.get('image')
        if not file_obj:
            return Response({'detail': 'No image file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in allowed_extensions:
            return Response(
                {'detail': f'Unsupported file format "{ext}". Allowed formats: JPG, PNG, GIF, WEBP, SVG.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if file_obj.size > 10 * 1024 * 1024:
            return Response({'detail': 'Image size exceeds 10MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"avatars/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, file_obj)

        file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)

        if request.user and request.user.is_authenticated and request.query_params.get('save_to_user', 'false').lower() == 'true':
            request.user.avatar = file_url
            request.user.save(update_fields=['avatar'])

        return Response({
            'url': file_url,
            'path': saved_path,
            'message': 'Image uploaded successfully.'
        }, status=status.HTTP_201_CREATED)
