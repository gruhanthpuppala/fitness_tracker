from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.dashboard.services import compute_monthly_metrics
from apps.users.models import User


class Command(BaseCommand):
    help = "Compute monthly metrics for all users (current + previous month)"

    def handle(self, *args, **options):
        today = timezone.now().date()
        current_month = today.replace(day=1)
        prev_month = (current_month - timedelta(days=1)).replace(day=1)

        users = User.objects.filter(is_active=True, is_onboarded=True)
        count = 0

        for user in users:
            compute_monthly_metrics(user, current_month)
            compute_monthly_metrics(user, prev_month)
            count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Computed monthly metrics for {count} users.")
        )
