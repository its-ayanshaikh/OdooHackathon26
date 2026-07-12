from django.urls import path
from . import views

urlpatterns = [
    path('', views.trip_list, name='trip-list'),
    path('<int:pk>/', views.trip_detail, name='trip-detail'),
    path('<int:pk>/dispatch/', views.trip_dispatch, name='trip-dispatch'),
    path('<int:pk>/complete/', views.trip_complete, name='trip-complete'),
    path('<int:pk>/cancel/', views.trip_cancel, name='trip-cancel'),
]
