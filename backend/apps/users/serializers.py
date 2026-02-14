from rest_framework import serializers

from apps.users.models import User, UserTarget


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing and updating user profile information."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "age",
            "gender",
            "height_cm",
            "diet_type",
            "avg_sitting_hours",
            "auth_provider",
            "is_email_verified",
            "is_onboarded",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "auth_provider",
            "is_email_verified",
            "is_onboarded",
            "created_at",
            "updated_at",
        ]


class UserTargetSerializer(serializers.ModelSerializer):
    """Serializer for viewing and updating user fitness targets."""

    class Meta:
        model = UserTarget
        fields = [
            "id",
            "calorie_target",
            "protein_target",
            "goal_weight",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
