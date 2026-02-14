from django.utils import timezone
from rest_framework import serializers

from .models import DailyLog
from .services import compute_daily_evaluations


class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = [
            "id",
            "date",
            "weight",
            "calories",
            "protein",
            "carbs",
            "fats",
            "steps",
            "water",
            "sleep",
            "workout",
            "cardio",
            "fruit",
            "protein_hit",
            "calories_ok",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "protein_hit", "calories_ok", "created_at", "updated_at"]

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Future dates are not allowed.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user

        # Compute evaluations
        try:
            user_target = user.target
            protein_hit, calories_ok = compute_daily_evaluations(
                validated_data, user_target
            )
            validated_data["protein_hit"] = protein_hit
            validated_data["calories_ok"] = calories_ok
        except Exception:
            pass

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Recompute evaluations on update
        user = instance.user
        try:
            user_target = user.target
            data = {
                "protein": validated_data.get("protein", instance.protein),
                "calories": validated_data.get("calories", instance.calories),
            }
            protein_hit, calories_ok = compute_daily_evaluations(data, user_target)
            validated_data["protein_hit"] = protein_hit
            validated_data["calories_ok"] = calories_ok
        except Exception:
            pass

        return super().update(instance, validated_data)
