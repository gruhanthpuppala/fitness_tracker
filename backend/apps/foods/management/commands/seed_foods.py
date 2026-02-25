import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.foods.models import Food


class Command(BaseCommand):
    help = "Seed the database with common food items from fixtures/foods_seed.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing system foods before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Food.objects.filter(is_custom=False).delete()
            self.stdout.write(f"Deleted {deleted} existing system foods.")

        fixture_path = Path(__file__).resolve().parent.parent.parent / "fixtures" / "foods_seed.json"
        if not fixture_path.exists():
            self.stderr.write(self.style.ERROR(f"Fixture not found: {fixture_path}"))
            return

        with open(fixture_path, "r", encoding="utf-8") as f:
            foods_data = json.load(f)

        created = 0
        skipped = 0
        for item in foods_data:
            _, was_created = Food.objects.get_or_create(
                name=item["name"],
                is_custom=False,
                defaults={
                    "category": item["category"],
                    "diet_type": item["diet_type"],
                    "calories_per_100g": item["calories_per_100g"],
                    "protein_per_100g": item["protein_per_100g"],
                    "carbs_per_100g": item["carbs_per_100g"],
                    "fats_per_100g": item["fats_per_100g"],
                    "fibre_per_100g": item["fibre_per_100g"],
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created} foods ({skipped} already existed).")
        )
