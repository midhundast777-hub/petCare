from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        STAFF = 'STAFF', 'Staff'
        CUSTOMER = 'CUSTOMER', 'Customer'

    email = models.EmailField('email address', unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=25, blank=True)
    avatar = models.TextField(blank=True, default='')
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['-created_at']

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    def __str__(self):
        return f"{self.email} ({self.role})"

class VerificationCode(models.Model):
    class CodeType(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        PHONE = 'PHONE', 'Phone'

    destination = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=10)
    code_type = models.CharField(max_length=10, choices=CodeType.choices, default=CodeType.EMAIL)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        from django.utils import timezone
        return not self.is_verified and timezone.now() <= self.expires_at

    def __str__(self):
        return f"{self.code_type} code for {self.destination}: {self.code}"

class LoginVerification(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_verifications')
    email = models.EmailField(db_index=True)
    token = models.CharField(max_length=120, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    ip_address = models.CharField(max_length=100, blank=True, default='')
    user_agent = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        from django.utils import timezone
        return self.status == self.Status.PENDING and timezone.now() <= self.expires_at

    def __str__(self):
        return f"LoginVerification({self.email}, {self.status}) - {self.token[:8]}"


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    email = models.EmailField(db_index=True)
    token = models.CharField(max_length=128, unique=True, db_index=True)
    is_used = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_token_for_user(cls, user, ip_address=''):
        from django.utils import timezone
        from datetime import timedelta
        import secrets
        # Invalidate previous unused tokens for this user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        # Cryptographically secure random token (48 bytes URL safe = 64 characters)
        token = secrets.token_urlsafe(48)
        # 30 minutes expiration
        expires_at = timezone.now() + timedelta(minutes=30)
        return cls.objects.create(
            user=user,
            email=user.email,
            token=token,
            is_used=False,
            expires_at=expires_at,
            ip_address=ip_address or ''
        )

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"EmailVerificationToken({self.email}, used={self.is_used}, expires={self.expires_at})"

