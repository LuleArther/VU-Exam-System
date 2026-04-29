import base64
import os
import shutil
from pathlib import Path
import tempfile
import numpy as np
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Student, Exam, ExamLog

# Cross-platform temp directories
BASE_TEMP_DIR = Path(tempfile.gettempdir())
TEMP_DIR = BASE_TEMP_DIR / "deepface_verify"
STUDENTS_DIR = BASE_TEMP_DIR / "students_reference"
TEMP_DIR.mkdir(parents=True, exist_ok=True)
STUDENTS_DIR.mkdir(parents=True, exist_ok=True)


def _extract_base64_payload(image_b64):
    if "," in image_b64:
        _, encoded = image_b64.split(",", 1)
    else:
        encoded = image_b64
    return encoded


def _save_base64_image(image_b64, target_path):
    encoded = _extract_base64_payload(image_b64)
    decoded = base64.b64decode(encoded)
    with open(target_path, "wb") as file_handle:
        file_handle.write(decoded)
    return target_path


def _enhance_image_for_low_light(source_path, target_path):
    import cv2

    image = cv2.imread(str(source_path))
    if image is None:
        raise ValueError(f"Could not read image at {source_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))

    lab_image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    enhanced = cv2.merge((l_channel, a_channel, b_channel))
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    if brightness < 110:
        gamma = 1.35
        inverse_gamma = 1.0 / gamma
        table = np.array([(index / 255.0) ** inverse_gamma * 255 for index in range(256)]).astype("uint8")
        enhanced = cv2.LUT(enhanced, table)

    cv2.imwrite(str(target_path), enhanced)
    return target_path


def _prepare_image_for_deepface(source_path, prefix):
    raw_path = TEMP_DIR / f"{prefix}_raw.jpg"
    processed_path = TEMP_DIR / f"{prefix}_processed.jpg"
    shutil.copy2(str(source_path), str(raw_path))
    _enhance_image_for_low_light(raw_path, processed_path)
    return raw_path, processed_path


def _deepface_module():
    from deepface import DeepFace

    return DeepFace


def _verification_payload(distance, threshold, success_message, failure_message):
    match_percentage = max(0, min(100, 100 - (distance * 100)))
    verified = distance <= threshold
    return verified, round(match_percentage, 2)

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
        ref_path = STUDENTS_DIR / f"{reg_number}.jpg"
        raw_ref_path = TEMP_DIR / f"{reg_number}_register_raw.jpg"
        _save_base64_image(image_b64, raw_ref_path)
        _enhance_image_for_low_light(raw_ref_path, ref_path)
        raw_ref_path.unlink(missing_ok=True)

        student = Student(
            registration_number=reg_number,
            full_name=full_name,
            reference_image_path=str(ref_path)
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
def update_reference_image(request):
    reg_number = request.data.get('registration_number')
    password = request.data.get('password')
    auth_token = request.data.get('auth_token')
    image_b64 = request.data.get('base64_image')

    if not all([reg_number, image_b64]):
        return Response({"error": "Registration number and image are required"}, status=status.HTTP_400_BAD_REQUEST)

    student = get_object_or_404(Student, registration_number=reg_number)

    if auth_token:
        if student.auth_token != auth_token:
            return Response({"error": "Invalid session token"}, status=status.HTTP_401_UNAUTHORIZED)
    elif password:
        if not student.check_password(password):
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response({"error": "Please sign in again to update your reference image"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        ref_path = STUDENTS_DIR / f"{reg_number}.jpg"
        raw_ref_path = TEMP_DIR / f"{reg_number}_update_raw.jpg"
        _save_base64_image(image_b64, raw_ref_path)
        _enhance_image_for_low_light(raw_ref_path, ref_path)
        raw_ref_path.unlink(missing_ok=True)

        student.reference_image_path = str(ref_path)
        student.save(update_fields=["reference_image_path"])

        return Response({
            "success": True,
            "message": "Reference image updated successfully."
        })
    except Exception as e:
        return Response({"error": f"Could not update image: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    """
    Expects JSON:
    {
       "registration_number": "VU-BIT-2503-1728-DAY",
       "exam_id": "COMP301",
       "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    """
    try:
        DeepFace = _deepface_module()
    except ImportError:
        return Response({"error": "DeepFace backend is not installed on this server. Please deploy via Docker."}, status=status.HTTP_501_NOT_IMPLEMENTED)

    reg_number = request.data.get('registration_number')
    exam_id = request.data.get('exam_id')
    image_b64 = request.data.get('image_base64')

    if not all([reg_number, exam_id, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    student = get_object_or_404(Student, registration_number=reg_number)
    temp_cleanup_paths = []
    
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
        temp_img_path = TEMP_DIR / f"temp_{reg_number}.jpg"
        _save_base64_image(image_b64, temp_img_path)
        temp_cleanup_paths.append(temp_img_path)
    except Exception as e:
        return Response({"error": "Invalid base64 image formatting"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Check if reference image exists
        # In a real app we need an absolute path to the pre-uploaded reference image
        ref_path = student.reference_image_path
        if not os.path.exists(ref_path):
            return Response({"error": f"Student reference image missing on server at {ref_path}"}, status=status.HTTP_404_NOT_FOUND)

        try:
            ref_raw_path, ref_processed_path = _prepare_image_for_deepface(ref_path, f"{reg_number}_ref")
            probe_raw_path, probe_processed_path = _prepare_image_for_deepface(temp_img_path, f"{reg_number}_probe")
            temp_cleanup_paths.extend([ref_raw_path, ref_processed_path, probe_raw_path, probe_processed_path])
            # Run Verification with Facenet512
            result = DeepFace.verify(
                img1_path=probe_processed_path, 
                img2_path=ref_processed_path, 
                model_name="Facenet512",
                enforce_detection=True
            )
            
            # Extract distance and use a more lenient threshold
            distance = float(result.get("distance", 1.0))
            custom_threshold = 0.6  # More lenient than default 0.4
            is_verified, match_percentage = _verification_payload(distance, custom_threshold, "", "")

            # Log the attempt
            log, created = ExamLog.objects.get_or_create(student=student, exam=exam)
            log.verification_attempts += 1
            log.is_verified = is_verified
            log.save()
            
            return Response({
                "verified": is_verified,
                "distance": round(distance, 4),
                "match_percentage": match_percentage,
                "threshold": custom_threshold,
                "message": f"Face match {match_percentage:.1f}% confident. {'Verification successful!' if is_verified else 'Below 40% threshold - please try again.'}"
            })

        except ValueError as e:
            # DeepFace raises ValueError if no face is detected
            error_msg = str(e)
            if "Face could not be detected" in error_msg or "face" in error_msg.lower():
                return Response({
                    "verified": False, 
                    "error": "No face detected in the frame. Please look at the camera.",
                    "match_percentage": 0
                }, status=status.HTTP_400_BAD_REQUEST)
            raise  # Re-raise if it's a different ValueError

    except Exception as e:
        # Catch all other exceptions and return JSON error
        import traceback
        error_msg = str(e)
        traceback.print_exc()  # Log for debugging
        return Response({
            "verified": False, 
            "error": f"Verification service error: {error_msg}",
            "match_percentage": 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Clean up temp image
        try:
            for cleanup_path in temp_cleanup_paths:
                cleanup_path.unlink(missing_ok=True)
        except Exception:
            pass

@api_view(['POST'])
def verify_continuous(request):
    """
    Silently verifies the student during the exam.
    Increments impersonation_flags on failure or if no face is detected.
    """
    try:
        DeepFace = _deepface_module()
    except ImportError:
        return Response({"error": "DeepFace not installed"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    reg_number = request.data.get('registration_number')
    exam_id = request.data.get('exam_id')
    image_b64 = request.data.get('image_base64')

    if not all([reg_number, exam_id, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    student = get_object_or_404(Student, registration_number=reg_number)
    temp_cleanup_paths = []
    
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
        temp_img_path = TEMP_DIR / f"cont_{reg_number}.jpg"
        _save_base64_image(image_b64, temp_img_path)
        temp_cleanup_paths.append(temp_img_path)
    except Exception:
        return Response({"error": "Invalid base64"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ref_path = student.reference_image_path
        if not os.path.exists(ref_path):
            return Response({"error": "Ref image missing"}, status=status.HTTP_404_NOT_FOUND)

        try:
            ref_raw_path, ref_processed_path = _prepare_image_for_deepface(ref_path, f"cont_{reg_number}_ref")
            probe_raw_path, probe_processed_path = _prepare_image_for_deepface(temp_img_path, f"cont_{reg_number}_probe")
            temp_cleanup_paths.extend([ref_raw_path, ref_processed_path, probe_raw_path, probe_processed_path])
            result = DeepFace.verify(
                img1_path=probe_processed_path, 
                img2_path=ref_processed_path, 
                model_name="Facenet512",
                enforce_detection=True
            )
            
            # Use lenient threshold for continuous verification
            distance = float(result.get("distance", 1.0))
            custom_threshold = 0.6  # More lenient threshold
            is_verified, match_percentage = _verification_payload(distance, custom_threshold, "", "")
            
            log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
            
            if not is_verified:
                log.impersonation_flags += 1
                log.save()
                
            return Response({
                "verified": is_verified, 
                "flags": log.impersonation_flags,
                "match_percentage": match_percentage,
                "distance": round(distance, 4)
            })
        
        except ValueError as e:
            # Face not detected during exam
            log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
            log.impersonation_flags += 1
            log.save()
            return Response({
                "verified": False, 
                "flags": log.impersonation_flags, 
                "error": "No face detected",
                "match_percentage": 0
            })

    except Exception as e:
        # Any other error during verification
        import traceback
        traceback.print_exc()
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.impersonation_flags += 1
        log.save()
        return Response({
            "verified": False, 
            "flags": log.impersonation_flags, 
            "error": f"Verification error: {str(e)}",
            "match_percentage": 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        try:
            for cleanup_path in temp_cleanup_paths:
                cleanup_path.unlink(missing_ok=True)
        except Exception:
            pass

@api_view(['GET'])
def dashboard_logs(request):
    """
    Returns all exam logs for the dashboard.
    """
    logs = ExamLog.objects.select_related('student', 'exam').all().order_by('-timestamp')
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
