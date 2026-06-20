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

# ─────────────────────────────────────────────────────────────────────────────
# Model Warm-up (runs ONCE when Django loads this module)
# Pre-loading VGG-Face into memory means the first real verification
# takes 2–4 seconds instead of 30–120 seconds.
# ─────────────────────────────────────────────────────────────────────────────
_DEEPFACE_WARM = False

def _warmup_deepface():
    """Build a dummy 1-pixel image and run DeepFace.represent() to force
    the VGG-Face model weights to load into memory now, not on first request."""
    global _DEEPFACE_WARM
    if DeepFace and not _DEEPFACE_WARM:
        try:
            dummy = np.zeros((224, 224, 3), dtype=np.uint8)
            dummy_path = os.path.join(TEMP_DIR, "_warmup.jpg")
            cv2.imwrite(dummy_path, dummy)
            DeepFace.represent(
                img_path=dummy_path,
                model_name="VGG-Face",
                enforce_detection=False,
                detector_backend="opencv",
            )
            if os.path.exists(dummy_path):
                os.remove(dummy_path)
            _DEEPFACE_WARM = True
            print("[FACE] VGG-Face model pre-loaded ✅")
        except Exception as e:
            print(f"[FACE] Warm-up skipped: {e}")

_warmup_deepface()



# ─────────────────────────────────────────────────────────────────────────────
# Email helper using Resend
# ─────────────────────────────────────────────────────────────────────────────
def send_otp_email(to_email: str, code: str, student_name: str, purpose: str = "registration"):
    """Send OTP via Resend. Falls back to console log if Resend unavailable."""
    subject = "Victoria University – Email Verification Code"
    if purpose == "login":
        subject = "Victoria University – Login Verification Code"

    html_body = f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2c6fb7, #1a5ba0); padding: 32px; text-align: center;">
        <h1 style="color: white; font-size: 22px; margin: 0; letter-spacing: -0.5px;">Victoria University</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Online Examination Portal</p>
      </div>
      <div style="padding: 36px 32px; background: white;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 12px;">Hello, {student_name}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Your verification code for <strong>{purpose}</strong> is:
        </p>
        <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #2c6fb7; font-family: monospace;">{code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; Victoria University Kampala &bull; www.vu.ac.ug</p>
      </div>
    </div>
    """

    resend_key = getattr(settings, 'RESEND_API_KEY', None)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev')

    if resend_key:
        try:
            import resend
            resend.api_key = resend_key
            resend.Emails.send({
                "from": f"Victoria University <{from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            })
            print(f"[EMAIL] OTP sent to {to_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
            print(f"[FALLBACK] OTP for {to_email}: {code}")
    else:
        print(f"\n[DEMO] Verification code for {to_email}: {code}\n")


# ─────────────────────────────────────────────────────────────────────────────
# Auth Views
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def register(request):
    data = request.data
    reg_number = data.get('registration_number')
    email = data.get('email')
    full_name = data.get('full_name')
    password = data.get('password')
    image_b64 = data.get('base64_image')
    faculty = data.get('faculty', 'FST')

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
            faculty=faculty,
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
        
        # Send OTP via Resend
        send_otp_email(email, code, full_name, purpose="registration")
        
        return Response({
            "success": True, 
            "verification_required": True,
            "email": email,
            "message": "Registration initiated. Please check your email for a verification code."
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
                "role": "student",
                "student_id": student.registration_number,
                "faculty": student.faculty
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
        faculty = request.data.get('faculty')

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

        if faculty:
            student.faculty = faculty

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
            
            email_to = student.email if student.email else f"{reg_number.lower()}@vu.ac.ug"
            send_otp_email(email_to, code, student.full_name, purpose="login")
            
            return Response({
                "success": True, 
                "verification_required": True,
                "email": email_to,
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
                "role": "student",
                "student_id": student.registration_number,
                "faculty": student.faculty
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
            return Response({"error": "Student reference image missing on server."}, status=status.HTTP_404_NOT_FOUND)

        is_verified = False
        distance    = 1.0
        threshold   = 0.55   # VGG-Face lenient threshold
        model_used  = "none"

        # ── 1. Downscale to 640px max width (reduces memory + speeds up inference) ──
        h, w = img_cv2.shape[:2]
        if w > 640:
            scale   = 640 / w
            img_cv2 = cv2.resize(img_cv2, (640, int(h * scale)), interpolation=cv2.INTER_AREA)

        # ── 2. CLAHE brightness normalisation (handles dark / bright rooms) ────────
        try:
            lab  = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab   = cv2.merge((clahe.apply(l), a, b))
            img_cv2 = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        except Exception:
            pass  # if colour conversion fails just use the raw frame

        proc_path = os.path.join(TEMP_DIR, f"proc_{reg_number}.jpg")
        cv2.imwrite(proc_path, img_cv2, [cv2.IMWRITE_JPEG_QUALITY, 90])

        if DeepFace:
            # ── Single fast model: VGG-Face is the fastest model in DeepFace
            # and still ~90 %+ accurate. Using opencv detector (fastest).
            # enforce_detection=False means it won’t crash on a slightly
            # off-centre face – it still finds the face, just more tolerantly.
            try:
                result = DeepFace.verify(
                    img1_path=proc_path,
                    img2_path=ref_path,
                    model_name="VGG-Face",
                    enforce_detection=False,
                    detector_backend="opencv",
                )
                distance    = result.get("distance", 1.0)
                # DeepFace default VGG-Face threshold is 0.40; we loosen to 0.55
                # so minor lighting / angle variation still passes
                is_verified = distance <= 0.55
                model_used  = "VGG-Face"
            except Exception as e:
                print(f"[FACE] VGG-Face error: {e}")
                is_verified = False
        else:
            # DeepFace not available — use Haar cascade (face-detected = pass)
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(cascade_path)
            gray  = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            is_verified = len(faces) > 0
            distance    = 0.0 if is_verified else 1.0
            threshold   = 0.5
            model_used  = "haarcascade"

        # ── Clean up ───────────────────────────────────────────────────────────────
        if os.path.exists(proc_path):
            os.remove(proc_path)

        log, created = ExamLog.objects.get_or_create(student=student, exam=exam)
        log.verification_attempts += 1
        log.is_verified = is_verified
        log.save()

        return Response({
            "verified":   is_verified,
            "distance":   round(distance, 4),
            "threshold":  round(threshold, 4),
            "model_used": model_used,
            "message":    "Face match successful." if is_verified
                          else "Face mismatch. Ensure good lighting and look directly at the camera."
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
        
        avg_brightness = float(np.mean(gray))
        is_camera_covered = avg_brightness < 35
        brightness_std = float(np.std(gray))
        is_uniform = brightness_std < 15
        
        log, _ = ExamLog.objects.get_or_create(student=student, exam=exam)
        
        try:
            timeline = json.loads(log.timeline_json)
        except:
            timeline = []
            
        is_verified = True
        event_name = ""
        details = ""
        num_faces = 0
        
        if is_camera_covered or (is_uniform and avg_brightness < 80):
            is_verified = False
            log.impersonation_flags += 1
            event_name = "Camera Covered"
            details = f"Camera appears to be covered or obstructed (brightness: {avg_brightness:.0f}, variation: {brightness_std:.0f})."
        else:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            min_face_side = int(min(height, width) * 0.10)
            
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.15,
                minNeighbors=10,
                minSize=(min_face_side, min_face_side),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
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
                if DeepFace and os.path.exists(ref_path):
                    try:
                        result = DeepFace.verify(
                            img1_path=img_cv2, 
                            img2_path=ref_path, 
                            model_name="Facenet512",
                            enforce_detection=False
                        )
                        is_verified = result.get("verified", False)
                        if not is_verified:
                            log.impersonation_flags += 1
                            event_name = "Face Mismatch"
                            details = "Face does not match the baseline profile."
                    except Exception:
                        is_verified = True
                else:
                    is_verified = True

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


# ─────────────────────────────────────────────────────────────────────────────
# Exam Views
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def list_exams(request):
    student_id = request.query_params.get('student_id')
    
    # Get active exams
    exams_qs = Exam.objects.filter(is_active=True).order_by('-date')
    
    # Filter by assignment if student_id provided
    if student_id:
        try:
            student = Student.objects.get(registration_number=student_id)
            student_faculty = student.faculty
            
            filtered = []
            for exam in exams_qs:
                if exam.assigned_to == 'ALL':
                    filtered.append(exam)
                elif exam.assigned_to == student_faculty:
                    filtered.append(exam)
                elif exam.assigned_to == 'SPECIFIC':
                    specific = [s.strip() for s in exam.specific_students.split(',') if s.strip()]
                    if student_id in specific:
                        filtered.append(exam)
            exams_qs = filtered
        except Student.DoesNotExist:
            pass  # If student not found, return all exams
    
    data = []
    for exam in exams_qs:
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
            "max_score": max_score_val,
            "assigned_to": exam.assigned_to
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
    assigned_to = data.get('assigned_to', 'ALL')
    specific_students = data.get('specific_students', '')
    
    exam, created = Exam.objects.update_or_create(
        exam_id=exam_id,
        defaults={
            'title': title,
            'date': timezone.now(),
            'duration_minutes': duration_minutes,
            'exam_type': exam_type,
            'questions_json': json.dumps(questions),
            'is_active': True,
            'assigned_to': assigned_to,
            'specific_students': specific_students,
        }
    )
    return Response({"success": True, "exam_id": exam.exam_id, "created": created})


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


@api_view(['GET'])
def get_exam_full(request, exam_id):
    """Return exam with correct answers — for lecturers only."""
    exam = get_object_or_404(Exam, exam_id=exam_id)
    try:
        questions = json.loads(exam.questions_json)
    except:
        questions = []

    return Response({
        "exam_id": exam.exam_id,
        "title": exam.title,
        "duration_minutes": exam.duration_minutes,
        "exam_type": exam.exam_type,
        "assigned_to": exam.assigned_to,
        "specific_students": exam.specific_students,
        "questions": questions  # includes correct_answer
    })


@api_view(['GET'])
def list_all_exams(request):
    """List all exams for the lecturer dashboard."""
    exams = Exam.objects.all().order_by('-date')
    data = []
    for exam in exams:
        try:
            q_count = len(json.loads(exam.questions_json))
        except:
            q_count = 0
        data.append({
            "exam_id": exam.exam_id,
            "title": exam.title,
            "exam_type": exam.exam_type,
            "duration_minutes": exam.duration_minutes,
            "question_count": q_count,
            "assigned_to": exam.assigned_to,
            "is_active": exam.is_active,
            "date": exam.date.strftime("%Y-%m-%d %H:%M") if exam.date else "",
        })
    return Response({"exams": data})


@api_view(['GET'])
def list_students(request):
    """List all registered students — for specific assignment picker."""
    students = Student.objects.all().order_by('full_name')
    data = [
        {
            "registration_number": s.registration_number,
            "full_name": s.full_name,
            "faculty": s.faculty,
            "email": s.email
        }
        for s in students
    ]
    return Response({"students": data})


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
                correct = q.get('correct_answer', '').strip()
                student_ans = str(answers.get(q.get('id'), '')).strip()
                print(f"[GRADE DEBUG] Q: {q.get('id')} | correct: '{correct}' | student: '{student_ans}' | match: {student_ans == correct}")
                if student_ans and correct and student_ans == correct:
                    earned_points += points
                    
            if total_points > 0:
                score = (earned_points / total_points) * 100
                if score >= 90: grade_letter = 'A'
                elif score >= 80: grade_letter = 'B'
                elif score >= 70: grade_letter = 'C'
                elif score >= 60: grade_letter = 'D'
                else: grade_letter = 'F'
                feedback = f"Automatically graded. {earned_points}/{total_points} points earned."
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
            "faculty": log.student.faculty,
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
