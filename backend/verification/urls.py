from django.urls import path
from .views import (
    verify_face, register, login, verify_continuous, dashboard_logs, update_profile,
    verify_login_code, verify_registration_code, list_exams, create_exam, get_exam,
    get_exam_full, list_all_exams, list_students,
    start_exam, submit_exam, log_exam_event, grade_exam
)

urlpatterns = [
    path('verify-face/', verify_face, name='verify_face'),
    path('verify-continuous/', verify_continuous, name='verify_continuous'),
    path('dashboard-logs/', dashboard_logs, name='dashboard_logs'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('verify-login-code/', verify_login_code, name='verify_login_code'),
    path('verify-registration-code/', verify_registration_code, name='verify_registration_code'),
    path('update-profile/', update_profile, name='update_profile'),
    path('students/', list_students, name='list_students'),
    path('exams/', list_exams, name='list_exams'),
    path('exams/all/', list_all_exams, name='list_all_exams'),
    path('exams/create/', create_exam, name='create_exam'),
    path('exams/<str:exam_id>/', get_exam, name='get_exam'),
    path('exams/<str:exam_id>/full/', get_exam_full, name='get_exam_full'),
    path('exams/<str:exam_id>/start/', start_exam, name='start_exam'),
    path('exams/<str:exam_id>/submit/', submit_exam, name='submit_exam'),
    path('exams/<str:exam_id>/log-event/', log_exam_event, name='log_exam_event'),
    path('exams/<str:exam_id>/grade/', grade_exam, name='grade_exam'),
]
