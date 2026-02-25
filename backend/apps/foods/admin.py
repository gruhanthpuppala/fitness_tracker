from django.contrib import admin

from .models import Food, FoodEntry


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "diet_type", "calories_per_100g", "protein_per_100g", "is_custom"]
    list_filter = ["category", "diet_type", "is_custom"]
    search_fields = ["name"]
    readonly_fields = ["id", "created_at"]


@admin.register(FoodEntry)
class FoodEntryAdmin(admin.ModelAdmin):
    list_display = ["food", "meal_type", "quantity_grams", "calories", "protein", "daily_log"]
    list_filter = ["meal_type"]
    search_fields = ["food__name", "daily_log__user__email"]
    readonly_fields = ["id", "calories", "protein", "carbs", "fats", "fibre", "created_at"]
