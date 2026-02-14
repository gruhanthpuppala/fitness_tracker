from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle, WriteRateThrottle

from .models import UserTarget
from .serializers import UserProfileSerializer, UserTargetSerializer


class SettingsView(generics.GenericAPIView):
    """Settings facade — aggregates user profile + targets."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def get(self, request):
        user = request.user
        profile_data = UserProfileSerializer(user).data

        target_data = None
        try:
            target_data = UserTargetSerializer(user.target).data
        except UserTarget.DoesNotExist:
            pass

        return Response(
            {
                "profile": profile_data,
                "targets": target_data,
            }
        )

    def put(self, request):
        user = request.user
        profile_data = request.data.get("profile", {})
        target_data = request.data.get("targets", {})
        errors = {}

        # Update profile
        if profile_data:
            profile_serializer = UserProfileSerializer(
                user, data=profile_data, partial=True
            )
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                errors["profile"] = profile_serializer.errors

        # Update targets
        if target_data:
            try:
                target = user.target
            except UserTarget.DoesNotExist:
                target = UserTarget(user=user)

            target_serializer = UserTargetSerializer(
                target, data=target_data, partial=True
            )
            if target_serializer.is_valid():
                target_serializer.save()
            else:
                errors["targets"] = target_serializer.errors

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Settings updated successfully."})
