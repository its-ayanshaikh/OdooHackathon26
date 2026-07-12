from django.urls import path
from . import views

urlpatterns = [
    path('', views.driver_list, name='driver-list'),
    path('<int:pk>/', views.driver_detail, name='driver-detail'),
]
