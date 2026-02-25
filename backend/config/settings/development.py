from pathlib import Path

from .base import *  # noqa: F401, F403

DEBUG = True

CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False

# Use SQLite for local development (no PostgreSQL needed)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": Path(__file__).resolve().parent.parent.parent / "db.sqlite3",
    }
}

# Only add debug toolbar if it's installed
try:
    import debug_toolbar  # noqa: F401

    INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa: F405
except ImportError:
    pass

INTERNAL_IPS = ["127.0.0.1"]

GOOGLE_CLIENT_ID = "49852843328-gjlqmdkc5s6lku5sru9e2pbarbkfc9cr.apps.googleusercontent.com"
