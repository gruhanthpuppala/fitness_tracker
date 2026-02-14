from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.mixins import OwnerQuerySetMixin
from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle, WriteRateThrottle

from .models import BodyMeasurement
from .serializers import BodyMeasurementSerializer
from .services import check_30_day_warning


class MeasurementListCreateView(OwnerQuerySetMixin, generics.ListCreateAPIView):
    """List measurements or create a new one (immutable — no update)."""

    serializer_class = BodyMeasurementSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    queryset = BodyMeasurement.objects.all()

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        warning = check_30_day_warning(request.user)
        response_data = serializer.data
        if warning:
            return Response(
                {"data": response_data, "warning": warning},
                status=status.HTTP_201_CREATED,
            )
        return Response(response_data, status=status.HTTP_201_CREATED)


class MeasurementLatestView(OwnerQuerySetMixin, generics.RetrieveAPIView):
    """Get most recent measurement."""

    serializer_class = BodyMeasurementSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]
    queryset = BodyMeasurement.objects.all()

    def get_object(self):
        return self.get_queryset().first()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response(
                {"message": "No measurements found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class MeasurementDetailView(OwnerQuerySetMixin, generics.RetrieveAPIView):
    """Get a specific measurement by ID (read-only)."""

    serializer_class = BodyMeasurementSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]
    queryset = BodyMeasurement.objects.all()
    lookup_field = "pk"
