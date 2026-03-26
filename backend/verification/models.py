from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import uuid

class Student(models.Model):
    registration_number = models.CharField(max_length=50, unique=True, primary_key=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=50, default="VClass Student")
    # Store the path to the verified student ID photo used for DeepFace reference
    reference_image_path = models.CharField(max_length=255)
    
    # Auth fields
    password = models.CharField(max_length=128, default="")
    auth_token = models.CharField(max_length=100, null=True, blank=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def generate_token(self):
        self.auth_token = str(uuid.uuid4())
        self.save()
        return self.auth_token

    def __str__(self):
        return f"{self.full_name} ({self.registration_number})"

class Exam(models.Model):
    exam_id = models.CharField(max_length=20, unique=True, primary_key=True)
    title = models.CharField(max_length=150)
    date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=120)

    def __str__(self):
        return self.title

class ExamLog(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    verification_attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    last_verified_at = models.DateTimeField(auto_now=True)
    
    # For continuous monitoring flags
    impersonation_flags = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.student.registration_number} - {self.exam.exam_id}"
