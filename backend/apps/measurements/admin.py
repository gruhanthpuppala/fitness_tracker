from django.contrib import admin

from .models import BodyMeasurement


@admin.register(BodyMeasurement)
class BodyMeasurementAdmin(admin.ModelAdmin):
    list_display = ["user", "date", "neck", "chest", "waist", "hips"]
    list_filter = ["date"]
    search_fields = ["user__email"]
    readonly_fields = ["id", "created_at"]
    ordering = ["-date"]

    def has_change_permission(self, request, obj=None):
        return False  # Immutable

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
