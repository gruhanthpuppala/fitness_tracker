from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.mixins import OwnerQuerySetMixin
from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle, WriteRateThrottle

from .models import DailyLog
from .serializers import DailyLogSerializer


class DailyLogListCreateView(OwnerQuerySetMixin, generics.ListCreateAPIView):
    """List paginated daily logs or create a new one.

    POST behaves as upsert: if a log already exists for the given date,
    it updates the existing log instead of returning an error.
    """

    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    queryset = DailyLog.objects.all()
    filterset_fields = {"date": ["gte", "lte", "exact"]}

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def create(self, request, *args, **kwargs):
        date = request.data.get("date")
        if date:
            existing = self.get_queryset().filter(date=date).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class DailyLogDetailView(OwnerQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a daily log by date."""

    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    queryset = DailyLog.objects.all()
    lookup_field = "date"

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def check_edit_restriction(self, log):
        if (timezone.now().date() - log.date).days > 7:
            raise PermissionDenied("Logs older than 7 days cannot be modified.")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_edit_restriction(instance)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_edit_restriction(instance)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_edit_restriction(instance)
        return super().destroy(request, *args, **kwargs)


class DailyLogTodayView(OwnerQuerySetMixin, generics.RetrieveAPIView):
    """Shortcut to get today's log."""

    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]
    queryset = DailyLog.objects.all()

    def get_object(self):
        today = timezone.now().date()
        try:
            return self.get_queryset().get(date=today)
        except DailyLog.DoesNotExist:
            return None

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response(
                {"message": "No log for today."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
