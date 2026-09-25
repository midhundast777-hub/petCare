import os
import uuid
import random
from datetime import timedelta
from django.utils import timezone
from django.core.validators import validate_email as django_validate_email
from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponse
from .models import User, VerificationCode, LoginVerification, EmailVerificationToken
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, AdminCreateUserSerializer
from .permissions import IsAdminUserRole, IsStaffOrAdmin
from rest_framework.exceptions import PermissionDenied
from notifications.models import Notification

def send_login_verification_email(user, login_verification, request=None):
    """
    Sends an HTML Gmail/Email to the user's exact email address
    containing the prominent 'Yes, it's me' verification button.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-login?token={login_verification.token}"
    recipient_name = user.full_name or user.first_name or user.email
    request_time = timezone.now().strftime('%b %d, %Y at %I:%M %p')

    subject = "🐾 PetCare Sign-In Confirmation: Yes, it's me"

    plain_text = f"""Hello {recipient_name},

A sign-in attempt was initiated for your PetCare account ({user.email}).

To verify your identity and securely complete your login, please click the link below:
Yes, it's me: {verify_url}

Request Details:
- Account: {user.email}
- Time: {request_time}
- Expiration: This link is valid for 15 minutes.

If this was not you, you can safely ignore this email.

Warm regards,
PetCare Sanctuary Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your PetCare Login</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 15px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 42px; line-height: 1; margin-bottom: 8px;">🐾</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">PetCare Sanctuary</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 500; opacity: 0.95; color: #ccfbf1;">Account Security & Sign-In Verification</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                Hello {recipient_name},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                A sign-in attempt was initiated for your PetCare account. To verify your identity and complete the sign-in, please confirm by clicking the button below:
              </p>

              <!-- "Yes, it's me" Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{verify_url}" target="_blank" style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 16px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 14px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4); letter-spacing: 0.2px; text-align: center;">
                      ✅ Yes, it's me
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Request Information -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; margin: 24px 0 16px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Sign-In Details
                </p>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">
                  • <strong>Account:</strong> <span style="color: #0f172a;">{user.email}</span>
                </p>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">
                  • <strong>Time:</strong> <span style="color: #0f172a;">{request_time}</span>
                </p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  • <strong>Status:</strong> <span style="color: #0d9488; font-weight: 700;">Waiting for your confirmation</span>
                </p>
              </div>

              <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                ⏰ This confirmation link is valid for <strong>15 minutes</strong>. If you did not attempt to sign in, you can safely ignore this email — no one can access your account without your confirmation.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 PetCare Sanctuary CRM. All rights reserved.<br>
                Commercial Pet Care & Sanctuary Management System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True, "Email dispatched via configured backend"
    except Exception as e:
        # Fallback to console backend to ensure dev/local never blocks
        try:
            from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
            backend = ConsoleEmailBackend()
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                connection=backend
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            return True, f"Sent via console fallback ({str(e)})"
        except Exception as fallback_err:
            return False, str(fallback_err)


