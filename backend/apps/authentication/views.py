from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from apps.core.permissions import IsEmailVerified
from apps.core.throttling import AuthRateThrottle, WriteRateThrottle
from apps.users.models import AuditLog, User

from . import services
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    RegisterSerializer,
)


class RegisterView(generics.GenericAPIView):
    """Register a new user account.

    Sends a verification email upon successful registration.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Registration successful. Please verify your email."},
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """Authenticate a user and return JWT tokens."""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class GoogleAuthView(generics.GenericAPIView):
    """Authenticate via Google OAuth2 and return JWT tokens."""

    serializer_class = GoogleAuthSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class TokenRefreshView(SimpleJWTTokenRefreshView):
    """Refresh an access token using a valid refresh token."""

    permission_classes = [AllowAny]


class LogoutView(generics.GenericAPIView):
    """Logout by blacklisting the refresh token."""

    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        services.create_audit_log(
            user=request.user,
            action=AuditLog.ActionChoices.LOGOUT,
            request=request,
        )

        return Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(generics.GenericAPIView):
    """Verify a user's email address using a signed token."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = services.verify_email_token(token)
        if user_id is None:
            return Response(
                {"detail": "Invalid or expired verification token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired verification token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        return Response(
            {"message": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(generics.GenericAPIView):
    """Resend the email verification link to the authenticated user."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.is_email_verified:
            return Response(
                {"message": "Email is already verified."},
                status=status.HTTP_200_OK,
            )

        services.send_verification_email(user, request=request)
        return Response(
            {"message": "Verification email sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetView(generics.GenericAPIView):
    """Request a password reset email.

    Always returns 200 regardless of whether the email exists,
    to prevent user enumeration.
    """

    serializer_class = PasswordResetSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": "If an account with that email exists, "
                "a password reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """Confirm a password reset using a token and set a new password."""

    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


class PasswordChangeView(generics.GenericAPIView):
    """Change the authenticated user's password."""

    serializer_class = PasswordChangeSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified]
    throttle_classes = [WriteRateThrottle]

    def put(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )
