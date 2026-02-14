from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.users.models import User

LOGIN_URL = reverse("authentication:login")


@pytest.mark.django_db
class TestLogin:
    """Tests for the user login endpoint."""

    def test_successful_login(self, api_client, create_user):
        """Valid credentials return 200 with access and refresh tokens."""
        create_user(email="login@example.com", password="Str0ng!Pass1")
        payload = {"email": "login@example.com", "password": "Str0ng!Pass1"}
        response = api_client.post(LOGIN_URL, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert "access" in data.get("data", data)
        assert "refresh" in data.get("data", data)

    def test_wrong_password(self, api_client, create_user):
        """An incorrect password returns a validation error."""
        create_user(email="wrong@example.com", password="Str0ng!Pass1")
        payload = {"email": "wrong@example.com", "password": "WrongPassword1!"}
        response = api_client.post(LOGIN_URL, payload, format="json")

        assert response.status_code == 400

    def test_nonexistent_user(self, api_client):
        """Login with a non-existent email returns a validation error."""
        payload = {"email": "nobody@example.com", "password": "Str0ng!Pass1"}
        response = api_client.post(LOGIN_URL, payload, format="json")

        assert response.status_code == 400

    def test_account_lockout_after_5_failures(self, api_client, create_user):
        """After 5 failed attempts the account is locked."""
        user = create_user(email="lockout@example.com", password="Str0ng!Pass1")
        payload = {"email": "lockout@example.com", "password": "BadPassword1!"}

        for _ in range(5):
            api_client.post(LOGIN_URL, payload, format="json")

        # The account should now be locked, even with the correct password
        correct_payload = {
            "email": "lockout@example.com",
            "password": "Str0ng!Pass1",
        }
        response = api_client.post(LOGIN_URL, correct_payload, format="json")

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.locked_until is not None

    def test_lockout_expires(self, api_client, create_user):
        """A locked account can log in after the lockout period expires."""
        user = create_user(email="expire@example.com", password="Str0ng!Pass1")

        # Manually lock the account with an expired lockout
        user.failed_login_attempts = 5
        user.locked_until = timezone.now() - timezone.timedelta(minutes=1)
        user.save()

        payload = {"email": "expire@example.com", "password": "Str0ng!Pass1"}
        response = api_client.post(LOGIN_URL, payload, format="json")

        assert response.status_code == 200