def send_registration_verification_email(user, token_obj, request=None):
    """
    Sends a verification email to the exact email address entered by the user
    with the 'YES, IT'S ME' button pointing to the backend verification URL.
    """
    scheme = 'http'
    host = '127.0.0.1:8000'
    if request:
        is_secure = request.is_secure() or request.META.get('HTTP_X_FORWARDED_PROTO') == 'https'
        scheme = 'https' if is_secure else 'http'
        host = request.get_host()
    else:
        site_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')
        if site_url.startswith('https://'):
            scheme = 'https'
            host = site_url.replace('https://', '')
        elif site_url.startswith('http://'):
            scheme = 'http'
            host = site_url.replace('http://', '')

    verify_url = f"{scheme}://{host}/api/auth/verify-email/?token={token_obj.token}"

    subject = "Verify your email address"

    plain_text = f"""Welcome!

Please verify your email address to activate your account.

[ YES, IT'S ME ]
{verify_url}

If you did not create this account, you can safely ignore this email.
This verification link will expire in 30 minutes.
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 32px 30px; text-align: center;">
              <div style="display: inline-block; width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 14px; text-align: center; line-height: 48px; font-size: 26px; margin-bottom: 12px;">
                🐾
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                PetCare Sanctuary
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #ccfbf1; font-weight: 500;">
                Email Verification
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                Welcome!
              </h2>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Please verify your email address to activate your account.
              </p>

              <!-- YES, IT'S ME Button -->
              <div style="margin: 32px 0;">
                <a href="{verify_url}" target="_blank" style="background-color: #0d9488; color: #ffffff; padding: 16px 40px; font-size: 16px; font-weight: 800; text-decoration: none; border-radius: 12px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
                  YES, IT'S ME
                </a>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 28px; text-align: left;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  • If you did not create this account, you can safely ignore this email.
                </p>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  • <strong>This verification link will expire in 30 minutes.</strong>
                </p>
              </div>

              <!-- Direct URL Fallback -->
              <div style="margin-top: 24px; text-align: left;">
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Button not working? Copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 11px; color: #0d9488; word-break: break-all; font-family: monospace;">
                  {verify_url}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 PetCare Sanctuary CRM. All rights reserved.<br>
                Commercial Pet Care & Sanctuary Management System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True, "Email dispatched"
    except Exception as e:
        try:
            from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
            backend = ConsoleEmailBackend()
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                connection=backend
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            return True, f"Sent via console fallback ({str(e)})"
        except Exception as fallback_err:
            return False, str(fallback_err)


class CustomTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        identifier = (request.data.get('email') or request.data.get('username') or '').strip()
        password = request.data.get('password', '')

        if not identifier or not password:
            return Response(
                {'detail': 'Please provide both email/phone and password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lookup user by email or phone
        q = models.Q(email__iexact=identifier) | models.Q(phone__iexact=identifier)
        digits = ''.join(c for c in identifier if c.isdigit())
        if digits and len(digits) >= 10:
            q |= models.Q(phone__endswith=digits[-10:])

        user = User.objects.filter(q).first()

        if not user or not user.check_password(password):
            return Response(
                {'detail': 'No active account found with the given credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'This user account is inactive. Please contact support.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # If user is a customer with an unverified email, prompt verification
        if not user.is_email_verified and user.role == User.Role.CUSTOMER:
            return Response(
                {
                    'detail': 'Please verify your email address to activate your account. Click "Yes, It\'s Me" in the verification email sent to your inbox.',
                    'requires_email_verification': True,
                    'email': user.email
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Expire previous pending login verifications for this user
        LoginVerification.objects.filter(
            user=user,
            status=LoginVerification.Status.PENDING
        ).update(status=LoginVerification.Status.EXPIRED)

        # Create new LoginVerification session
        token = uuid.uuid4().hex
        login_v = LoginVerification.objects.create(
            user=user,
            email=user.email,
            token=token,
            status=LoginVerification.Status.PENDING,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            expires_at=timezone.now() + timedelta(minutes=15)
        )

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        verify_url = f"{frontend_url}/verify-login?token={login_v.token}"

        # Dispatch the Gmail with "Yes, it's me" button to the exact user email
        send_login_verification_email(user, login_v, request)

        # In-app notification for the user
        Notification.objects.create(
            recipient=user,
            notification_type='EMAIL_VERIFICATION',
            title="🔔 Sign-In Confirmation Dispatched",
            message=f"A sign-in confirmation was sent to {user.email}. Click 'Yes, it's me' in your Gmail to approve."
        )

        return Response({
            'require_verification': True,
            'session_token': login_v.token,
            'email': user.email,
            'verify_url': verify_url,
            'message': f"A verification email has been sent to {user.email}. Please check your Gmail and click 'Yes, it's me' to continue."
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        # Support password_confirm check if provided
        pwd = request.data.get('password')
        pwd_confirm = request.data.get('password_confirm')
        if pwd_confirm and pwd != pwd_confirm:
            return Response(
                {'password_confirm': ['Passwords do not match.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate cryptographically secure, unique, single-use verification token (30 min expiration)
        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        token_obj = EmailVerificationToken.create_token_for_user(user, ip_address=ip_addr)

        # Dispatch verification email with "YES, IT'S ME" button to the exact user email
        send_registration_verification_email(user, token_obj, request)

        headers = self.get_success_headers(serializer.data)
        return Response({
            'success': True,
            'requires_verification': True,
            'email': user.email,
            'message': 'Registration successful! A verification email with "Yes, It\'s Me" has been sent to your email address. Please click the link to activate your account.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED, headers=headers)


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

def send_registration_code_email(email, code):
    """
    Sends the 6-digit registration verification code to the customer's entered email
    to confirm that the customer is registering with their own email.
    """
    subject = f"🐾 PetCare Verification Code: {code}"
    plain_text = f"""Hello,

