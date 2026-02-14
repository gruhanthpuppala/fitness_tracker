from .base import *  # noqa: F401, F403

DEBUG = False

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS", default=[])  # noqa: F405

EMAIL_BACKEND = "django.core.mail.backends.smtp.SMTPBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.sendgrid.net")  # noqa: F405
EMAIL_PORT = env.int("EMAIL_PORT", default=587)  # noqa: F405
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")  # noqa: F405
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")  # noqa: F405
EMAIL_USE_TLS = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
