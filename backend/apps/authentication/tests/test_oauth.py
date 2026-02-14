from unittest.mock import patch

import pytest
from django.urls import reverse

from apps.users.models import User

GOOGLE_AUTH_URL = reverse("authentication:google-auth")


@pytest.mark.django_db
class TestGoogleAuth:
    """Tests for the Google OAuth2 authentication endpoint."""

    @patch("apps.authentication.services.verify_google_token")
    def test_google_auth_new_user(self, mock_verify, api_client):
        """A valid Google token for a new email creates a user and returns tokens."""
        mock_verify.return_value = {
            "email": "google@example.com",
            "google_id": "google-id-123",
            "name": "Google User",
        }

        payload = {"token": "valid-google-token"}
        response = api_client.post(GOOGLE_AUTH_URL, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert "access" in data.get("data", data)
        assert "refresh" in data.get("data", data)

        user = User.objects.get(email="google@example.com")
        assert user.google_id == "google-id-123"
        assert user.auth_provider == "google"
        assert user.is_email_verified is True

    @patch("apps.authentication.services.verify_google_token")
    def test_google_auth_existing_user(self, mock_verify, api_client, create_user):
        """A valid Google token for an existing email links the Google ID."""
        existing_user = create_user(email="existing@example.com")
        assert existing_user.google_id is None

        mock_verify.return_value = {
            "email": "existing@example.com",
            "google_id": "google-id-456",
            "name": "Existing User",
        }

        payload = {"token": "valid-google-token"}
        response = api_client.post(GOOGLE_AUTH_URL, payload, format="json")

        assert response.status_code == 200
        existing_user.refresh_from_db()
        assert existing_user.google_id == "google-id-456"

    @patch("apps.authentication.services.verify_google_token")
    def test_google_auth_invalid_token(self, mock_verify, api_client):
        """An invalid Google token returns a validation error."""
        mock_verify.return_value = None

        payload = {"token": "invalid-google-token"}
        response = api_client.post(GOOGLE_AUTH_URL, payload, format="json")

        assert response.status_code == 400
