from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.users.models import AuditLog, User, UserTarget


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin configuration for the User model."""

    list_display = (
        "email",
        "name",
        "is_active",
        "is_staff",
        "is_onboarded",
        "auth_provider",
    )
    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "is_onboarded",
        "auth_provider",
        "gender",
    )
    search_fields = ("email", "name")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "name",
                    "age",
                    "gender",
                    "height_cm",
                    "diet_type",
                    "avg_sitting_hours",
                )
            },
        ),
        (
            "Authentication",
            {"fields": ("auth_provider", "google_id")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_email_verified",
                    "is_onboarded",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Security",
            {"fields": ("failed_login_attempts", "locked_until")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )

    def has_change_permission(self, request, obj=None):
        """Only superusers can edit user records."""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete user records."""
        return request.user.is_superuser


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Read-only admin configuration for audit logs."""

    list_display = ("user", "action", "ip_address", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("user__email", "ip_address")
    readonly_fields = (
        "id",
        "user",
        "action",
        "ip_address",
        "user_agent",
        "details",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(UserTarget)
class UserTargetAdmin(admin.ModelAdmin):
    """Admin configuration for user fitness targets."""

    list_display = ("user", "calorie_target", "protein_target", "goal_weight")
    search_fields = ("user__email",)
    readonly_fields = ("created_at", "updated_at")
