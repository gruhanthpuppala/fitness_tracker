from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsEmailVerified, IsOnboarded
from apps.core.throttling import ReadRateThrottle

from . import services
from .models import MonthlyMetrics


class DashboardSummaryView(generics.GenericAPIView):
    """Today's summary — weight, calories, protein vs targets."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get(self, request):
        data = services.get_dashboard_summary(request.user)
        return Response(data)


class WeightTrendView(generics.GenericAPIView):
    """Weight trend data for 7/14/30 days."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        if days not in (7, 14, 30):
            days = 7
        data = services.get_weight_trends(request.user, days)
        return Response(data)


class StreakView(generics.GenericAPIView):
    """Protein, calorie, and workout streak data."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get(self, request):
        data = services.compute_streaks(request.user)
        return Response(data)


class AlertView(generics.GenericAPIView):
    """Active alerts and warnings."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get(self, request):
        data = services.get_alerts(request.user)
        return Response(data)


class MonthlyMetricsView(generics.GenericAPIView):
    """Monthly metrics with on-demand compute if stale."""

    permission_classes = [IsAuthenticated, IsEmailVerified, IsOnboarded]
    throttle_classes = [ReadRateThrottle]

    def get(self, request):
        services.refresh_if_stale(request.user)
        metrics = MonthlyMetrics.objects.filter(user=request.user).order_by("-month")[:12]
        data = [
            {
                "month": str(m.month),
                "avg_weight": float(m.avg_weight) if m.avg_weight else None,
                "bmi": float(m.bmi) if m.bmi else None,
                "bmi_category": m.bmi_category,
                "weight_change": float(m.weight_change) if m.weight_change else None,
                "consistency_score": m.consistency_score,
                "days_logged": m.days_logged,
                "protein_hit_days": m.protein_hit_days,
                "workout_days": m.workout_days,
                "total_days_in_month": m.total_days_in_month,
            }
            for m in metrics
        ]
        return Response(data)
