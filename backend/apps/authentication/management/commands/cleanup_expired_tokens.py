from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)


class Command(BaseCommand):
    help = "Delete expired blacklisted tokens and their outstanding token records."

    def handle(self, *args, **options):
        now = timezone.now()

        # Find outstanding tokens that have expired
        expired_tokens = OutstandingToken.objects.filter(expires_at__lt=now)
        expired_count = expired_tokens.count()

        # Delete blacklisted tokens linked to expired outstanding tokens
        BlacklistedToken.objects.filter(token__in=expired_tokens).delete()

        # Delete the expired outstanding tokens
        expired_tokens.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully deleted {expired_count} expired token(s)."
            )
        )