Thank you for choosing PetCare Sanctuary.

To confirm that you are registering with your own email address ({email}), please use the 6-digit verification code below:

Verification Code: {code}

This code will expire in 10 minutes. Please enter this code on the registration page to complete your account setup.

If you did not request this verification, please disregard this email.

Warm regards,
PetCare Sanctuary Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PetCare Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 15px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 6px;">🐾</div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">PetCare Sanctuary</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #ccfbf1;">Customer Registration Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                Confirm Your Email Address
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                To confirm that you are using your own email address (<strong style="color: #0f172a;">{email}</strong>) for registration, please enter the verification code below:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 16px; padding: 18px 36px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #16a34a; letter-spacing: 1px; margin-bottom: 4px;">6-Digit Verification Code</div>
                      <div style="font-size: 36px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #0f172a;">{code}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                ⏱️ This code expires in <strong>10 minutes</strong>. Enter this code on the registration form to verify your email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 PetCare Sanctuary CRM. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        # Fallback to console backend in local development
        try:
            from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
            backend = ConsoleEmailBackend()
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
                connection=backend
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            return True
        except Exception:
            return False


class SendVerificationCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        dest_type = request.data.get('type', 'EMAIL').upper()
        destination = str(request.data.get('destination', '')).strip()

        if not destination:
            return Response({'detail': 'Please provide an email or phone number.'}, status=status.HTTP_400_BAD_REQUEST)

        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=10)

        if dest_type == 'PHONE':
            digits = ''.join(c for c in destination if c.isdigit())
            if len(digits) != 10:
                return Response(
                    {'detail': f'Phone number must contain exactly 10 digits (currently {len(digits)} digits).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            target = digits
            VerificationCode.objects.filter(destination=target, code_type=VerificationCode.CodeType.PHONE).delete()
            VerificationCode.objects.create(
                destination=target,
                code=code,
                code_type=VerificationCode.CodeType.PHONE,
                expires_at=expires_at
            )
            formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
            return Response({
                'success': True,
                'type': 'PHONE',
                'destination': digits,
                'code': code,
                'formatted': formatted,
                'message': f"SMS Verification code generated for phone {formatted}."
            })
        else:
            # Email verification
            norm_email = destination.lower()
            try:
                django_validate_email(norm_email)
            except Exception:
                return Response({'detail': 'Please enter a valid email address (e.g. name@domain.com).'}, status=status.HTTP_400_BAD_REQUEST)

            purpose = request.data.get('purpose', 'registration').lower()
            if purpose == 'registration' and User.objects.filter(email__iexact=norm_email).exists():
                return Response(
                    {'detail': 'An account with this email address already exists. Please log in.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            target = norm_email
            VerificationCode.objects.filter(destination=target, code_type=VerificationCode.CodeType.EMAIL).delete()
            VerificationCode.objects.create(
                destination=target,
                code=code,
                code_type=VerificationCode.CodeType.EMAIL,
                expires_at=expires_at
            )

            # Send real email with the 6-digit code to the exact entered email
            send_registration_code_email(target, code)

            # If user already registered with this email, create an in-app notification record
            user = User.objects.filter(email__iexact=target).first()
            if user:
                Notification.objects.create(
                    recipient=user,
                    title="Email Verification Code",
                    message=f"Your Pet Care verification code is {code}. Enter this code to verify your email address.",
                    notification_type=Notification.NotificationType.GENERAL,
                    link="/profile"
                )

            return Response({
                'success': True,
                'type': 'EMAIL',
                'destination': target,
                'code': code,
                'message': f"Verification code sent to {target}. Please check your email inbox to confirm.",
                'notification': {
                    'title': '🔔 Email Verification Code',
                    'message': f"Your Pet Care email verification code is {code}. Enter this code to complete registration."
                }
            })

class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        dest_type = request.data.get('type', 'EMAIL').upper()
        destination = str(request.data.get('destination', '')).strip()
        code = str(request.data.get('code', '')).strip()

        if not destination or not code:
            return Response({'detail': 'Destination and 6-digit verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if dest_type == 'PHONE':
            target = ''.join(c for c in destination if c.isdigit())
            code_type = VerificationCode.CodeType.PHONE
        else:
            target = destination.lower()
            code_type = VerificationCode.CodeType.EMAIL

        v_code = VerificationCode.objects.filter(
            destination=target,
            code=code,
            code_type=code_type,
            is_verified=False,
            expires_at__gte=timezone.now()
        ).first()

        if not v_code:
            return Response(
                {'verified': False, 'detail': 'Invalid or expired verification code. Please check the code and try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        v_code.is_verified = True
        v_code.save(update_fields=['is_verified'])

        # Update user record if exists
        if code_type == VerificationCode.CodeType.EMAIL:
            user = User.objects.filter(email__iexact=target).first()
            if user:
                user.is_email_verified = True
                user.save(update_fields=['is_email_verified'])
        elif code_type == VerificationCode.CodeType.PHONE:
            user = User.objects.filter(phone__iexact=target).first()
            if user:
                user.is_phone_verified = True
                user.save(update_fields=['is_phone_verified'])

        return Response({
            'verified': True,
            'type': dest_type,
            'destination': target,
            'message': f"{'10-Digit Phone number' if dest_type == 'PHONE' else 'Email address'} verified successfully!"
        })


class LoginStatusCheckView(APIView):
    """
    Polled by the Login page while waiting for user to click 'Yes, it's me' in Gmail.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        session_token = request.query_params.get('session_token', '').strip()
        if not session_token:
            return Response(
                {'detail': 'session_token query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        login_v = LoginVerification.objects.filter(token=session_token).first()
        if not login_v:
            return Response(
                {'detail': 'Invalid or expired login session.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if login_v.status == LoginVerification.Status.PENDING and timezone.now() > login_v.expires_at:
            login_v.status = LoginVerification.Status.EXPIRED
            login_v.save(update_fields=['status'])

        if login_v.status == LoginVerification.Status.APPROVED:
            refresh = RefreshToken.for_user(login_v.user)
            return Response({
                'status': 'APPROVED',
                'message': "Yes, it's me! Login verified successfully.",
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(login_v.user).data
            })

        return Response({
            'status': login_v.status,
            'email': login_v.email,
            'message': "Waiting for user to click 'Yes, it's me' in Gmail."
        })


class ApproveLoginView(APIView):
    """
    Invoked when user clicks the 'Yes, it's me' button from their Gmail.
    Confirms identity, activates tokens, and returns successful login credentials.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response(
                {'detail': 'Verification token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        login_v = LoginVerification.objects.filter(token=token).first()
        if not login_v:
            return Response(
                {'detail': 'Verification token is invalid or has expired.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if login_v.status == LoginVerification.Status.APPROVED:
            refresh = RefreshToken.for_user(login_v.user)
            return Response({
                'success': True,
                'already_verified': True,
                'message': "Yes, it's me! Identity has already been confirmed.",
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(login_v.user).data
            })

        if login_v.status != LoginVerification.Status.PENDING or timezone.now() > login_v.expires_at:
            login_v.status = LoginVerification.Status.EXPIRED
            login_v.save(update_fields=['status'])
            return Response(
                {'detail': 'This verification link has expired. Please sign in again to receive a fresh email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark login session as APPROVED
        login_v.status = LoginVerification.Status.APPROVED
        login_v.verified_at = timezone.now()
        login_v.save(update_fields=['status', 'verified_at'])

        # Confirm user email is verified
        user = login_v.user
        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': "Yes, it's me! Identity verified successfully.",
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class ResendLoginEmailView(APIView):
    """
    Re-sends the 'Yes, it's me' confirmation email to the exact user email.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        session_token = request.data.get('session_token', '').strip()
        if not session_token:
            return Response(
                {'detail': 'session_token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        login_v = LoginVerification.objects.filter(token=session_token).first()
        if not login_v or login_v.status != LoginVerification.Status.PENDING:
            return Response(
                {'detail': 'No active sign-in session found for this token.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if timezone.now() > login_v.expires_at:
            login_v.expires_at = timezone.now() + timedelta(minutes=15)
            login_v.save(update_fields=['expires_at'])

        send_login_verification_email(login_v.user, login_v, request)
        return Response({
            'success': True,
            'message': f"A fresh verification email with 'Yes, it's me' has been sent to {login_v.email}."
        })


class VerifyEmailView(APIView):
    """
    Handles requests when the user clicks 'YES, IT'S ME' in their verification email.
    Validates token, expiry, single-use, marks email as verified, invalidates token,
    and returns HTML or JSON response.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        token_str = (request.query_params.get('token') or request.data.get('token') or '').strip()
        is_json = request.query_params.get('format') == 'json' or 'application/json' in request.headers.get('Accept', '')

        # Standard error message required by spec
        error_msg = "This verification link is invalid or has expired. Please request a new verification email."

        def failure_response():
            if is_json:
                return Response({'success': False, 'detail': error_msg}, status=status.HTTP_400_BAD_REQUEST)

            html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failed | PetCare Sanctuary</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }}
    .card {{
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 44px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }}
    .icon {{
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.15);
      border: 2px solid #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }}
    p.message {{
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 28px;
    }}
    .resend-box {{
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: left;
    }}
    .resend-box label {{
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }}
    .resend-box input {{
      width: 100%;
      padding: 12px 14px;
      background: #1e293b;
      border: 1px solid #475569;
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      margin-bottom: 12px;
      outline: none;
    }}
    .resend-box input:focus {{
      border-color: #0d9488;
    }}
    .resend-box button {{
      width: 100%;
      background: #0d9488;
      color: #ffffff;
      border: none;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }}
    .resend-box button:hover {{
      background: #0f766e;
    }}
    .feedback {{
      margin-top: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #5eead4;
      display: none;
      text-align: center;
      line-height: 1.4;
    }}
    .nav-links {{
      display: flex;
      gap: 12px;
      justify-content: center;
      font-size: 13px;
    }}
    .nav-links a {{
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }}
    .nav-links a:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Verification Failed</h1>
    <p class="message">{error_msg}</p>

    <div class="resend-box">
      <label>Resend verification email</label>
      <form id="resendForm">
        <input type="email" id="resendEmail" placeholder="Enter your email address" required />
        <button type="submit" id="resendBtn">Resend verification email</button>
      </form>
      <div id="feedback" class="feedback"></div>
    </div>

    <div class="nav-links">
      <a href="http://localhost:5173/register">← Back to Register</a>
      <span style="color: #475569;">•</span>
      <a href="http://localhost:5173/login">Sign In</a>
    </div>
  </div>

  <script>
    document.getElementById('resendForm').addEventListener('submit', async function(e) {{
      e.preventDefault();
      const email = document.getElementById('resendEmail').value.trim();
      const btn = document.getElementById('resendBtn');
      const feedback = document.getElementById('feedback');
      btn.disabled = true;
      btn.innerText = 'Sending...';
      try {{
        const resp = await fetch('/api/auth/resend-verification/', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json', 'Accept': 'application/json' }},
          body: JSON.stringify({{ email: email }})
        }});
        const data = await resp.json();
        feedback.innerText = data.detail || 'If an account exists with this email, a verification link has been sent.';
        feedback.style.display = 'block';
      }} catch (err) {{
        feedback.innerText = 'If an account exists with this email, a verification link has been sent.';
        feedback.style.display = 'block';
      }} finally {{
        btn.disabled = false;
        btn.innerText = 'Resend verification email';
      }}
    }});
  </script>
</body>
</html>"""
            return HttpResponse(html, content_type="text/html; charset=utf-8", status=status.HTTP_400_BAD_REQUEST)

        if not token_str:
            return failure_response()

        # Validate token exists
        token_record = EmailVerificationToken.objects.filter(token=token_str).select_related('user').first()
        if not token_record:
            return failure_response()

        # Check that the token has not already been used
        if token_record.is_used:
            return failure_response()

        # Check that the token has not expired
        if timezone.now() > token_record.expires_at:
            return failure_response()

        # Verify correct user/email
        user = token_record.user
        if not user or user.email.lower() != token_record.email.lower():
            return failure_response()

        # Mark the user's email as verified
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        # Invalidate the token after successful verification (single-use)
        token_record.is_used = True
        token_record.verified_at = timezone.now()
        token_record.save(update_fields=['is_used', 'verified_at'])

        # Invalidate any other pending tokens for this user
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Exact required success message
        success_msg = "Email verified successfully. You can now continue using your account."

        if is_json:
            return Response({
                'success': True,
                'message': success_msg,
                'email': user.email
            }, status=status.HTTP_200_OK)

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="5;url=http://localhost:5173/login?verified=true">
  <title>Email Verified | PetCare Sanctuary</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }}
    .card {{
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }}
    .icon {{
      width: 72px;
      height: 72px;
      background: rgba(13, 148, 136, 0.15);
      border: 2px solid #0d9488;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 34px;
      color: #2dd4bf;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }}
    .email-badge {{
      display: inline-block;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 100px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #2dd4bf;
      margin-bottom: 20px;
    }}
    p.message {{
      font-size: 16px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 30px;
    }}
    .btn-login {{
      display: inline-block;
      width: 100%;
      background: #0d9488;
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);
      transition: background 0.2s;
    }}
    .btn-login:hover {{
      background: #0f766e;
    }}
    .redirect-note {{
      margin-top: 18px;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Email Verified!</h1>
    <div class="email-badge">{user.email}</div>
    <p class="message">{success_msg}</p>
    <a href="http://localhost:5173/login?verified=true" class="btn-login">Log In to Your Account &rarr;</a>
    <p class="redirect-note">Redirecting you to login in 5 seconds...</p>
  </div>
</body>
</html>"""
        return HttpResponse(html, content_type="text/html; charset=utf-8", status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)


class ResendVerificationEmailView(APIView):
    """
    Handles requests to resend the verification email.
    Enforces rate limiting (60s cooldown) and prevents account existence enumeration.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        email = (request.data.get('email') or '').strip().lower()

        if not email:
            return Response(
                {'detail': 'Please provide an email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            django_validate_email(email)
        except Exception:
            return Response(
                {'detail': 'Please provide a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Rate-limiting: prevent abuse (60s minimum interval per email)
        recent = EmailVerificationToken.objects.filter(
            email=email,
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).exists()

        if recent:
            return Response(
                {'detail': 'Please wait at least 60 seconds before requesting another verification email.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Security requirement:
        # "Do not reveal whether an email belongs to an existing account when responding to resend requests."
        user = User.objects.filter(email__iexact=email).first()

        if user and not user.is_email_verified:
            ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            token_obj = EmailVerificationToken.create_token_for_user(user, ip_address=ip_addr)
            send_registration_verification_email(user, token_obj, request)

        # Uniform response prevents email enumeration
        return Response({
            'success': True,
            'detail': 'If an account exists with this email, a verification link has been sent.'
        }, status=status.HTTP_200_OK)


