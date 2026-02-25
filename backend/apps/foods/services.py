from django.db.models import Sum

from apps.logs.services import compute_daily_evaluations


def recompute_daily_log_totals(daily_log):
    """Recompute DailyLog macro totals from all FoodEntry records."""
    totals = daily_log.food_entries.aggregate(
        total_calories=Sum("calories"),
        total_protein=Sum("protein"),
        total_carbs=Sum("carbs"),
        total_fats=Sum("fats"),
        total_fibre=Sum("fibre"),
    )

    daily_log.calories = totals["total_calories"] or 0
    daily_log.protein = round(totals["total_protein"] or 0)
    daily_log.carbs = round(totals["total_carbs"] or 0)
    daily_log.fats = round(totals["total_fats"] or 0)
    daily_log.fibre = round(totals["total_fibre"] or 0)

    # Recompute evaluations
    try:
        user_target = daily_log.user.target
        protein_hit, calories_ok = compute_daily_evaluations(
            {"protein": daily_log.protein, "calories": daily_log.calories},
            user_target,
        )
        daily_log.protein_hit = protein_hit
        daily_log.calories_ok = calories_ok
    except Exception:
        pass

    daily_log.save(
        update_fields=[
            "calories", "protein", "carbs", "fats", "fibre",
            "protein_hit", "calories_ok", "updated_at",
        ]
    )
