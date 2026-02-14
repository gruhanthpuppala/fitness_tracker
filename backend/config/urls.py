from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from apps.users.urls import onboarding_urlpatterns, settings_urlpatterns, targets_urlpatterns

schema_view = get_schema_view(
    openapi.Info(
        title="Fitness Tracker API",
        default_version="v1",
        description="Personal Fitness Tracking API",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/", include(onboarding_urlpatterns)),
    path("api/v1/", include(targets_urlpatterns)),
    path("api/v1/", include(settings_urlpatterns)),
    path("api/v1/", include("apps.logs.urls")),
    path("api/v1/", include("apps.measurements.urls")),
    path("api/v1/", include("apps.dashboard.urls")),
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns += [
            path("__debug__/", include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass
