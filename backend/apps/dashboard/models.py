import uuid

from django.conf import settings
from django.db import models


class MonthlyMetrics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="monthly_metrics",
    )
    month = models.DateField(help_text="First day of the month")
    avg_weight = models.DecimalField(max_digits=5, decimal_places=1, null=True)
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True)
    bmi_category = models.CharField(max_length=20, blank=True, default="")
    weight_change = models.DecimalField(max_digits=5, decimal_places=1, null=True)
    consistency_score = models.IntegerField(default=0)
    days_logged = models.IntegerField(default=0)
    protein_hit_days = models.IntegerField(default=0)
    workout_days = models.IntegerField(default=0)
    total_days_in_month = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "monthly_metrics"
        unique_together = ["user", "month"]
        ordering = ["-month"]
        indexes = [
            models.Index(
                fields=["user", "month"], name="idx_monthly_metrics_user_month"
            ),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.month.strftime('%Y-%m')}"
