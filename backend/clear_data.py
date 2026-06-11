from verification.models import Exam, Student, ExamLog

Exam.objects.all().delete()
Student.objects.all().delete()
ExamLog.objects.all().delete()

print("All demo exams, students, and logs have been cleared successfully.")
