from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.logs.models import DailyLog
from apps.logs.services import compute_daily_evaluations
from apps.users.models import UserTarget


@pytest.mark.django_db
class TestDailyLogCRUD:
    def test_create_log(self, authenticated_client, create_onboarded_user):
        user, client = create_onboarded_user()
        response = client.post(
            "/api/v1/logs/",
            {
                "date": str(timezone.now().date()),
                "weight": 75.0,
                "calories": 2000,
                "protein": 150,
                "steps": 10000,
                "water": 3.0,
                "sleep": 7.5,
                "workout": True,
                "cardio": False,
            },
            format="json",
        )
        assert response.status_code == 201

    def test_reject_future_date(self, authenticated_client, create_onboarded_user):
        user, client = create_onboarded_user()
        future = timezone.now().date() + timedelta(days=1)
        response = client.post(
            "/api/v1/logs/",
            {
                "date": str(future),
                "weight": 75.0,
                "calories": 2000,
                "protein": 150,
                "steps": 0,
                "water": 0,
                "sleep": 0,
            },
            format="json",
        )
        assert response.status_code == 400

    def test_7_day_edit_restriction(self, create_onboarded_user):
        user, client = create_onboarded_user()
        old_date = timezone.now().date() - timedelta(days=8)
        log = DailyLog.objects.create(
            user=user,
            date=old_date,
            weight=Decimal("75.0"),
            calories=2000,
            protein=150,
        )
        response = client.put(
            f"/api/v1/logs/{old_date}/",
            {
                "date": str(old_date),
                "weight": 76.0,
                "calories": 2100,
                "protein": 160,
                "steps": 0,
                "water": 0,
                "sleep": 0,
            },
            format="json",
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestDailyEvaluations:
    def test_protein_hit_true(self):
        class FakeTarget:
            protein_target = 150
            calorie_target = 2000

        protein_hit, _ = compute_daily_evaluations(
            {"protein": 160, "calories": 2000}, FakeTarget()
        )
        assert protein_hit is True

    def test_protein_hit_false(self):
        class FakeTarget:
            protein_target = 150
            calorie_target = 2000

        protein_hit, _ = compute_daily_evaluations(
            {"protein": 100, "calories": 2000}, FakeTarget()
        )
        assert protein_hit is False

    def test_calories_ok_within_10_percent(self):
        class FakeTarget:
            protein_target = 150
            calorie_target = 2000

        _, calories_ok = compute_daily_evaluations(
            {"protein": 150, "calories": 2150}, FakeTarget()
        )
        assert calories_ok is True

    def test_calories_ok_outside_10_percent(self):
        class FakeTarget:
            protein_target = 150
            calorie_target = 2000

        _, calories_ok = compute_daily_evaluations(
            {"protein": 150, "calories": 2500}, FakeTarget()
        )
        assert calories_ok is False
