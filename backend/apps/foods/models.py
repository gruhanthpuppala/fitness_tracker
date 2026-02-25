import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Food(models.Model):
    class CategoryChoices(models.TextChoices):
        GRAIN = "grain", "Grain"
        PROTEIN_SOURCE = "protein_source", "Protein Source"
        VEGETABLE = "vegetable", "Vegetable"
        FRUIT = "fruit", "Fruit"
        DAIRY = "dairy", "Dairy"
        SNACK = "snack", "Snack"
        BEVERAGE = "beverage", "Beverage"
        CONDIMENT = "condiment", "Condiment"
        OTHER = "other", "Other"

    class DietTypeChoices(models.TextChoices):
        VEGETARIAN = "vegetarian", "Vegetarian"
        NON_VEGETARIAN = "non_vegetarian", "Non-Vegetarian"
        VEGAN = "vegan", "Vegan"
        EGGETARIAN = "eggetarian", "Eggetarian"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CategoryChoices.choices)
    diet_type = models.CharField(max_length=20, choices=DietTypeChoices.choices)
    calories_per_100g = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    protein_per_100g = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(0)]
    )
    carbs_per_100g = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(0)]
    )
    fats_per_100g = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(0)]
    )
    fibre_per_100g = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(0)]
    )
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_foods",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "foods"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"], name="idx_foods_name"),
            models.Index(fields=["diet_type"], name="idx_foods_diet_type"),
            models.Index(fields=["created_by"], name="idx_foods_created_by"),
        ]

    def __str__(self):
        return self.name


class FoodEntry(models.Model):
    class MealTypeChoices(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        SNACK = "snack", "Snack"
        DINNER = "dinner", "Dinner"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_log = models.ForeignKey(
        "logs.DailyLog",
        on_delete=models.CASCADE,
        related_name="food_entries",
    )
    food = models.ForeignKey(
        Food,
        on_delete=models.PROTECT,
        related_name="entries",
    )
    meal_type = models.CharField(max_length=20, choices=MealTypeChoices.choices)
    quantity_grams = models.DecimalField(
        max_digits=6, decimal_places=1, validators=[MinValueValidator(0.1)]
    )
    # Denormalized for fast reads — computed on save
    calories = models.PositiveIntegerField(default=0)
    protein = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    carbs = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    fats = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    fibre = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "food_entries"
        ordering = ["created_at"]
        indexes = [
            models.Index(
                fields=["daily_log", "meal_type"],
                name="idx_food_entries_log_meal",
            ),
        ]

    def __str__(self):
        return f"{self.food.name} ({self.meal_type}) - {self.quantity_grams}g"

    def compute_nutrients(self):
        ratio = float(self.quantity_grams) / 100.0
        self.calories = round(self.food.calories_per_100g * ratio)
        self.protein = round(float(self.food.protein_per_100g) * ratio, 1)
        self.carbs = round(float(self.food.carbs_per_100g) * ratio, 1)
        self.fats = round(float(self.food.fats_per_100g) * ratio, 1)
        self.fibre = round(float(self.food.fibre_per_100g) * ratio, 1)

    def save(self, *args, **kwargs):
        self.compute_nutrients()
        super().save(*args, **kwargs)
