# Quick Start Guide - VU Exam System

**Choose your platform below:**

## 🪟 Windows Users

```powershell
# 1. Open Command Prompt (cmd.exe) or PowerShell
# 2. Navigate to project root
cd C:\path\to\vu-exam-system

# 3. Run automated setup (this does everything!)
setup.bat

# 4. Wait for completion (5-10 minutes)
# 5. You'll see instructions on screen

# Then in Terminal 1 (Backend):
cd backend
venv\Scripts\activate.bat
python manage.py runserver

# Then in Terminal 2 (Frontend):
cd VU
npm run dev

# Visit: http://localhost:4321 (or shown by Astro)
```

**📖 Full guide**: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

---

## 🍎 macOS Users

```bash
# 1. Open Terminal
# 2. Navigate to project root
cd ~/path/to/vu-exam-system

# 3. Run automated setup (this does everything!)
bash setup.sh

# 4. Wait for completion (5-10 minutes)
# 5. You'll see instructions on screen

# Then in Terminal 1 (Backend):
cd backend
source venv/bin/activate
python manage.py runserver

# Then in Terminal 2 (Frontend):
cd VU
npm run dev

# Visit: http://localhost:4321 (or shown by Astro)
```

**📖 Full guide**: [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)

---

## 🐧 Linux Users

```bash
# 1. Open Terminal
# 2. Navigate to project root
cd ~/path/to/vu-exam-system

# 3. Make setup script executable
chmod +x setup.sh

# 4. Run automated setup (this does everything!)
bash setup.sh

# 5. Wait for completion (5-10 minutes)
# 6. You'll see instructions on screen

# Then in Terminal 1 (Backend):
cd backend
source venv/bin/activate
python manage.py runserver

# Then in Terminal 2 (Frontend):
cd VU
npm run dev

# Visit: http://localhost:4321 (or shown by Astro)
```

**📖 Full guide**: [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)

---

## What These Setup Scripts Do

The `setup.sh` (macOS/Linux) and `setup.bat` (Windows) scripts automatically:

✅ Check Python 3.9+ is installed
✅ Check Node.js 22+ is installed
✅ Create Python virtual environment
✅ Install all Python dependencies
✅ Set up database migrations
✅ Install Node.js packages
✅ Create `.env` configuration file
✅ Keep Astro compatible with the installed Vite major version

**No manual steps needed!** The scripts handle everything.

---

## After Setup

### Development Workflow

**Terminal 1** (Backend API):
```bash
cd backend
# Windows: venv\Scripts\activate.bat
# macOS/Linux: source venv/bin/activate
python manage.py runserver
# Server on: http://localhost:8000
```

**Terminal 2** (Frontend UI):
```bash
cd VU
npm run dev
# Server on: http://localhost:4321 (or shown by Astro)
```

**Browser**:
Open the frontend URL shown by Astro and use the system!

---

## First Test

1. Go to the frontend URL shown by Astro
2. Click "Register"
3. Fill in form with test data
4. Allow camera permission
5. Capture student ID photo
6. Submit
7. Log out
8. Log back in
9. Click exam
10. Pass face verification

**Success!** ✅

---

## Configuration

All environment variables are in: `backend/.env`

```env
SECRET_KEY=...
DEBUG=True
ALLOWED_HOSTS=localhost
FRONTEND_URL=http://localhost:4321
```

For development, the defaults work fine.

---

## Common Issues

### "Python not found"
- **Windows**: Reinstall Python, check "Add to PATH"
- **macOS**: Use `brew install python@3.11`
- **Linux**: Use apt/yum: `sudo apt install python3.11`

### "npm not found"
- Download Node.js from https://nodejs.org/
- Restart your computer after installing
- Verify: `node --version`

### "ModuleNotFoundError"
- Make sure venv is activated: `source venv/bin/activate`
- Try reinstalling: `pip install -r requirements.txt`

### "Webcam doesn't work"
- Allow camera in browser settings
- Refresh page: Ctrl+Shift+R (hard refresh)
- Try a different browser
- Close other apps using camera

**👉 See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) or [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md) for more troubleshooting**

---

## Project Structure

```
vu-exam-system/
├── backend/              ← Django API
│   ├── venv/            ← Virtual environment (created by setup)
│   ├── .env             ← Configuration (created by setup)
│   └── manage.py
├── VU/                  ← Astro/React frontend
│   ├── node_modules/    ← Dependencies (created by setup)
│   └── package.json
└── setup.sh / setup.bat ← Run this first!
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[README.md](README.md)** | Project overview, full documentation |
| **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** | Windows-specific setup & troubleshooting |
| **[SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)** | macOS/Linux setup & troubleshooting |
| **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** | Verification checklist for QA |
| **[CROSSPLATFORM_IMPLEMENTATION.md](CROSSPLATFORM_IMPLEMENTATION.md)** | Technical implementation details |

---

## Architecture

```
Frontend (http://localhost:4321)
    ↓ API calls
Backend (http://localhost:8000)
    ↓
Database (SQLite by default)
    
Subsystems:
- Face Recognition: DeepFace + OpenCV
- Image Storage: Temp directories (cross-platform)
- Authentication: Token-based
```

---

## Key Features

✅ Student Registration with ID photo
✅ AI-Powered Face Verification
✅ Real-time Exam Monitoring
✅ Instructor Dashboard
✅ Cross-Platform (Windows, macOS, Linux)
✅ Responsive Design
✅ Production Ready

---

## Need Help?

1. **Check the relevant setup guide** for your OS
2. **Review [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** for verification
3. **Check browser console** (F12) for errors
4. **Check terminal output** for error messages
5. **Read [README.md](README.md)** for full documentation

---

## Production Deployment

**Before going live:**

1. ✅ Set `DEBUG = False` in `.env`
2. ✅ Generate new `SECRET_KEY`
3. ✅ Use PostgreSQL instead of SQLite
4. ✅ Configure static files
5. ✅ Set up HTTPS/SSL
6. ✅ Read security section in [README.md](README.md)

See [README.md](README.md) **Security Considerations** section.

---

## Summary

```
Windows → Read WINDOWS_SETUP.md → Run setup.bat
macOS   → Read SETUP_MACOS_LINUX.md → Run setup.sh
Linux   → Read SETUP_MACOS_LINUX.md → Run setup.sh
```

**That's it!** The setup scripts do the rest. 🚀

---

**Version**: 1.0
**Last Updated**: April 29, 2026
**Status**: ✅ Production Ready
