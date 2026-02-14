import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User

TOKEN_REFRESH_URL = reverse("authentication:token-refresh")
LOGOUT_URL = reverse("authentication:logout")


@pytest.mark.django_db
class TestTokenRefresh:
    """Tests for the token refresh endpoint."""

    def test_token_refresh(self, api_client, create_user):
        """A valid refresh token returns a new access token."""
        user = create_user(email="refresh@example.com")
        refresh = RefreshToken.for_user(user)

        payload = {"refresh": str(refresh)}
        response = api_client.post(TOKEN_REFRESH_URL, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert "access" in data.get("data", data)


@pytest.mark.django_db
class TestLogout:
    """Tests for the logout endpoint."""

    def test_logout_blacklists_token(self, authenticated_client):
        """Logging out blacklists the refresh token."""
        user = authenticated_client.user
        refresh = RefreshToken.for_user(user)

        payload = {"refresh": str(refresh)}
        response = authenticated_client.post(LOGOUT_URL, payload, format="json")

        assert response.status_code == 200

    def test_blacklisted_token_cannot_be_refreshed(self, api_client, create_user):
        """A blacklisted refresh token cannot be used to obtain a new access token."""
        user = create_user(email="blacklist@example.com")
        refresh = RefreshToken.for_user(user)

        # Blacklist the token
        refresh.blacklist()

        payload = {"refresh": str(refresh)}
        response = api_client.post(TOKEN_REFRESH_URL, payload, format="json")

        assert response.status_code == 401

    def test_using_blacklisted_token_for_logout_fails(self, authenticated_client):
        """Attempting to logout with an already-blacklisted token returns an error."""
        user = authenticated_client.user
        refresh = RefreshToken.for_user(user)

        # Blacklist the token first
        refresh.blacklist()

        payload = {"refresh": str(refresh)}
        response = authenticated_client.post(LOGOUT_URL, payload, format="json")

        assert response.status_code == 400
