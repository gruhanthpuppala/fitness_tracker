from decimal import Decimal

from rest_framework import serializers


class OnboardingProfileSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    age = serializers.IntegerField(min_value=1, max_value=120)
    gender = serializers.ChoiceField(choices=["Male", "Female", "Other"])
    height_cm = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=Decimal("0.1"))
    avg_sitting_hours = serializers.DecimalField(
        max_digits=3, decimal_places=1, min_value=Decimal("0")
    )
    diet_type = serializers.ChoiceField(choices=["Vegetarian", "Non-Vegetarian"])


class OnboardingTargetsSerializer(serializers.Serializer):
    calorie_target = serializers.IntegerField(min_value=1)
    protein_target = serializers.IntegerField(min_value=1)
    goal_weight = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=Decimal("0.1"))
    weight = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=Decimal("0.1"))


class OnboardingStatusSerializer(serializers.Serializer):
    """Placeholder serializer for drf-yasg documentation."""

    is_onboarded = serializers.BooleanField(read_only=True)
    has_profile = serializers.BooleanField(read_only=True)
    has_targets = serializers.BooleanField(read_only=True)
