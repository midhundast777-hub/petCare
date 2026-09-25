from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.validators import validate_email as django_validate_email
from django.utils import timezone
from datetime import timedelta
from .models import User, VerificationCode

def validate_10_digit_phone(value):
    if not value:
        return value
    digits = ''.join(c for c in str(value) if c.isdigit())
    if len(digits) != 10:
        raise serializers.ValidationError(
            f"Phone number must contain exactly 10 digits (currently {len(digits)} digits)."
        )
    return digits

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 'role',
            'phone', 'avatar', 'is_email_verified', 'is_phone_verified', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def validate_phone(self, value):
        return validate_10_digit_phone(value)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'is_email_verified', 'is_phone_verified')

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email address is required.")
        norm = value.strip().lower()
        try:
            django_validate_email(norm)
        except Exception:
            raise serializers.ValidationError("Please enter a valid email address.")
        if User.objects.filter(email__iexact=norm).exists():
            existing = User.objects.filter(email__iexact=norm).first()
            if existing and not existing.is_email_verified:
                raise serializers.ValidationError(
                    "An account with this email already exists but is not yet verified. Please check your email or request a new verification email."
                )
            raise serializers.ValidationError("An account with this email already exists. Please log in.")

        return norm

    def validate_phone(self, value):
        return validate_10_digit_phone(value)

    def create(self, validated_data):
        from customers.models import Customer
        role = validated_data.get('role', User.Role.CUSTOMER)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            phone=validated_data.get('phone', ''),
            is_email_verified=False,
            is_phone_verified=validated_data.get('is_phone_verified', True)
        )

        if role == User.Role.CUSTOMER:
            existing_cust = Customer.objects.filter(email__iexact=user.email).first()
            if existing_cust:
                if not existing_cust.user:
                    existing_cust.user = user
                    existing_cust.save(update_fields=['user'])
            else:
                Customer.objects.create(
                    user=user,
                    first_name=user.first_name or 'Valued',
                    last_name=user.last_name or 'Customer',
                    email=user.email,
                    phone=user.phone or '000-000-0000',
                )
        return user

class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'avatar', 'is_email_verified', 'is_phone_verified')

    def validate_email(self, value):
        norm = value.strip().lower()
        try:
            django_validate_email(norm)
        except Exception:
            raise serializers.ValidationError("Please enter a valid email address.")
        instance = getattr(self, 'instance', None)
        qs = User.objects.filter(email__iexact=norm)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return norm

    def validate_phone(self, value):
        return validate_10_digit_phone(value)

    def create(self, validated_data):
        password = validated_data.get('password')
        if not password:
            raise serializers.ValidationError({'password': ['Password is required for new accounts.']})
        role = validated_data.get('role', User.Role.STAFF)
        is_staff = role in [User.Role.STAFF, User.Role.ADMIN]
        is_superuser = role == User.Role.ADMIN
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            phone=validated_data.get('phone', ''),
            avatar=validated_data.get('avatar', ''),
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if 'role' in validated_data:
            role = validated_data['role']
            instance.is_staff = role in [User.Role.STAFF, User.Role.ADMIN]
            instance.is_superuser = role == User.Role.ADMIN
        instance.save()
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        identifier = (attrs.get('email') or attrs.get('username') or '').strip()
        if identifier:
            from django.db.models import Q
            digits = ''.join(c for c in identifier if c.isdigit())
            q = Q(email__iexact=identifier) | Q(phone__iexact=identifier)
            if digits and len(digits) >= 10:
                q |= Q(phone__endswith=digits[-10:])

            user_obj = User.objects.filter(q).first()
            if user_obj:
                attrs['email'] = user_obj.email

        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'phone': self.user.phone,
            'avatar': self.user.avatar,
        }
        return data
