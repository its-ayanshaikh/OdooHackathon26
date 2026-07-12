from django.urls import path
from . import views

urlpatterns = [
    path('fuel/', views.fuel_list, name='fuel-list'),
    path('fuel/<int:pk>/', views.fuel_detail, name='fuel-detail'),
    path('expenses/', views.expense_list, name='expense-list'),
    path('expenses/<int:pk>/', views.expense_detail, name='expense-detail'),
]
