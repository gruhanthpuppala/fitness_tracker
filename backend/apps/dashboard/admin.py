from django.contrib import admin

from .models import MonthlyMetrics


@admin.register(MonthlyMetrics)
class MonthlyMetricsAdmin(admin.ModelAdmin):
    list_display = ["user", "month", "avg_weight", "bmi", "consistency_score", "days_logged"]
    list_filter = ["month"]
    search_fields = ["user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-month"]
