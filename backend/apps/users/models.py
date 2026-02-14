import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.users.managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the unique identifier."""

    class GenderChoices(models.TextChoices):
        MALE = "Male", "Male"
        FEMALE = "Female", "Female"
        OTHER = "Other", "Other"

    class DietTypeChoices(models.TextChoices):
        VEGETARIAN = "Vegetarian", "Vegetarian"
        NON_VEGETARIAN = "Non-Vegetarian", "Non-Vegetarian"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    # password is inherited from AbstractBaseUser; nullable for OAuth-only users
    password = models.CharField(max_length=128, null=True, blank=True)
    name = models.CharField(max_length=100, default="")
    age = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
    )
    gender = models.CharField(
        max_length=10, default="", blank=True, choices=GenderChoices.choices
    )
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.1)],
    )
    diet_type = models.CharField(
        max_length=20, default="", blank=True, choices=DietTypeChoices.choices
    )
    avg_sitting_hours = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    auth_provider = models.CharField(max_length=20, default="email")
    google_id = models.CharField(max_length=255, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    # is_superuser is inherited from PermissionsMixin
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"], name="idx_users_email"),
            models.Index(
                fields=["google_id"],
                name="idx_users_google_id",
                condition=models.Q(google_id__isnull=False),
            ),
        ]

    def __str__(self):
        return self.email


class AuditLog(models.Model):
    """Tracks security-relevant user actions."""

    class ActionChoices(models.TextChoices):
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        PASSWORD_CHANGE = "password_change", "Password Change"
        PASSWORD_RESET = "password_reset", "Password Reset"
        ACCOUNT_DEACTIVATION = "account_deactivation", "Account Deactivation"
        FAILED_LOGIN = "failed_login", "Failed Login"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=50, choices=ActionChoices.choices)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(null=True, blank=True)
    details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["user"], name="idx_audit_logs_user"),
            models.Index(fields=["action"], name="idx_audit_logs_action"),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} at {self.created_at}"


class UserTarget(models.Model):
    """Stores fitness targets for a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="target"
    )
    calorie_target = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    protein_target = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    goal_weight = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(0.1)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_targets"

    def __str__(self):
        return f"Targets for {self.user.email}"
