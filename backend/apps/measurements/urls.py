from django.urls import path

from . import views

app_name = "measurements"

urlpatterns = [
    path("measurements/", views.MeasurementListCreateView.as_view(), name="measurement-list-create"),
    path("measurements/latest/", views.MeasurementLatestView.as_view(), name="measurement-latest"),
    path("measurements/<uuid:pk>/", views.MeasurementDetailView.as_view(), name="measurement-detail"),
]
