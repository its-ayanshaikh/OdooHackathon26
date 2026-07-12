from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/refresh/', views.refresh_view, name='token-refresh'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    path('auth/change-password/', views.change_password_view, name='change-password'),
    path('users/', views.admin_users_view, name='admin-users'),
    path('users/reset-password/', views.admin_reset_password_view, name='admin-reset-password'),
]
