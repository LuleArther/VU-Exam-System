# VU Exam System - Windows Setup Guide

This guide will help you set up and run the VU Exam System on Windows 10/11.

## System Requirements

- **Windows 10** or later (64-bit)
- **Python 3.9+** (preferably 3.11 or 3.12)
- **Node.js 22+** with npm
- **4GB RAM minimum** (8GB+ recommended for DeepFace/TensorFlow)
- **3GB free disk space** (for dependencies)
- **Webcam** (required for face verification)

## Step-by-Step Setup

### 1. Install Python

1. Download Python from https://www.python.org/downloads/
2. **IMPORTANT**: During installation:
   - Check ✓ "Add Python to PATH"
   - Check ✓ "Install pip" 
   - Choose "Install for all users" (requires admin)

3. Verify installation:
   ```powershell
   python --version
   pip --version
   ```

### 2. Install Node.js

1. Download from https://nodejs.org/ (v22 LTS recommended)
2. Run the installer and follow defaults
3. Restart your computer

4. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### 3. Clone or Extract Project

```powershell
# Navigate to a suitable location
cd C:\Users\YourUsername\Documents

# If cloning from Git:
git clone <repository-url> vu-exam-system
cd vu-exam-system

# Or extract the ZIP file and navigate to it
```

### 4. Run Automated Setup

The easiest way is to use the automatic setup script:

```powershell
# Make sure you're in the project root directory
cd C:\path\to\vu-exam-system

# Run the setup script
setup.bat
```

The script will:
- ✓ Check Python and Node.js installations
- ✓ Create a Python virtual environment
- ✓ Install all Python dependencies
- ✓ Set up the Django database
- ✓ Install Node.js packages
- ✓ Create configuration files
- ✓ Apply the Vite 7 compatibility override used by the Astro frontend

**Wait time**: 5-10 minutes (TensorFlow downloads are large)

---

## Manual Setup (If Automated Setup Fails)

### Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate.bat

# Upgrade pip (important for Windows!)
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env with your configuration
notepad .env

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test the server
python manage.py runserver
```

The backend should now be running at: **http://localhost:8000**

### Frontend Setup

In a **NEW Command Prompt** (keep the backend running):

```powershell
# Navigate to frontend
cd VU

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:4321** (or shown by Astro)

If the frontend shows a blank page or 500 errors for Astro runtime assets, rerun `npm install` in [VU](VU/) so the Vite 7 override in [VU/package.json](VU/package.json) is refreshed.

---

## Common Issues & Solutions

### Issue: "python is not recognized"

**Solution:**
1. Python is not in PATH
2. Reinstall Python and check "Add Python to PATH"
3. Restart your computer after installation
4. Use `py` instead of `python`:
   ```powershell
   py --version
   py -m pip install -r requirements.txt
   ```

### Issue: "venv\Scripts\activate.bat" is not recognized

**Solution:**
```powershell
# Make sure you're in the backend directory
cd backend

# Use the correct path separator
.\venv\Scripts\Activate.ps1

# If using PowerShell and getting execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

### Issue: "npm is not recognized"

**Solution:**
1. Node.js not installed or not in PATH
2. Reinstall Node.js from https://nodejs.org/
3. Restart your computer
4. Verify with: `node --version`

### Issue: TensorFlow installation fails or is very slow

**Solution:**
TensorFlow is large (500MB+) and depends on numpy, scipy, etc.

```powershell
# Upgrade pip first
python -m pip install --upgrade pip setuptools wheel

# Try installing with a timeout
pip install --default-timeout=1000 tensorflow-cpu==2.16.1

# If still fails, install minimal version for testing:
pip install tensorflow-cpu==2.13.0  # Older but smaller

