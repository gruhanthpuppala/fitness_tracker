import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class DailyLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_logs",
    )
    date = models.DateField()
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0.1)],
    )
    calories = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    protein = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    carbs = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    fats = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    steps = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    water = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0)],
    )
    sleep = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
    )
    workout = models.BooleanField(default=False)
    cardio = models.BooleanField(default=False)
    fruit = models.BooleanField(default=False)
    protein_hit = models.BooleanField(default=False)
    calories_ok = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_logs"
        unique_together = ["user", "date"]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["user", "date"], name="idx_daily_logs_user_date"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.date}"
