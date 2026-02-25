from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/trends/", views.WeightTrendView.as_view(), name="dashboard-trends"),
    path("dashboard/streaks/", views.StreakView.as_view(), name="dashboard-streaks"),
    path("dashboard/alerts/", views.AlertView.as_view(), name="dashboard-alerts"),
    path("dashboard/weekly-review/", views.WeeklyReviewView.as_view(), name="dashboard-weekly-review"),
    path("dashboard/monthly/", views.MonthlyMetricsView.as_view(), name="dashboard-monthly"),
]
