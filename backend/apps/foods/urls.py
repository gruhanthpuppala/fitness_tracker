from django.urls import path

from . import views

app_name = "foods"

urlpatterns = [
    # Food catalog
    path("foods/", views.FoodListCreateView.as_view(), name="food-list-create"),
    path("foods/<uuid:pk>/", views.FoodDetailView.as_view(), name="food-detail"),
    path("foods/<uuid:pk>/delete/", views.FoodDeleteView.as_view(), name="food-delete"),
]

# Meal logging (nested under logs/<date>/)
meal_urlpatterns = [
    path("logs/<str:date>/meals/", views.FoodEntryListCreateView.as_view(), name="meal-list-create"),
    path("logs/<str:date>/meals/<uuid:pk>/", views.FoodEntryDetailView.as_view(), name="meal-detail"),
]
