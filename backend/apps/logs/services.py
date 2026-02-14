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
