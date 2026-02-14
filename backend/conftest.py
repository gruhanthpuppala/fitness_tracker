from decimal import Decimal

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, UserTarget


@pytest.fixture
def api_client():
    """Return an unauthenticated DRF APIClient instance."""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture that creates and returns a user.

    Defaults can be overridden by passing keyword arguments.
    """

    def _create_user(**kwargs):
        defaults = {
            "email": "testuser@example.com",
            "password": "Test@1234",
            "is_email_verified": True,
        }
        defaults.update(kwargs)
        password = defaults.pop("password")
        user = User.objects.create_user(password=password, **defaults)
        return user

    return _create_user


@pytest.fixture
def authenticated_client(api_client, create_user):
    """Return an APIClient authenticated with a default test user.

    The user is accessible via `authenticated_client.user`.
    """
    user = create_user()
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    api_client.user = user
    return api_client


@pytest.fixture
def create_onboarded_user(db):
    """Factory fixture returning (user, authenticated_client) for a fully onboarded user."""

    _counter = [0]

    def _create(**kwargs):
        _counter[0] += 1
        defaults = {
            "email": f"onboarded{_counter[0]}@example.com",
            "password": "Test@1234",
            "is_email_verified": True,
            "is_onboarded": True,
            "name": "Test User",
            "age": 25,
            "gender": "Male",
            "height_cm": Decimal("175.0"),
            "diet_type": "Non-Vegetarian",
            "avg_sitting_hours": Decimal("8.0"),
        }
        defaults.update(kwargs)
        password = defaults.pop("password")
        user = User.objects.create_user(password=password, **defaults)
        UserTarget.objects.create(
            user=user,
            calorie_target=2000,
            protein_target=150,
            goal_weight=Decimal("70.0"),
        )
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        return user, client

    return _create
