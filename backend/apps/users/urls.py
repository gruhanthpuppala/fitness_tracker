from django.urls import path

from .onboarding_views import (
    OnboardingProfileView,
    OnboardingStatusView,
    OnboardingTargetsView,
)
from .settings_views import SettingsView
from .views import UserProfileView, UserTargetView

urlpatterns = [
    path("me/", UserProfileView.as_view(), name="user-profile"),
]

settings_urlpatterns = [
    path("settings/", SettingsView.as_view(), name="settings"),
]

# These are included via config/urls.py at /api/v1/
onboarding_urlpatterns = [
    path("onboarding/profile/", OnboardingProfileView.as_view(), name="onboarding-profile"),
    path("onboarding/targets/", OnboardingTargetsView.as_view(), name="onboarding-targets"),
    path("onboarding/status/", OnboardingStatusView.as_view(), name="onboarding-status"),
]

targets_urlpatterns = [
    path("targets/", UserTargetView.as_view(), name="user-targets"),
]
