from datetime import timedelta

from django.utils import timezone


def compute_daily_evaluations(log_data, user_target):
    """Compute protein_hit and calories_ok based on user targets.

    Args:
        log_data: dict with 'protein' and 'calories' values
        user_target: UserTarget instance

    Returns:
        tuple: (protein_hit: bool, calories_ok: bool)
    """
    protein_hit = log_data["protein"] >= user_target.protein_target
    calories_ok = (
        abs(log_data["calories"] - user_target.calorie_target)
        <= user_target.calorie_target * 0.10
    )
    return protein_hit, calories_ok


def check_weekly_workout_variety(user):
    """Check if user has done at least 2 different workout types this week (Mon-Sun)."""
    from apps.logs.models import DailyLog

    today = timezone.now().date()
    # Monday of current week
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    logs = DailyLog.objects.filter(
        user=user,
        date__gte=monday,
        date__lte=sunday,
        workout=True,
        workout_type__isnull=False,
    ).values_list("workout_type", flat=True)

    types_done = list(set(logs))
    meets_rule = len(types_done) >= 2

    if meets_rule:
        message = f"Great variety! You've done {len(types_done)} workout types this week."
    elif len(types_done) == 1:
        message = "Try a different workout type this week for better variety."
    else:
        message = "No workouts logged this week yet. Try to mix at least 2 types."

    return {
        "types_done": types_done,
        "meets_rule": meets_rule,
        "message": message,
    }
