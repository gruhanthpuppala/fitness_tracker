from django.utils import timezone
from rest_framework import serializers

from .models import BodyMeasurement


class BodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMeasurement
        fields = [
            "id",
            "date",
            "neck",
            "chest",
            "shoulders",
            "bicep",
            "forearm",
            "waist",
            "hips",
            "thigh",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Future dates are not allowed.")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
