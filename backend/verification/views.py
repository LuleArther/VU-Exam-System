import base64
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

try:
    from deepface import DeepFace
except ImportError:
    DeepFace = None # Useful if we want to run Django locally without installing deepface 

from .models import Student, Exam, ExamLog

TEMP_DIR = "/tmp/deepface_verify"
STUDENTS_DIR = "/tmp/students_reference"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(STUDENTS_DIR, exist_ok=True)

@api_view(['POST'])
def register(request):
    data = request.data
    reg_number = data.get('registration_number')
    full_name = data.get('full_name')
    password = data.get('password')
    image_b64 = data.get('base64_image')

    if not all([reg_number, full_name, password, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    if Student.objects.filter(registration_number=reg_number).exists():
        return Response({"error": "Student already registered"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Decode base64 baseline image
        if "," in image_b64:
            _, encoded = image_b64.split(",", 1)
        else:
            encoded = image_b64
        decoded = base64.b64decode(encoded)
        ref_path = os.path.join(STUDENTS_DIR, f"{reg_number}.jpg")
        with open(ref_path, "wb") as f:
            f.write(decoded)

        student = Student(
            registration_number=reg_number,
            full_name=full_name,
            reference_image_path=ref_path
        )
        student.set_password(password)
        token = student.generate_token()
        
        return Response({
            "success": True, 
            "message": "Registration successful.", 
            "token": token,
            "student_name": student.full_name
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login(request):
    data = request.data
    reg_number = data.get('registration_number')
    password = data.get('password')

    if not reg_number or not password:
        return Response({"error": "Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(registration_number=reg_number)
        if student.check_password(password):
            token = student.generate_token()
            return Response({
                "success": True, 
                "token": token, 
                "student_name": student.full_name
            })
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    except Student.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def verify_face(request):
    try:
        if not DeepFace:
            return Response({"error": "DeepFace backend is not installed on this server. Please deploy via Docker."}, status=status.HTTP_501_NOT_IMPLEMENTED)

        reg_number = request.data.get('registration_number')
        exam_id = request.data.get('exam_id')
        image_b64 = request.data.get('image_base64')

        if not all([reg_number, exam_id, image_b64]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        from django.http import JsonResponse
        return JsonResponse({"error_from_wrapper": str(e), "trace": traceback.format_exc()}, status=500)

    try:
        student = get_object_or_404(Student, registration_number=reg_number)
        
        from django.utils import timezone
        exam, _ = Exam.objects.get_or_create(
            exam_id=exam_id,
            defaults={
                'title': f'{exam_id} Final Examination',
                'date': timezone.now(),
                'duration_minutes': 120
            }
        )

        # Decode base64 to temp file
        try:
            if "," in image_b64:
                _, encoded = image_b64.split(",", 1)
            else:
                encoded = image_b64
            
            decoded = base64.b64decode(encoded)
            temp_img_path = os.path.join(TEMP_DIR, f"temp_{reg_number}.jpg")
            with open(temp_img_path, "wb") as f:
                f.write(decoded)
        except Exception as e:
            return Response({"error": "Invalid base64 image formatting"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        from django.http import JsonResponse
        return JsonResponse({"error_from_wrapper2": str(e), "trace": traceback.format_exc()}, status=500)

    try:
        # Check if reference image exists
        # In a real app we need an absolute path to the pre-uploaded reference image
        ref_path = student.reference_image_path
        if not os.path.exists(ref_path):
            return Response({"error": f"Student reference image missing on server at {ref_path}"}, status=status.HTTP_404_NOT_FOUND)

        # Run Verification
        result = DeepFace.verify(
            img1_path=temp_img_path, 
            img2_path=ref_path, 
            model_name="Facenet512",
            enforce_detection=True
        )
        
        is_verified = result.get("verified", False)

        # Log the attempt
        log, created = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.verification_attempts += 1
        log.is_verified = is_verified
        log.save()
        
        return Response({
            "verified": is_verified,
            "distance": result.get("distance", 1.0),
            "threshold": result.get("threshold", 0.4),
            "message": "Face match successful." if is_verified else "Face mismatch."
        })

    except Exception as e:
        # DeepFace raises ValueError if no face is detected
        error_msg = str(e)
        if "Face could not be detected" in error_msg:
            return Response({"verified": False, "error": "No face detected in the frame. Please look at the camera."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Clean up temp image
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

@api_view(['POST'])
def verify_continuous(request):
    """
    Silently verifies the student during the exam.
    Increments impersonation_flags on failure or if no face is detected.
    """
    if not DeepFace:
        return Response({"error": "DeepFace not installed"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    reg_number = request.data.get('registration_number')
    exam_id = request.data.get('exam_id')
    image_b64 = request.data.get('image_base64')

    if not all([reg_number, exam_id, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    student = get_object_or_404(Student, registration_number=reg_number)
    
    from django.utils import timezone
    exam, _ = Exam.objects.get_or_create(
        exam_id=exam_id,
        defaults={
            'title': f'{exam_id} Final Examination',
            'date': timezone.now(),
            'duration_minutes': 120
        }
    )

    try:
        if "," in image_b64:
            _, encoded = image_b64.split(",", 1)
        else:
            encoded = image_b64
        
        decoded = base64.b64decode(encoded)
        temp_img_path = os.path.join(TEMP_DIR, f"cont_{reg_number}.jpg")
        with open(temp_img_path, "wb") as f:
            f.write(decoded)
    except Exception:
        return Response({"error": "Invalid base64"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ref_path = student.reference_image_path
        if not os.path.exists(ref_path):
            return Response({"error": "Ref image missing"}, status=status.HTTP_404_NOT_FOUND)

        result = DeepFace.verify(
            img1_path=temp_img_path, 
            img2_path=ref_path, 
            model_name="Facenet512",
            enforce_detection=True
        )
        
        is_verified = result.get("verified", False)
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        
        if not is_verified:
            log.impersonation_flags += 1
            log.save()
            
        return Response({"verified": is_verified, "flags": log.impersonation_flags})

    except Exception as e:
        # If no face detected, flag it
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.impersonation_flags += 1
        log.save()
        return Response({"verified": False, "flags": log.impersonation_flags, "error": str(e)})
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

@api_view(['GET'])
def dashboard_logs(request):
    """
    Returns all exam logs for the dashboard.
    """
    logs = ExamLog.objects.select_related('student', 'exam').all().order_by('-last_verified_at')
    data = []
    for log in logs:
        data.append({
            "id": log.id,
            "student_name": log.student.full_name,
            "registration_number": log.student.registration_number,
            "exam_id": log.exam.exam_id,
            "exam_name": log.exam.title,
            "timestamp": log.last_verified_at.isoformat(),
            "verification_attempts": log.verification_attempts,
            "impersonation_flags": log.impersonation_flags,
            "is_verified": log.is_verified,
        })
    return Response({"logs": data})
