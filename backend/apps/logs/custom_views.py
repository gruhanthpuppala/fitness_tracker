from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle, WriteRateThrottle

from .custom_serializers import CustomMetricDefinitionSerializer, CustomMetricEntrySerializer
from .models import CustomMetricDefinition, CustomMetricEntry, DailyLog


class CustomMetricDefinitionListCreateView(generics.ListCreateAPIView):
    """List or create custom metric definitions."""

    serializer_class = CustomMetricDefinitionSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CustomMetricDefinition.objects.none()
        return CustomMetricDefinition.objects.filter(
            user=self.request.user, is_active=True
        )


class CustomMetricDefinitionDeleteView(generics.DestroyAPIView):
    """Soft-delete a custom metric definition (set is_active=False)."""

    serializer_class = CustomMetricDefinitionSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [WriteRateThrottle]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CustomMetricDefinition.objects.none()
        return CustomMetricDefinition.objects.filter(
            user=self.request.user, is_active=True
        )

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class CustomMetricEntryListCreateView(generics.ListCreateAPIView):
    """List or log custom metric values for a daily log (by date)."""

    serializer_class = CustomMetricEntrySerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def _get_daily_log(self):
        date = self.kwargs["date"]
        try:
            return DailyLog.objects.get(user=self.request.user, date=date)
        except DailyLog.DoesNotExist:
            return None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CustomMetricEntry.objects.none()
        log = self._get_daily_log()
        if log is None:
            return CustomMetricEntry.objects.none()
        return CustomMetricEntry.objects.filter(
            daily_log=log, definition__user=self.request.user
        )

    def create(self, request, *args, **kwargs):
        log = self._get_daily_log()
        if log is None:
            return Response(
                {"message": "No daily log found for this date."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(daily_log=log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
