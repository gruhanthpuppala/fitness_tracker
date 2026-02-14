import calendar
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from apps.logs.models import DailyLog
from apps.measurements.models import BodyMeasurement

from .models import MonthlyMetrics


def get_dashboard_summary(user):
    """Return today's data vs targets."""
    today = timezone.now().date()
    try:
        log = DailyLog.objects.get(user=user, date=today)
        log_data = {
            "weight": float(log.weight),
            "calories": log.calories,
            "protein": log.protein,
            "steps": log.steps,
            "water": float(log.water),
            "sleep": float(log.sleep),
            "workout": log.workout,
            "protein_hit": log.protein_hit,
            "calories_ok": log.calories_ok,
        }
    except DailyLog.DoesNotExist:
        log_data = None

    target_data = None
    try:
        target = user.target
        target_data = {
            "calorie_target": target.calorie_target,
            "protein_target": target.protein_target,
            "goal_weight": float(target.goal_weight),
        }
    except Exception:
        pass

    return {
        "today": log_data,
        "targets": target_data,
        "has_logged_today": log_data is not None,
    }


def get_weight_trends(user, days=7):
    """Return weight data for the last N days."""
    start_date = timezone.now().date() - timedelta(days=days)
    logs = (
        DailyLog.objects.filter(user=user, date__gte=start_date)
        .order_by("date")
        .values("date", "weight")
    )
    return [
        {"date": str(log["date"]), "weight": float(log["weight"])} for log in logs
    ]


def compute_streaks(user):
    """Compute protein, calorie, and workout streaks ending today or yesterday."""
    today = timezone.now().date()
    logs = (
        DailyLog.objects.filter(user=user, date__lte=today)
        .order_by("-date")
        .values("date", "protein_hit", "calories_ok", "workout")[:60]
    )

    log_list = list(logs)

    def streak_count(field):
        count = 0
        expected_date = today
        for log in log_list:
            if log["date"] == expected_date and log[field]:
                count += 1
                expected_date -= timedelta(days=1)
            elif log["date"] == expected_date and not log[field]:
                break
            elif log["date"] < expected_date:
                # Gap day — check if it's yesterday and we haven't started
                if count == 0 and expected_date == today:
                    expected_date = today - timedelta(days=1)
                    if log["date"] == expected_date and log[field]:
                        count += 1
                        expected_date -= timedelta(days=1)
                    else:
                        break
                else:
                    break
        return count

    return {
        "protein_streak": streak_count("protein_hit"),
        "calorie_streak": streak_count("calories_ok"),
        "workout_streak": streak_count("workout"),
    }


def get_alerts(user):
    """Generate alerts for the user."""
    today = timezone.now().date()
    alerts = []

    # Days off calorie target
    recent_logs = DailyLog.objects.filter(
        user=user, date__gte=today - timedelta(days=7)
    ).order_by("-date")

    off_target_days = sum(1 for log in recent_logs if not log.calories_ok)
    if off_target_days >= 3:
        alerts.append(
            {
                "type": "warning",
                "message": f"{off_target_days} days off calorie target in the last week",
            }
        )

    # No workout warning
    no_workout_days = sum(1 for log in recent_logs if not log.workout)
    if no_workout_days >= 5:
        alerts.append(
            {"type": "warning", "message": f"No workouts in {no_workout_days} days"}
        )

    # No measurement in 30+ days
    last_measurement = (
        BodyMeasurement.objects.filter(user=user).order_by("-date").first()
    )
    if last_measurement:
        days_since = (today - last_measurement.date).days
        if days_since >= 30:
            alerts.append(
                {
                    "type": "info",
                    "message": f"No body measurement in {days_since} days",
                }
            )
    else:
        alerts.append(
            {"type": "info", "message": "No body measurements recorded yet"}
        )

    return alerts


def compute_monthly_metrics(user, month_date):
    """Compute and store monthly metrics for a user for a given month."""
    first_day = month_date.replace(day=1)
    total_days = calendar.monthrange(first_day.year, first_day.month)[1]
    last_day = first_day.replace(day=total_days)

    logs = DailyLog.objects.filter(user=user, date__gte=first_day, date__lte=last_day)

    days_logged = logs.count()
    protein_hit_days = logs.filter(protein_hit=True).count()
    workout_days = logs.filter(workout=True).count()
    avg_weight_result = logs.aggregate(avg=Avg("weight"))
    avg_weight = (
        round(avg_weight_result["avg"], 1) if avg_weight_result["avg"] else None
    )

    # Consistency score
    if days_logged == 0:
        consistency_score = 0
    else:
        consistency_score = round(
            (days_logged / total_days) * 40
            + (protein_hit_days / days_logged) * 30
            + (workout_days / days_logged) * 30
        )

    # BMI
    bmi = None
    bmi_category = ""
    if avg_weight and user.height_cm:
        height_m = float(user.height_cm) / 100
        bmi = round(float(avg_weight) / (height_m * height_m), 1)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"

    # Weight change vs previous month
    weight_change = None
    prev_month = (first_day - timedelta(days=1)).replace(day=1)
    prev_metrics = MonthlyMetrics.objects.filter(user=user, month=prev_month).first()
    if prev_metrics and prev_metrics.avg_weight and avg_weight:
        weight_change = round(float(avg_weight) - float(prev_metrics.avg_weight), 1)

    metrics, _ = MonthlyMetrics.objects.update_or_create(
        user=user,
        month=first_day,
        defaults={
            "avg_weight": avg_weight,
            "bmi": bmi,
            "bmi_category": bmi_category,
            "weight_change": weight_change,
            "consistency_score": consistency_score,
            "days_logged": days_logged,
            "protein_hit_days": protein_hit_days,
            "workout_days": workout_days,
            "total_days_in_month": total_days,
        },
    )
    return metrics


def refresh_if_stale(user):
    """Refresh monthly metrics if stale (> 24h old)."""
    today = timezone.now().date()
    current_month = today.replace(day=1)
    metrics = MonthlyMetrics.objects.filter(user=user, month=current_month).first()

    if not metrics or (timezone.now() - metrics.updated_at).total_seconds() > 86400:
        compute_monthly_metrics(user, today)
        # Also recompute previous month
        prev_month = (current_month - timedelta(days=1)).replace(day=1)
        compute_monthly_metrics(user, prev_month)
