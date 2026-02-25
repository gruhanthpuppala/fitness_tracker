from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.mixins import OwnerQuerySetMixin
from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle, WriteRateThrottle
from apps.logs.models import DailyLog

from .models import Food, FoodEntry
from .serializers import FoodEntrySerializer, FoodSerializer
from .services import recompute_daily_log_totals


# ──── Food CRUD ────


class FoodListCreateView(generics.ListCreateAPIView):
    """List/search foods or create a custom food."""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Food.objects.none()
        qs = Food.objects.filter(
            Q(is_custom=False) | Q(created_by=self.request.user)
        )
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)
        diet_type = self.request.query_params.get("diet_type")
        if diet_type:
            qs = qs.filter(diet_type=diet_type)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs


class FoodDetailView(generics.RetrieveAPIView):
    """Retrieve a single food item."""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Food.objects.none()
        return Food.objects.filter(
            Q(is_custom=False) | Q(created_by=self.request.user)
        )


class FoodDeleteView(generics.DestroyAPIView):
    """Delete a custom food (owner only)."""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [WriteRateThrottle]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Food.objects.none()
        return Food.objects.filter(is_custom=True, created_by=self.request.user)


# ──── FoodEntry (Meal Logging) ────


class FoodEntryListCreateView(generics.ListCreateAPIView):
    """List or add food entries for a daily log (by date)."""

    serializer_class = FoodEntrySerializer
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
            return FoodEntry.objects.none()
        log = self._get_daily_log()
        if log is None:
            return FoodEntry.objects.none()
        return FoodEntry.objects.filter(daily_log=log)

    def create(self, request, *args, **kwargs):
        log = self._get_daily_log()
        if log is None:
            return Response(
                {"message": "No daily log found for this date. Create a daily log first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(daily_log=log)
        recompute_daily_log_totals(log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FoodEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a food entry."""

    serializer_class = FoodEntrySerializer
    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]

    def get_throttles(self):
        if self.request.method == "GET":
            return [ReadRateThrottle()]
        return [WriteRateThrottle()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return FoodEntry.objects.none()
        date = self.kwargs["date"]
        return FoodEntry.objects.filter(
            daily_log__user=self.request.user,
            daily_log__date=date,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        recompute_daily_log_totals(instance.daily_log)

    def perform_destroy(self, instance):
        log = instance.daily_log
        instance.delete()
        recompute_daily_log_totals(log)
