from django.urls import path

from . import custom_views, views

app_name = "logs"

urlpatterns = [
    path("logs/", views.DailyLogListCreateView.as_view(), name="log-list-create"),
    path("logs/today/", views.DailyLogTodayView.as_view(), name="log-today"),
    path("logs/custom-metrics/", custom_views.CustomMetricDefinitionListCreateView.as_view(), name="custom-metric-list-create"),
    path("logs/custom-metrics/<uuid:pk>/", custom_views.CustomMetricDefinitionDeleteView.as_view(), name="custom-metric-delete"),
    path("logs/<str:date>/custom-entries/", custom_views.CustomMetricEntryListCreateView.as_view(), name="custom-entry-list-create"),
    path("logs/<str:date>/", views.DailyLogDetailView.as_view(), name="log-detail"),
]
