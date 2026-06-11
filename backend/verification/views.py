import base64
import os
import random
import json
import cv2
import numpy as np
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings

try:
    from deepface import DeepFace
except ImportError:
    DeepFace = None

from .models import Student, Exam, ExamLog, OTPVerification

TEMP_DIR = "/tmp/deepface_verify"
STUDENTS_DIR = "/tmp/students_reference"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(STUDENTS_DIR, exist_ok=True)

# Global in-memory dictionary to store active student verification codes
PENDING_CODES = {}

@api_view(['POST'])
def register(request):
    data = request.data
    reg_number = data.get('registration_number')
    email = data.get('email')
    full_name = data.get('full_name')
    password = data.get('password')
    image_b64 = data.get('base64_image')

    if not all([reg_number, email, full_name, password, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    if Student.objects.filter(registration_number=reg_number).exists() or Student.objects.filter(email=email).exists():
        return Response({"error": "Student or Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    try:
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
            email=email,
            full_name=full_name,
            reference_image_path=ref_path,
            is_active=False
        )
        student.set_password(password)
        student.save()
        
        # Generate OTP
        code = f"{random.randint(100000, 999999)}"
        OTPVerification.objects.update_or_create(
            student=student,
            defaults={'code': code, 'created_at': timezone.now()}
        )
        
        print(f"\n[DEMO] Registration Verification code for {student.registration_number}: {code}\n")
        
        return Response({
            "success": True, 
            "verification_required": True,
            "email": email,
            "debug_code": code,
            "message": "Registration initiated. Verification required."
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_registration_code(request):
    data = request.data
    reg_number = data.get('registration_number')
    code = data.get('code')

    if not reg_number or not code:
        return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(registration_number=reg_number)
        otp_record = OTPVerification.objects.filter(student=student).first()
        
        if otp_record and otp_record.code == str(code):
            # Check expiration (10 minutes)
            time_diff = timezone.now() - otp_record.created_at
            if time_diff.total_seconds() > 600:
                return Response({"error": "Verification code expired"}, status=status.HTTP_400_BAD_REQUEST)
                
            student.is_active = True
            student.save()
            otp_record.delete()
            
            token = student.generate_token()
            return Response({
                "success": True,
                "token": token,
                "student_name": student.full_name,
                "role": "student"
            })
        else:
            return Response({"error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def update_profile(request):
    try:
        reg_number = request.data.get('registration_number')
        full_name = request.data.get('full_name')
        password = request.data.get('password')
        image_b64 = request.data.get('image_base64')

        if not reg_number:
            return Response({"error": "Registration number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(registration_number=reg_number)
        except Student.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        if full_name and full_name.strip():
            student.full_name = full_name.strip()

        if password and password.strip():
            student.set_password(password.strip())

        if image_b64:
            if "," in image_b64:
                _, encoded = image_b64.split(",", 1)
            else:
                encoded = image_b64
                
            try:
                decoded = base64.b64decode(encoded)
                ref_path = student.reference_image_path
                os.makedirs(os.path.dirname(ref_path), exist_ok=True)
                
                with open(ref_path, "wb") as f:
                    f.write(decoded)
            except Exception as e:
                return Response({"error": f"Failed to save new baseline image: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        student.save()

        return Response({
            "success": True, 
            "message": "Profile updated successfully.",
            "student_name": student.full_name
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login(request):
    data = request.data
    reg_number = data.get('registration_number')
    password = data.get('password')

    if not reg_number or not password:
        return Response({"error": "Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Check for Admin Login
    if reg_number == 'admin@vu.ac.ug' and password == 'admin@123':
        return Response({
            "success": True,
            "token": "admin-token-xyz-123",
            "student_name": "Administrator",
            "role": "admin"
        })

    # 2. Check for Student Login
    try:
        student = Student.objects.get(registration_number=reg_number)
        if student.check_password(password):
            if not student.is_active:
                return Response({"error": "Account not verified. Please verify your email first."}, status=status.HTTP_401_UNAUTHORIZED)
                
            # Email Verification Code generation
            code = f"{random.randint(100000, 999999)}"
            OTPVerification.objects.update_or_create(
                student=student,
                defaults={'code': code, 'created_at': timezone.now()}
            )
            
            print(f"\n[DEMO] Login Verification code for {student.registration_number}: {code}\n")
            
            return Response({
                "success": True, 
                "verification_required": True,
                "email": student.email if student.email else f"{reg_number.lower()}@vu.ac.ug",
                "debug_code": code
            })
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    except Student.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def verify_login_code(request):
    data = request.data
    reg_number = data.get('registration_number')
    code = data.get('code')

    if not reg_number or not code:
        return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(registration_number=reg_number)
        otp_record = OTPVerification.objects.filter(student=student).first()
        
        if otp_record and otp_record.code == str(code):
            # Check expiration (10 minutes)
            time_diff = timezone.now() - otp_record.created_at
            if time_diff.total_seconds() > 600:
                return Response({"error": "Verification code expired"}, status=status.HTTP_400_BAD_REQUEST)
                
            otp_record.delete()
            token = student.generate_token()
            return Response({
                "success": True,
                "token": token,
                "student_name": student.full_name,
                "role": "student"
            })
        else:
            return Response({"error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def verify_face(request):
    try:
        reg_number = request.data.get('registration_number')
        exam_id = request.data.get('exam_id')
        image_b64 = request.data.get('image_base64')

        if not all([reg_number, exam_id, image_b64]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        student = get_object_or_404(Student, registration_number=reg_number)
        exam, _ = Exam.objects.get_or_create(
            exam_id=exam_id,
            defaults={
                'title': f'{exam_id} Examination',
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
            temp_img_path = os.path.join(TEMP_DIR, f"temp_{reg_number}.jpg")
            with open(temp_img_path, "wb") as f:
                f.write(decoded)
                
            nparr = np.frombuffer(decoded, np.uint8)
            img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_cv2 is None:
                return Response({"error": "Failed to decode image from webcam."}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": f"Invalid base64 image formatting: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        ref_path = student.reference_image_path
        if not os.path.exists(ref_path):
            return Response({"error": f"Student reference image missing on server."}, status=status.HTTP_404_NOT_FOUND)

        # Run Face Verification (DeepFace or OpenCV Fallback)
        is_verified = False
        distance = 1.0
        threshold = 0.4
        
        if DeepFace:
            try:
                result = DeepFace.verify(
                    img1_path=img_cv2, 
                    img2_path=ref_path, 
                    model_name="Facenet512",
                    enforce_detection=True
                )
                is_verified = result.get("verified", False)
                distance = result.get("distance", 1.0)
                threshold = result.get("threshold", 0.4)
            except Exception as e:
                is_verified = False
        else:
            # OpenCV Fallback - check if there's at least one face in the frame
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            is_verified = len(faces) > 0
            distance = 0.0 if is_verified else 1.0
            threshold = 0.5

        log, created = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.verification_attempts += 1
        log.is_verified = is_verified
        log.save()
        
        return Response({
            "verified": is_verified,
            "distance": distance,
            "threshold": threshold,
            "message": "Face match successful." if is_verified else "Face mismatch. Position yourself directly in front of the camera."
        })

    except Exception as e:
        error_msg = str(e)
        if "Face could not be detected" in error_msg:
            return Response({"verified": False, "error": "No face detected. Please look at the camera."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

@api_view(['POST'])
def verify_continuous(request):
    reg_number = request.data.get('registration_number')
    exam_id = request.data.get('exam_id')
    image_b64 = request.data.get('image_base64')

    if not all([reg_number, exam_id, image_b64]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    student = get_object_or_404(Student, registration_number=reg_number)
    exam = get_object_or_404(Exam, exam_id=exam_id)

    try:
        if "," in image_b64:
            _, encoded = image_b64.split(",", 1)
        else:
            encoded = image_b64
        
        decoded = base64.b64decode(encoded)
        temp_img_path = os.path.join(TEMP_DIR, f"cont_{reg_number}.jpg")
        with open(temp_img_path, "wb") as f:
            f.write(decoded)
            
        nparr = np.frombuffer(decoded, np.uint8)
        img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_cv2 is None:
            return Response({"error": "Failed to decode continuous frame"}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception:
        return Response({"error": "Invalid base64"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ref_path = student.reference_image_path
        
        gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        frame_area = height * width
        
        # ──────────────────────────────────────────────────
        # STEP 1: Camera covered / obstructed detection
        # If the average brightness is very low, the camera
        # is likely covered by a hand or object.
        # ──────────────────────────────────────────────────
        avg_brightness = float(np.mean(gray))
        is_camera_covered = avg_brightness < 35  # very dark frame
        
        # Also check if the frame is nearly uniform (e.g. a hand or paper)
        brightness_std = float(np.std(gray))
        is_uniform = brightness_std < 15  # almost no variation
        
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        
        try:
            timeline = json.loads(log.timeline_json)
        except:
            timeline = []
            
        is_verified = True
        event_name = ""
        details = ""
        
        if is_camera_covered or (is_uniform and avg_brightness < 80):
            # Camera is covered or obstructed
            is_verified = False
            log.impersonation_flags += 1
            event_name = "Camera Covered"
            details = f"Camera appears to be covered or obstructed (brightness: {avg_brightness:.0f}, variation: {brightness_std:.0f})."
        else:
            # ──────────────────────────────────────────────────
            # STEP 2: Face detection with strict parameters
            # Use high minNeighbors (10) so only very confident
            # detections count.  Require each face to occupy at
            # least 3% of the frame area to ignore tiny ghosts.
            # ──────────────────────────────────────────────────
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            min_face_side = int(min(height, width) * 0.10)  # face must be >= 10% of smallest dimension
            
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.15,   # slightly coarser scale steps (fewer false positives)
                minNeighbors=10,    # very high confidence required
                minSize=(min_face_side, min_face_side),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # Extra filter: discard any detection smaller than 3% of frame area
            confirmed_faces = []
            for (x, y, w, h) in faces:
                face_area = w * h
                if face_area >= frame_area * 0.03:
                    confirmed_faces.append((x, y, w, h))
            
            num_faces = len(confirmed_faces)
            
            if num_faces > 1:
                is_verified = False
                log.impersonation_flags += 1
                event_name = "Multiple Faces Detected"
                details = f"Detected {num_faces} confirmed faces in the camera feed."
            elif num_faces == 0:
                is_verified = False
                log.impersonation_flags += 1
                event_name = "No Face Detected"
                details = "No face detected in the camera feed. Please look at the camera."
            else:
                # Exactly 1 face – optionally verify identity with DeepFace
                if DeepFace and os.path.exists(ref_path):
                    try:
                        result = DeepFace.verify(
                            img1_path=img_cv2, 
                            img2_path=ref_path, 
                            model_name="Facenet512",
                            enforce_detection=False  # we already confirmed a face exists
                        )
                        is_verified = result.get("verified", False)
                        if not is_verified:
                            log.impersonation_flags += 1
                            event_name = "Face Mismatch"
                            details = "Face does not match the baseline profile."
                    except Exception:
                        # DeepFace failed (blurry, angle, etc.) – do NOT penalise
                        is_verified = True
                else:
                    is_verified = True  # Fallback when DeepFace not available

        if event_name:
            timeline.append({
                "timestamp": timezone.now().isoformat(),
                "event": event_name,
                "details": details
            })
            log.timeline_json = json.dumps(timeline)
            
        log.save()
        
        return Response({
            "verified": is_verified,
            "flags": log.impersonation_flags,
            "multiple_faces": event_name == "Multiple Faces Detected",
            "no_face": event_name == "No Face Detected",
            "camera_covered": event_name == "Camera Covered",
            "face_count": num_faces if not (is_camera_covered or (is_uniform and avg_brightness < 80)) else 0
        })

    except Exception as e:
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.impersonation_flags += 1
        log.save()
        return Response({"verified": False, "flags": log.impersonation_flags, "error": str(e)})
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

@api_view(['GET'])
def list_exams(request):
    student_id = request.query_params.get('student_id')
    exams = Exam.objects.filter(is_active=True).order_by('-date')
    data = []
    for exam in exams:
        status_val = "active"
        score_val = None
        max_score_val = None
        
        if student_id:
            log = ExamLog.objects.filter(student__registration_number=student_id, exam=exam).first()
            if log and log.status in ['submitted', 'graded']:
                status_val = "completed"
                if log.status == 'graded':
                    status_val = "graded"
                score_val = log.score
                try:
                    questions = json.loads(exam.questions_json)
                    max_score_val = sum(q.get('points', 1) for q in questions)
                except:
                    max_score_val = 100
                
        try:
            q_count = len(json.loads(exam.questions_json))
        except:
            q_count = 0
            
        data.append({
            "id": exam.exam_id,
            "title": exam.title,
            "courseCode": exam.exam_id,
            "date": exam.date.strftime("%B %d, %Y, %I:%M %p") if exam.date else "Not Scheduled",
            "duration": f"{exam.duration_minutes // 60} Hours" if exam.duration_minutes >= 60 else f"{exam.duration_minutes} Mins",
            "duration_minutes": exam.duration_minutes,
            "type": exam.exam_type,
            "question_count": q_count,
            "status": status_val,
            "score": score_val,
            "max_score": max_score_val
        })
    return Response({"exams": data})

@api_view(['POST'])
def create_exam(request):
    data = request.data
    exam_id = data.get('exam_id')
    title = data.get('title')
    duration_minutes = int(data.get('duration_minutes', 120))
    exam_type = data.get('exam_type', 'objective')
    questions = data.get('questions', [])
    
    exam, created = Exam.objects.update_or_create(
        exam_id=exam_id,
        defaults={
            'title': title,
            'date': timezone.now(),
            'duration_minutes': duration_minutes,
            'exam_type': exam_type,
            'questions_json': json.dumps(questions),
            'is_active': True
        }
    )
    return Response({"success": True, "exam_id": exam.exam_id})

@api_view(['GET'])
def get_exam(request, exam_id):
    exam = get_object_or_404(Exam, exam_id=exam_id)
    try:
        questions = json.loads(exam.questions_json)
    except:
        questions = []
        
    # Send all questions but hide correct answers from students
    stripped = []
    for q in questions:
        stripped.append({
            "id": q.get("id"),
            "type": q.get("type"),
            "text": q.get("text"),
            "options": q.get("options", []),
            "points": q.get("points", 1)
        })
        
    return Response({
        "exam_id": exam.exam_id,
        "title": exam.title,
        "duration_minutes": exam.duration_minutes,
        "type": exam.exam_type,
        "questions": stripped
    })

@api_view(['POST'])
def start_exam(request, exam_id):
    reg_number = request.data.get('registration_number')
    student = get_object_or_404(Student, registration_number=reg_number)
    exam = get_object_or_404(Exam, exam_id=exam_id)
    
    log, created = ExamLog.objects.get_or_create(
        student=student,
        exam=exam,
        defaults={
            'status': 'started',
            'started_at': timezone.now(),
            'timeline_json': json.dumps([{
                "timestamp": timezone.now().isoformat(),
                "event": "Exam Started",
                "details": f"Student started the exam: {exam.title}."
            }])
        }
    )
    
    if not created:
        log.status = 'started'
        if not log.started_at:
            log.started_at = timezone.now()
            
        try:
            timeline = json.loads(log.timeline_json)
        except:
            timeline = []
        timeline.append({
            "timestamp": timezone.now().isoformat(),
            "event": "Exam Resume",
            "details": "Student re-entered the exam interface."
        })
        log.timeline_json = json.dumps(timeline)
        log.save()
        
    return Response({"success": True})

@api_view(['POST'])
def submit_exam(request, exam_id):
    reg_number = request.data.get('registration_number')
    answers = request.data.get('answers', {})
    student = get_object_or_404(Student, registration_number=reg_number)
    exam = get_object_or_404(Exam, exam_id=exam_id)
    
    log = get_object_or_404(ExamLog, student=student, exam=exam)
    log.status = 'submitted'
    log.submitted_at = timezone.now()
    log.answers_json = json.dumps(answers)
    
    score = 0.0
    grade_letter = 'Pending'
    feedback = ''
    
    if exam.exam_type == 'objective':
        try:
            questions = json.loads(exam.questions_json)
            total_points = 0
            earned_points = 0
            for q in questions:
                points = q.get('points', 1)
                total_points += points
                correct = q.get('correct_answer')
                student_ans = answers.get(q.get('id'))
                if student_ans == correct:
                    earned_points += points
                    
            if total_points > 0:
                score = (earned_points / total_points) * 100
                if score >= 90: grade_letter = 'A'
                elif score >= 80: grade_letter = 'B'
                elif score >= 70: grade_letter = 'C'
                elif score >= 60: grade_letter = 'D'
                else: grade_letter = 'F'
                feedback = f"Automatically graded. {earned_points}/{total_points} correct answers."
            else:
                score = 100.0
                grade_letter = 'A'
                feedback = "No questions set."
        except Exception as e:
            feedback = f"Error during auto-grading: {str(e)}"
            
        log.score = score
        log.grade_letter = grade_letter
        log.feedback = feedback
        log.status = 'graded'
    else:
        log.feedback = "Essay exam. Awaiting lecturer review."
        log.grade_letter = "Pending"
        
    try:
        timeline = json.loads(log.timeline_json)
    except:
        timeline = []
        
    timeline.append({
        "timestamp": timezone.now().isoformat(),
        "event": "Exam Submitted",
        "details": f"Student submitted answers. Status: {log.status}."
    })
    log.timeline_json = json.dumps(timeline)
    log.save()
    
    return Response({"success": True, "score": log.score, "grade": log.grade_letter})

@api_view(['POST'])
def log_exam_event(request, exam_id):
    reg_number = request.data.get('registration_number')
    event_name = request.data.get('event')
    details = request.data.get('details', '')
    
    student = get_object_or_404(Student, registration_number=reg_number)
    exam = get_object_or_404(Exam, exam_id=exam_id)
    
    log = get_object_or_404(ExamLog, student=student, exam=exam)
    try:
        timeline = json.loads(log.timeline_json)
    except:
        timeline = []
        
    timeline.append({
        "timestamp": timezone.now().isoformat(),
        "event": event_name,
        "details": details
    })
    log.timeline_json = json.dumps(timeline)
    
    cheat_indicators = ["Tab Focus Lost", "Multiple Faces Detected", "No Face Detected", "Camera Disconnected"]
    if event_name in cheat_indicators:
        log.impersonation_flags += 1
        
    log.save()
    return Response({"success": True, "flags": log.impersonation_flags})

@api_view(['POST'])
def grade_exam(request, exam_id):
    reg_number = request.data.get('registration_number')
    score = float(request.data.get('score', 0.0))
    grade_letter = request.data.get('grade_letter', '')
    feedback = request.data.get('feedback', '')
    
    student = get_object_or_404(Student, registration_number=reg_number)
    exam = get_object_or_404(Exam, exam_id=exam_id)
    
    log = get_object_or_404(ExamLog, student=student, exam=exam)
    log.score = score
    log.grade_letter = grade_letter
    log.feedback = feedback
    log.status = 'graded'
    
    try:
        timeline = json.loads(log.timeline_json)
    except:
        timeline = []
        
    timeline.append({
        "timestamp": timezone.now().isoformat(),
        "event": "Exam Graded",
        "details": f"Graded by lecturer. Score: {score} ({grade_letter})."
    })
    log.timeline_json = json.dumps(timeline)
    log.save()
    
    return Response({"success": True})

@api_view(['GET'])
def dashboard_logs(request):
    logs = ExamLog.objects.select_related('student', 'exam').all().order_by('-last_verified_at')
    data = []
    for log in logs:
        try:
            timeline = json.loads(log.timeline_json)
        except:
            timeline = []
            
        try:
            answers = json.loads(log.answers_json)
        except:
            answers = {}
            
        try:
            questions = json.loads(log.exam.questions_json)
            max_score = sum(q.get('points', 1) for q in questions)
        except:
            questions = []
            max_score = 100
            
        data.append({
            "id": log.id,
            "max_score": max_score,
            "student_name": log.student.full_name,
            "registration_number": log.student.registration_number,
            "exam_id": log.exam.exam_id,
            "exam_name": log.exam.title,
            "timestamp": log.last_verified_at.isoformat(),
            "verification_attempts": log.verification_attempts,
            "impersonation_flags": log.impersonation_flags,
            "is_verified": log.is_verified,
            "status": log.status,
            "score": log.score,
            "grade_letter": log.grade_letter,
            "feedback": log.feedback,
            "timeline": timeline,
            "answers": answers,
            "questions": questions,
            "exam_type": log.exam.exam_type,
            "started_at": log.started_at.isoformat() if log.started_at else None,
            "submitted_at": log.submitted_at.isoformat() if log.submitted_at else None,
        })
    return Response({"logs": data})
