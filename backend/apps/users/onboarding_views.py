from decimal import Decimal

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsEmailVerified
from apps.core.throttling import WriteRateThrottle

from .models import User, UserTarget
from .onboarding_serializers import (
    OnboardingProfileSerializer,
    OnboardingStatusSerializer,
    OnboardingTargetsSerializer,
)


class OnboardingProfileView(generics.GenericAPIView):
    """Save initial profile data during onboarding."""

    serializer_class = OnboardingProfileSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified]
    throttle_classes = [WriteRateThrottle]

    def post(self, request, *args, **kwargs):
        if request.user.is_onboarded:
            return Response(
                {"message": "User is already onboarded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save(
            update_fields=[
                "name",
                "age",
                "gender",
                "height_cm",
                "avg_sitting_hours",
                "diet_type",
            ]
        )

        return Response(
            {"message": "Profile saved successfully."},
            status=status.HTTP_200_OK,
        )


class OnboardingTargetsView(generics.GenericAPIView):
    """Save targets, create initial daily log, compute BMI, set is_onboarded."""

    serializer_class = OnboardingTargetsSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified]
    throttle_classes = [WriteRateThrottle]

    def post(self, request, *args, **kwargs):
        if request.user.is_onboarded:
            return Response(
                {"message": "User is already onboarded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        weight = data.pop("weight")

        # Create or update user target
        UserTarget.objects.update_or_create(
            user=user,
            defaults={
                "calorie_target": data["calorie_target"],
                "protein_target": data["protein_target"],
                "goal_weight": data["goal_weight"],
            },
        )

        # Create initial daily log with weight
        from apps.logs.models import DailyLog
        from django.utils import timezone

        today = timezone.now().date()
        DailyLog.objects.update_or_create(
            user=user,
            date=today,
            defaults={
                "weight": weight,
                "calories": 0,
                "protein": 0,
                "steps": 0,
                "water": Decimal("0.0"),
                "sleep": Decimal("0.0"),
                "workout": False,
                "cardio": False,
                "fruit": False,
                "protein_hit": False,
                "calories_ok": False,
            },
        )

        # Compute BMI
        height_m = float(user.height_cm) / 100.0
        bmi = round(float(weight) / (height_m * height_m), 1)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"

        # Set onboarded
        user.is_onboarded = True
        user.save(update_fields=["is_onboarded"])

        return Response(
            {
                "message": "Onboarding complete.",
                "bmi": bmi,
                "bmi_category": bmi_category,
            },
            status=status.HTTP_200_OK,
        )


class OnboardingStatusView(generics.GenericAPIView):
    """Check onboarding completion status."""

    serializer_class = OnboardingStatusSerializer
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get(self, request, *args, **kwargs):
        user = request.user
        has_profile = bool(user.name and user.age and user.height_cm)
        has_targets = hasattr(user, "target")

        return Response(
            {
                "is_onboarded": user.is_onboarded,
                "has_profile": has_profile,
                "has_targets": has_targets,
            },
            status=status.HTTP_200_OK,
        )
