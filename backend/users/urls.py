from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    CheckUserExistsView,
    UserProfileView,
    UserListView,
    UserDetailView,
    UploadAvatarView,
    SendVerificationCodeView,
    VerifyCodeView,
    LoginStatusCheckView,
    ApproveLoginView,
    ResendLoginEmailView,
    VerifyEmailView,
    ResendVerificationEmailView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login-status/', LoginStatusCheckView.as_view(), name='login_status_check'),
    path('approve-login/', ApproveLoginView.as_view(), name='approve_login'),
    path('resend-login-email/', ResendLoginEmailView.as_view(), name='resend_login_email'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('resend-verification-email/', ResendVerificationEmailView.as_view(), name='resend_verification_email'),
    path('check-user/', CheckUserExistsView.as_view(), name='check_user'),
    path('send-verification/', SendVerificationCodeView.as_view(), name='send_verification'),
    path('verify-code/', VerifyCodeView.as_view(), name='verify_code'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('upload-avatar/', UploadAvatarView.as_view(), name='upload_avatar'),
    path('upload-image/', UploadAvatarView.as_view(), name='upload_image'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
