from rest_framework import serializers

from .models import CustomMetricDefinition, CustomMetricEntry


class CustomMetricDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomMetricDefinition
        fields = ["id", "name", "unit", "is_active", "created_at"]
        read_only_fields = ["id", "is_active", "created_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class CustomMetricEntrySerializer(serializers.ModelSerializer):
    metric_name = serializers.CharField(source="definition.name", read_only=True)
    metric_unit = serializers.CharField(source="definition.unit", read_only=True)

    class Meta:
        model = CustomMetricEntry
        fields = ["id", "definition", "metric_name", "metric_unit", "value", "created_at"]
        read_only_fields = ["id", "metric_name", "metric_unit", "created_at"]

    def validate_definition(self, value):
        user = self.context["request"].user
        if value.user != user or not value.is_active:
            raise serializers.ValidationError("Invalid metric definition.")
        return value
