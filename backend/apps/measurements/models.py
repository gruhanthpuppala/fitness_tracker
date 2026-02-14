import uuid

from django.conf import settings
from django.db import models


class BodyMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="measurements",
    )
    date = models.DateField()
    neck = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    chest = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    shoulders = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    bicep = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    forearm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    waist = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hips = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    thigh = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # No updated_at — immutable

    class Meta:
        db_table = "body_measurements"
        unique_together = ["user", "date"]
        ordering = ["-date"]
        indexes = [
            models.Index(
                fields=["user", "date"], name="idx_body_meas_user_date"
            ),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.date}"
