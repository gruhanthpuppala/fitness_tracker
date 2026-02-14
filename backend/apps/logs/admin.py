from django.contrib import admin

from .models import DailyLog


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ["user", "date", "weight", "calories", "protein", "protein_hit", "calories_ok"]
    list_filter = ["date", "workout", "protein_hit", "calories_ok"]
    search_fields = ["user__email"]
    readonly_fields = ["id", "created_at", "updated_at", "protein_hit", "calories_ok"]
    ordering = ["-date"]
