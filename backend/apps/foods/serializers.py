from rest_framework import serializers

from .models import Food, FoodEntry


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = [
            "id",
            "name",
            "category",
            "diet_type",
            "calories_per_100g",
            "protein_per_100g",
            "carbs_per_100g",
            "fats_per_100g",
            "fibre_per_100g",
            "is_custom",
            "created_at",
        ]
        read_only_fields = ["id", "is_custom", "created_at"]

    def create(self, validated_data):
        validated_data["is_custom"] = True
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class FoodEntrySerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="food.name", read_only=True)

    class Meta:
        model = FoodEntry
        fields = [
            "id",
            "food",
            "food_name",
            "meal_type",
            "quantity_grams",
            "calories",
            "protein",
            "carbs",
            "fats",
            "fibre",
            "created_at",
        ]
        read_only_fields = [
            "id", "food_name", "calories", "protein",
            "carbs", "fats", "fibre", "created_at",
        ]
