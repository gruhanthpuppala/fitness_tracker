from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.users.models import AuditLog, UserTarget
from apps.users.serializers import UserProfileSerializer, UserTargetSerializer


class UserProfileView(RetrieveUpdateDestroyAPIView):
    """
    GET    /users/me/ — retrieve the authenticated user's profile
    PUT    /users/me/ — fully update the profile
    PATCH  /users/me/ — partially update the profile
    DELETE /users/me/ — soft-delete (deactivate) the account
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified]
    throttle_classes = [ScopedRateThrottle]

    def get_throttle_scope(self):
        if self.request.method == "GET":
            return "read"
        return "write"

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        """Soft-delete: deactivate account, blacklist tokens, log action."""
        # Soft delete
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

        # Blacklist all outstanding refresh tokens for this user
        outstanding_tokens = OutstandingToken.objects.filter(user=instance)
        for token in outstanding_tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        # Create audit log
        AuditLog.objects.create(
            user=instance,
            action=AuditLog.ActionChoices.ACCOUNT_DEACTIVATION,
            ip_address=self._get_client_ip(),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"detail": "Account deactivated successfully."},
            status=status.HTTP_200_OK,
        )

    def _get_client_ip(self):
        """Extract the client IP address from the request."""
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return self.request.META.get("REMOTE_ADDR")


class UserTargetView(RetrieveUpdateAPIView):
    """
    GET /targets/ — retrieve the authenticated user's fitness targets
    PUT /targets/ — update the fitness targets
    """

    serializer_class = UserTargetSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_object(self):
        target, _ = UserTarget.objects.get_or_create(
            user=self.request.user,
            defaults={
                "calorie_target": 2000,
                "protein_target": 50,
                "goal_weight": 70.0,
            },
        )
        return target
