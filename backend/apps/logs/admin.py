from django.contrib import admin

from .models import CustomMetricDefinition, CustomMetricEntry, DailyLog


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ["user", "date", "weight", "calories", "protein", "workout", "workout_type", "protein_hit", "calories_ok"]
    list_filter = ["date", "workout", "workout_type", "protein_hit", "calories_ok"]
    search_fields = ["user__email"]
    readonly_fields = ["id", "created_at", "updated_at", "protein_hit", "calories_ok"]
    ordering = ["-date"]


@admin.register(CustomMetricDefinition)
class CustomMetricDefinitionAdmin(admin.ModelAdmin):
    list_display = ["name", "unit", "user", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "user__email"]


@admin.register(CustomMetricEntry)
class CustomMetricEntryAdmin(admin.ModelAdmin):
    list_display = ["definition", "value", "daily_log"]
    search_fields = ["definition__name"]
