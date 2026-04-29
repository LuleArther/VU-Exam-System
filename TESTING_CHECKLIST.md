# VU Exam System - Testing & Verification Checklist

Use this checklist to verify that your VU Exam System installation is working correctly.

## Pre-Flight Checks

- [ ] Python 3.9+ installed: `python --version` (Windows) or `python3 --version` (macOS/Linux)
- [ ] Node.js 22+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] Virtual environment created in `backend/venv`
- [ ] `.env` file exists in `backend/`
- [ ] Project structure looks correct (backend/, VU/, setup.sh/bat)

## Backend Setup Verification

### Python Environment
- [ ] Virtual environment activated (should see `(venv)` in terminal prompt)
- [ ] Python version correct in venv: `python --version`
- [ ] pip installed in venv: `pip --version`

### Dependencies Installation
- [ ] Django installed: `pip list | grep Django`
- [ ] deepface installed: `pip list | grep deepface`
- [ ] opencv installed: `pip list | grep opencv`
- [ ] TensorFlow installed: `pip list | grep tensorflow`

### Database
- [ ] Database file exists: `backend/db.sqlite3` (after running migrations)
- [ ] Migrations completed without errors:
  ```bash
  python manage.py migrate
  # Should show: "Operations to perform: ..."
  # Should end with: "Applying ..." messages
  ```

### Static Files
- [ ] Static files collected:
  ```bash
  python manage.py collectstatic --noinput
  # Should show success message
  ```

### Server Startup
- [ ] Backend starts without errors:
  ```bash
  python manage.py runserver
  # Should show: "Starting development server at http://127.0.0.1:8000/"
  ```
- [ ] No ModuleNotFoundError or ImportError
- [ ] Server responds on http://localhost:8000

## Backend API Testing

### Health Checks
- [ ] API root responds: `curl http://localhost:8000/api/`
- [ ] CORS headers present: Check browser console (no CORS errors)
- [ ] Admin accessible: http://localhost:8000/admin

### Core Endpoints
- [ ] POST /api/register/ - Register endpoint exists
- [ ] POST /api/login/ - Login endpoint exists
- [ ] POST /api/verify-face/ - Face verification endpoint exists
- [ ] GET /api/dashboard-logs/ - Dashboard logs endpoint exists

### Database Access
- [ ] Django shell works:
  ```bash
  python manage.py shell
  from verification.models import Student, Exam, ExamLog
  Student.objects.all()  # Should work
  exit()
  ```

## Frontend Setup Verification

### npm Dependencies
- [ ] npm packages installed: `ls VU/node_modules | head -5` (should list packages)
- [ ] No error messages during npm install
- [ ] package-lock.json exists: `ls VU/package-lock.json`

### Astro Build
- [ ] Astro dev server starts:
  ```bash
  cd VU
  npm run dev
  # Should show: "Local: http://localhost:3000" (or similar port)
  ```
- [ ] No build errors or warnings
- [ ] Server responds on http://localhost:3000 (or shown port)

### React Components
- [ ] Component files exist:
  - [ ] `VU/src/components/exam/VerificationFlow.tsx`
  - [ ] `VU/src/components/exam/WebcamMonitor.tsx`
  - [ ] `VU/src/components/auth/LoginForm.tsx`
  - [ ] `VU/src/components/auth/RegistrationForm.tsx`

### Pages Load
- [ ] Homepage loads: http://localhost:3000
- [ ] Register page loads: http://localhost:3000/register
- [ ] Dashboard page loads: http://localhost:3000/dashboard (after login)

## Integration Testing

### Registration Flow
- [ ] Registration page renders without errors
- [ ] Can fill registration form
- [ ] Webcam permission works:
  1. Allow camera in browser
  2. Should see camera feed
- [ ] Can capture image
- [ ] Form submission doesn't error
- [ ] Student appears in database:
  ```bash
  python manage.py shell
  from verification.models import Student
  Student.objects.all()
  ```

### Authentication
- [ ] Registration creates auth token
- [ ] Token stored in localStorage
- [ ] Login page works
- [ ] Can log in with registered account
- [ ] Logout clears token

### Face Verification
- [ ] Verification endpoint accepts POST requests
- [ ] Face detection works (good lighting needed)
- [ ] Returns `"verified": true/false`
- [ ] Handles missing face gracefully
- [ ] Exam log records attempts

### Dashboard
- [ ] Admin dashboard loads
- [ ] Shows exam logs
- [ ] Displays student information
- [ ] Shows verification attempts
- [ ] Shows impersonation flags

## Performance & Stability Tests

### Backend Performance
- [ ] Django startup time < 5 seconds
- [ ] API response time < 1 second (without image processing)
- [ ] Face verification completes in < 10 seconds
- [ ] Database queries don't timeout
- [ ] No memory leaks (check Task Manager/Activity Monitor)

### Frontend Performance
- [ ] Astro build time < 10 seconds
- [ ] Page load time < 3 seconds
- [ ] Webcam feed smooth (no freezing)
- [ ] Form interactions responsive

