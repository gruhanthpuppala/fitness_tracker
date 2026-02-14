from unittest.mock import patch

import pytest
from django.urls import reverse

from apps.users.models import User

REGISTER_URL = reverse("authentication:register")


@pytest.mark.django_db
class TestRegister:
    """Tests for the user registration endpoint."""

    @patch("apps.authentication.services.send_verification_email")
    def test_successful_registration(self, mock_send_email, api_client):
        """A valid registration request creates a user and returns 201."""
        payload = {
            "email": "newuser@example.com",
            "password": "Str0ng!Pass",
            "password_confirm": "Str0ng!Pass",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 201
        assert User.objects.filter(email="newuser@example.com").exists()
        mock_send_email.assert_called_once()

    @patch("apps.authentication.services.send_verification_email")
    def test_duplicate_email(self, mock_send_email, api_client, create_user):
        """Registration with an already-used email returns a validation error."""
        create_user(email="existing@example.com")
        payload = {
            "email": "existing@example.com",
            "password": "Str0ng!Pass",
            "password_confirm": "Str0ng!Pass",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 400

    def test_password_too_short(self, api_client):
        """A password shorter than 8 characters is rejected."""
        payload = {
            "email": "short@example.com",
            "password": "Ab1!",
            "password_confirm": "Ab1!",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 400

    def test_password_missing_number(self, api_client):
        """A password without any digit is rejected."""
        payload = {
            "email": "nonum@example.com",
            "password": "Abcdefgh!",
            "password_confirm": "Abcdefgh!",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 400

    def test_password_missing_special_char(self, api_client):
        """A password without any special character is rejected."""
        payload = {
            "email": "nospec@example.com",
            "password": "Abcdefg1",
            "password_confirm": "Abcdefg1",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 400

    def test_password_mismatch(self, api_client):
        """Mismatched password and password_confirm returns a validation error."""
        payload = {
            "email": "mismatch@example.com",
            "password": "Str0ng!Pass",
            "password_confirm": "Different!Pass1",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == 400
