from django.urls import path
from .views import verify_face, register, login, verify_continuous, dashboard_logs

urlpatterns = [
    path('verify-face/', verify_face, name='verify_face'),
    path('verify-continuous/', verify_continuous, name='verify_continuous'),
    path('dashboard-logs/', dashboard_logs, name='dashboard_logs'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
]
