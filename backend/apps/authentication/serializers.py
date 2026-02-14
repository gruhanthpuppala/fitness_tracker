import re

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from apps.users.models import AuditLog, User

from . import services


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 number."
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 special character."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )
        request = self.context.get("request")
        services.send_verification_email(user, request=request)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")
        request = self.context.get("request")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if services.check_lockout(user):
            raise serializers.ValidationError(
                {
                    "detail": "Account is temporarily locked due to too many "
                    "failed login attempts. Please try again later."
                }
            )

        if not user.check_password(password):
            services.handle_failed_login(user, request)
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "This account has been deactivated."}
            )

        services.handle_successful_login(user, request)
        attrs["user"] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth2 authentication."""

    token = serializers.CharField()

    def validate_token(self, value):
        token_data = services.verify_google_token(value)
        if token_data is None:
            raise serializers.ValidationError("Invalid Google token.")
        return token_data

    def validate(self, attrs):
        token_data = attrs["token"]
        email = token_data["email"].lower().strip()
        google_id = token_data["google_id"]
        name = token_data.get("name", "")

        try:
            user = User.objects.get(email=email)
            # Link Google ID to existing user if not already linked
            # Do NOT change auth_provider — it tracks original registration method only
            if not user.google_id:
                user.google_id = google_id
            user.is_email_verified = True
            user.save(update_fields=["google_id", "is_email_verified"])
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                password=None,
                name=name,
                google_id=google_id,
                auth_provider="google",
                is_email_verified=True,
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "This account has been deactivated."}
            )

        request = self.context.get("request")
        services.handle_successful_login(user, request)
        attrs["user"] = user
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for requesting a password reset."""

    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        # Store user for later use but do not reveal if email exists
        self._user = User.objects.filter(email=value).first()
        return value

    def save(self, **kwargs):
        if self._user:
            request = self.context.get("request")
            services.send_password_reset_email(self._user, request=request)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset with a token."""

    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_token(self, value):
        user_id = services.verify_password_reset_token(value)
        if user_id is None:
            raise serializers.ValidationError(
                "Invalid or expired password reset token."
            )
        try:
            self._user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid or expired password reset token."
            )
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 number."
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 special character."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def save(self, **kwargs):
        self._user.set_password(self.validated_data["password"])
        self._user.save(update_fields=["password"])

        request = self.context.get("request")
        if request:
            services.create_audit_log(
                user=self._user,
                action=AuditLog.ActionChoices.PASSWORD_RESET,
                request=request,
            )


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing the current user's password."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 number."
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError(
                "Password must contain at least 1 special character."
            )
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        request = self.context["request"]
        services.create_audit_log(
            user=user,
            action=AuditLog.ActionChoices.PASSWORD_CHANGE,
            request=request,
        )


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout (blacklists the refresh token)."""

    refresh = serializers.CharField()

    def validate_refresh(self, value):
        try:
            self._token = RefreshToken(value)
        except TokenError:
            raise serializers.ValidationError("Invalid or expired refresh token.")
        return value

    def save(self, **kwargs):
        self._token.blacklist()