# Or skip for now and use mock mode (see below)
```

### Issue: OpenCV or DeepFace build errors

**Solution:**
These libraries need C++ build tools on Windows.

```powershell
# Install Visual C++ Build Tools:
# 1. Download from: https://visualstudio.microsoft.com/downloads/
# 2. Select "Desktop development with C++"
# 3. Run installer
# 4. Restart and retry: pip install -r requirements.txt
```

### Issue: Webcam doesn't work in browser

**Solution:**
1. Check if browser has permission:
   - Chrome: Settings → Privacy → Site settings → Camera
   - Edge: Settings → Privacy → Permissions → Camera
2. Grant permission to the frontend URL shown by Astro and `localhost:8000`
3. Make sure camera isn't in use by another app
4. Try refreshing the page: `Ctrl+Shift+R` (hard refresh)

### Issue: Database locked or "database is locked"

**Solution:**
```powershell
# Kill any running Django processes
tasklist | findstr python
taskkill /PID <PID> /F

# Delete the database and restart
cd backend
del db.sqlite3
python manage.py migrate
python manage.py runserver
```

### Issue: Module not found errors when running backend

**Solution:**
```powershell
# Make sure virtual environment is activated
# You should see (venv) in your prompt

cd backend
venv\Scripts\activate.bat  # Activate again

# Verify installation
pip list | findstr django

# Reinstall if needed
pip install --force-reinstall -r requirements.txt
```

---

## Development Workflow

### Terminal 1 - Backend API

```powershell
cd backend
venv\Scripts\activate.bat
python manage.py runserver

# Server runs on http://localhost:8000/api
```

### Terminal 2 - Frontend UI

```powershell
cd VU
npm run dev

# Astro dev server runs on http://localhost:4321
```

### Terminal 3 - Optional: Database/Admin

```powershell
cd backend
venv\Scripts\activate.bat
python manage.py shell

# Access Django admin at: http://localhost:8000/admin
# Default: username=admin, password=admin (if created)
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Backend runs: `python manage.py runserver`
- [ ] Frontend starts: `npm run dev`
- [ ] API responds: Visit `http://localhost:8000/api/`
- [ ] Register page loads: Visit the frontend URL shown by Astro, typically `http://localhost:4321/register`
- [ ] Database initialized: Check `backend/db.sqlite3` exists
- [ ] Static files served: Check CSS/JS load in browser
- [ ] Webcam permission granted in browser
- [ ] Face verification works (after registering a test student)

---

## Troubleshooting Video Errors

If face recognition doesn't work:

1. **Check webcam permission:**
   - Browser settings > Camera > Allow localhost

2. **Test in browser console** (F12 → Console):
   ```javascript
   navigator.mediaDevices.enumerateDevices()
   ```
   Should show your camera in the list

3. **Check firewall:**
   - Windows Defender Firewall > Allow app through firewall
   - Add Python and Node.js to allowed apps

4. **Test with mock data:**
   - Edit `backend/verification/views.py`
   - Set `enforce_detection=False` in DeepFace.verify() for testing

---

## Production Deployment

For production (hosting on a server):

1. Edit `backend/core/settings.py`:
   ```python
   DEBUG = False
   SECRET_KEY = "your-production-secret-key"
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
   ```

2. Use PostgreSQL instead of SQLite:
   ```powershell
   pip install psycopg2-binary
   # Configure DATABASE_URL in .env
   ```

3. Use a production server (Gunicorn is already in requirements.txt):
   ```powershell
   gunicorn core.wsgi:application --bind 0.0.0.0:8000
   ```

4. Use Docker for consistency:
   ```powershell
   docker-compose up
   ```

---

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Search for the error in this guide
3. Check backend logs: `backend/logs/` (if created)
4. Run Django shell for debugging:
   ```powershell
   python manage.py shell
   from verification.models import Student, Exam
   print(Student.objects.all())
   ```

---

## Switching to Production Setup

When ready to deploy:

1. Set `DEBUG = False` in settings.py
2. Generate a new SECRET_KEY
3. Use PostgreSQL database
4. Configure static files properly
5. Set up HTTPS/SSL
6. Use Docker for containerization

See `docker-compose.yml` for production Docker setup.

---

**Windows Setup Guide Complete!**

Proceed to the main README.md for usage instructions.