### Stability
- [ ] Backend doesn't crash after 1 hour of running
- [ ] Frontend doesn't freeze after heavy use
- [ ] Database doesn't become corrupted
- [ ] File system permissions working correctly

## Cross-Platform Verification

### Windows-Specific
- [ ] Setup.bat runs without errors
- [ ] venv activates with: `venv\Scripts\activate.bat`
- [ ] File paths use backslashes or Path objects correctly
- [ ] Temp directories created in Windows temp location
- [ ] Line endings preserved (should be CRLF for batch scripts)

### macOS/Linux-Specific
- [ ] setup.sh is executable: `ls -la setup.sh`
- [ ] venv activates with: `source venv/bin/activate`
- [ ] File permissions correct: `ls -la backend/manage.py`
- [ ] Temp directories created in `/tmp` or `$TMPDIR`

## Security Checks

### Development Settings (Should be Default)
- [ ] DEBUG = True (safe for development)
- [ ] SECRET_KEY is generated/configured
- [ ] CORS_ALLOW_ALL_ORIGINS = True (for development)
- [ ] No real credentials in code

### Configuration Files
- [ ] `.env` is in `.gitignore` ✓
- [ ] `.env.example` exists with examples ✓
- [ ] `.git` ignored: `.gitignore` includes it ✓
- [ ] `venv/` ignored: `.gitignore` includes it ✓

## Webcam & Media Tests

### Browser Permissions
- [ ] Browser requests camera permission
- [ ] User can grant/deny permission
- [ ] Webcam accessible in registration
- [ ] Webcam accessible in verification

### Image Capture
- [ ] Images can be captured to canvas
- [ ] Images convert to base64 successfully
- [ ] Base64 data isn't corrupted
- [ ] Temporary files cleaned up after verification

### File System
- [ ] Student reference images saved: `{TEMP_DIR}/students_reference/`
- [ ] Temp files created: `{TEMP_DIR}/deepface_verify/`
- [ ] Files deleted after verification
- [ ] No orphaned image files

## Error Handling

### Graceful Degradation
- [ ] Missing image handled: returns HTTP 400
- [ ] Invalid base64 handled: returns error message
- [ ] DeepFace not installed: returns HTTP 501
- [ ] Database error: returns meaningful error
- [ ] Network error: frontend shows error message

### Edge Cases
- [ ] Empty database: no crashes
- [ ] Very large images: handled correctly
- [ ] Rapid API calls: no race conditions
- [ ] Missing .env variables: uses defaults
- [ ] Corrupted student record: doesn't crash dashboard

## Final Verification Checklist

### Complete Flow Test
1. [ ] Start backend server
2. [ ] Start frontend server
3. [ ] Open http://localhost:3000 in browser
4. [ ] Click "Register"
5. [ ] Enter test credentials
6. [ ] Allow camera permission
7. [ ] Capture student ID photo
8. [ ] Submit registration
9. [ ] See success message
10. [ ] Log out
11. [ ] Log in with test account
12. [ ] See exam dashboard
13. [ ] Select exam
14. [ ] Pass face verification
15. [ ] Enter exam
16. [ ] See exam timer/content
17. [ ] Check admin dashboard for logs

### Data Persistence
- [ ] Student record persists after restart
- [ ] Exam data preserved
- [ ] Logs recorded correctly
- [ ] Images stored properly

### Documentation
- [ ] README.md is comprehensive ✓
- [ ] WINDOWS_SETUP.md exists and clear ✓
- [ ] SETUP_MACOS_LINUX.md exists and clear ✓
- [ ] .env.example explains all variables ✓
- [ ] Code comments are helpful

## Known Issues & Workarounds

### TensorFlow Large Downloads
- **Issue**: TensorFlow models are large (500MB+)
- **Solution**: Download during setup, cache for future installs
- **Alternative**: Use older version (2.13) if space is limited

### DeepFace Model Download
- **Issue**: First face verification is slow (downloads model)
- **Solution**: Pre-warm model during startup
- **Expected**: First run ~30 seconds, subsequent < 3 seconds

### Webcam in Docker
- **Issue**: Webcam doesn't work in Docker
- **Solution**: Run frontend on host machine, API in Docker
- **Alternative**: Use docker-compose with device passthrough

## Sign-Off

Once you've completed all checks, your system is ready for:
- ✓ Development and testing
- ✓ Local demos
- ✓ Production with additional hardening (see SECURITY.md)

---

## Getting Help

If any test fails:

1. **Check the specific guide:**
   - Windows: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
   - macOS/Linux: [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)

2. **Review troubleshooting:**
   - Backend logs in `backend/logs/`
   - Browser console (F12)
   - Django shell for database issues

3. **Check error messages carefully:**
   - ModuleNotFoundError: Missing dependency
   - PermissionError: File permission issue
   - ConnectionError: Database or network issue

4. **Enable verbose output:**
   ```bash
   python manage.py runserver --verbosity 3
   npm run dev --debug
   ```

---

**All tests passing? You're ready to use the VU Exam System! 🎓**
