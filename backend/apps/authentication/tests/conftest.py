import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User


@pytest.fixture
def api_client():
    """Return an unauthenticated DRF APIClient instance."""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture that creates and returns a user."""

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
    """Return an APIClient authenticated with a default test user."""
    user = create_user()
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    api_client.user = user
    return api_client
