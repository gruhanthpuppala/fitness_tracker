from django.urls import path

from . import views

app_name = "logs"

urlpatterns = [
    path("logs/", views.DailyLogListCreateView.as_view(), name="log-list-create"),
    path("logs/today/", views.DailyLogTodayView.as_view(), name="log-today"),
    path("logs/<str:date>/", views.DailyLogDetailView.as_view(), name="log-detail"),
]
