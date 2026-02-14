import logging

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.utils import timezone

from apps.users.models import AuditLog, User

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract the client IP address from the request.

    Checks the X-Forwarded-For header first (for proxied requests),
    then falls back to REMOTE_ADDR.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def create_audit_log(user, action, request, details=None):
    """Create an audit log entry for a security-relevant action."""
    ip_address = get_client_ip(request)
    user_agent = request.META.get("HTTP_USER_AGENT", "")

    AuditLog.objects.create(
        user=user,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details,
    )


def check_lockout(user):
    """Check if a user account is currently locked out.

    Returns True if the account is locked and the lockout period has not expired.
    """
    if user.locked_until and user.locked_until > timezone.now():
        return True
    return False


def handle_failed_login(user, request):
    """Handle a failed login attempt.

    Increments the failed login counter and locks the account
    after 5 consecutive failed attempts (locked for 15 minutes).
    """
    user.failed_login_attempts += 1

    if user.failed_login_attempts >= 5:
        user.locked_until = timezone.now() + timezone.timedelta(minutes=15)

    user.save(update_fields=["failed_login_attempts", "locked_until"])

    create_audit_log(
        user=user,
        action=AuditLog.ActionChoices.FAILED_LOGIN,
        request=request,
        details={"attempts": user.failed_login_attempts},
    )


def handle_successful_login(user, request):
    """Handle a successful login.

    Resets the failed login counter and clears any lockout.
    """
    user.failed_login_attempts = 0
    user.locked_until = None
    user.save(update_fields=["failed_login_attempts", "locked_until"])

    create_audit_log(
        user=user,
        action=AuditLog.ActionChoices.LOGIN,
        request=request,
    )


def verify_google_token(token):
    """Verify a Google OAuth2 ID token.

    Returns a dict with email, google_id (sub), and name on success,
    or None on failure.
    """
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )

        return {
            "email": idinfo.get("email"),
            "google_id": idinfo.get("sub"),
            "name": idinfo.get("name", ""),
        }
    except Exception:
        logger.exception("Google token verification failed")
        return None


def generate_email_verification_token(user):
    """Generate a signed token for email verification.

    The token expires after 24 hours.
    """
    return signing.dumps(
        {"user_id": str(user.id), "purpose": "email_verification"},
        salt="email-verification",
    )


def verify_email_token(token):
    """Verify an email verification token.

    Returns the user_id if valid, or None if expired/invalid.
    Max age is 24 hours (86400 seconds).
    """
    try:
        data = signing.loads(
            token,
            salt="email-verification",
            max_age=86400,  # 24 hours
        )
        if data.get("purpose") != "email_verification":
            return None
        return data.get("user_id")
    except (signing.BadSignature, signing.SignatureExpired):
        return None


def generate_password_reset_token(user):
    """Generate a signed token for password reset.

    The token expires after 1 hour.
    """
    return signing.dumps(
        {"user_id": str(user.id), "purpose": "password_reset"},
        salt="password-reset",
    )


def verify_password_reset_token(token):
    """Verify a password reset token.

    Returns the user_id if valid, or None if expired/invalid.
    Max age is 1 hour (3600 seconds).
    """
    try:
        data = signing.loads(
            token,
            salt="password-reset",
            max_age=3600,  # 1 hour
        )
        if data.get("purpose") != "password_reset":
            return None
        return data.get("user_id")
    except (signing.BadSignature, signing.SignatureExpired):
        return None


def send_verification_email(user, request=None):
    """Send an email verification link to the user."""
    token = generate_email_verification_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    verification_url = f"{frontend_url}/verify-email?token={token}"

    subject = "Verify your email address"
    message = (
        f"Hi {user.name or user.email},\n\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{verification_url}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create an account, please ignore this email."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, request=None):
    """Send a password reset link to the user."""
    token = generate_password_reset_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/reset-password?token={token}"

    subject = "Reset your password"
    message = (
        f"Hi {user.name or user.email},\n\n"
        f"You requested a password reset. Click the link below to reset your password:\n\n"
        f"{reset_url}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"If you did not request a password reset, please ignore this email."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
