from .models import BodyMeasurement


def check_30_day_warning(user):
    """Check if last measurement was less than 30 days ago.

    Returns warning message string or None.
    """
    last = BodyMeasurement.objects.filter(user=user).order_by("-date").first()
    if not last:
        return None

    from django.utils import timezone

    days_since = (timezone.now().date() - last.date).days
    if days_since < 30:
        return (
            f"Last measurement was {days_since} days ago. "
            "Recommended frequency: every 30 days."
        )
    return None
