# VU Exam System - macOS & Linux Setup Guide

This guide covers setup for macOS and Linux systems.

## System Requirements

### macOS
- **macOS 10.14 or later** (Mojave or newer)
- **4GB RAM minimum** (8GB+ recommended)
- **3GB free disk space**

### Linux
- **Ubuntu 20.04 LTS** or equivalent
- **Debian 11+** or other modern distributions
- **4GB RAM minimum** (8GB+ recommended)
- **3GB free disk space**

## Prerequisites

### Homebrew (macOS only)

If you don't have Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Installation Steps

### 1. Install Python 3.9+

**macOS:**
```bash
brew install python@3.11
python3 --version
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
python3 --version
```

**Fedora/RHEL:**
```bash
sudo dnf install python3.11 python3.11-devel
python3 --version
```

### 2. Install Node.js & npm

**macOS:**
```bash
brew install node@22
npm --version
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs
npm --version
```

**Fedora/RHEL:**
```bash
sudo dnf install nodejs npm
npm --version
```

### 3. Install Git (if needed)

**macOS:**
```bash
brew install git
```

**Ubuntu/Debian:**
```bash
sudo apt install git
```

### 4. Clone or Extract Project

```bash
cd ~/Documents
git clone <repository-url> vu-exam-system
cd vu-exam-system
```

Or if you have a ZIP file:
```bash
unzip vu-exam-system.zip
cd vu-exam-system
```

### 5. Run Automated Setup

```bash
bash setup.sh
```

The script will:
- ✓ Verify Python and Node.js
- ✓ Create virtual environment
- ✓ Install Python dependencies
- ✓ Setup Django database
- ✓ Install Node packages

**Wait time**: 5-10 minutes

---

## Manual Setup (If Script Fails)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create configuration file
cp .env.example .env
nano .env  # Edit as needed

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test the server
python manage.py runserver
```

Backend will be at: **http://localhost:8000**

### Frontend Setup

In a **new terminal** (keep backend running):

```bash
# Navigate to frontend
cd VU

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be at: **http://localhost:3000** (or as shown by Astro)

---

## Development Workflow

### Terminal 1 - Backend API

```bash
cd backend
source venv/bin/activate
python manage.py runserver

# Available at: http://localhost:8000/api
```

### Terminal 2 - Frontend UI

```bash
cd VU
npm run dev

# Available at: http://localhost:3000
```

### Terminal 3 - Optional: Admin Access

```bash
cd backend
source venv/bin/activate
python manage.py shell

# Query data
from verification.models import Student
print(Student.objects.all())
```

---

## Useful Commands

### Python Virtual Environment

```bash
# Activate
source backend/venv/bin/activate

# Deactivate
deactivate

# Check installed packages
pip list

# Update a package
pip install --upgrade packagename
```

### Django Management

```bash
# Create superuser for admin
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Create new migration
python manage.py makemigrations

# Access Python shell
python manage.py shell

# Run tests
python manage.py test
```

### Node.js/npm

```bash
# Install packages
npm install

# Install specific version
npm install package@version

# Update packages
npm update

# Run scripts
npm run dev    # Development server
npm run build  # Build for production
npm run preview # Preview production build
```

---

## Troubleshooting

### Issue: "python3 command not found"

```bash
# Install Python via Homebrew (macOS)
brew install python@3.11

# Or via package manager (Linux)
sudo apt install python3.11
```

### Issue: Virtual environment not activating

```bash
# Ensure you're in the backend directory
cd backend

# Try long form
source ./venv/bin/activate

# Or check if venv exists
ls -la venv/

# Recreate if missing
python3 -m venv venv
source venv/bin/activate
```

### Issue: Permission denied when running setup.sh

```bash
# Make script executable
chmod +x setup.sh

# Then run it
./setup.sh
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still failing, check Node version
node --version  # Should be 22+
npm --version
```

### Issue: pip packages won't install

```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Try with verbose output
pip install -vv -r requirements.txt

# Check for missing system dependencies
# On Ubuntu/Debian:
sudo apt install build-essential python3-dev
```

### Issue: TensorFlow build errors

```bash
# Install required build tools
# macOS:
xcode-select --install

# Ubuntu/Debian:
sudo apt install build-essential python3-dev

# Try installing with specific version
pip install tensorflow-cpu==2.13.0
```

### Issue: No module named 'deepface'

```bash
# Activate venv and reinstall
source venv/bin/activate
pip install --force-reinstall deepface

# Or install dependencies step by step
pip install opencv-python-headless
pip install numpy
pip install tensorflow-cpu
pip install deepface
```

### Issue: Database locked or corrupted

```bash
cd backend

# Stop any running Django processes
# Kill the background process or press Ctrl+C

# Delete database and recreate
rm db.sqlite3
python manage.py migrate
python manage.py runserver
```

### Issue: Webcam not working in browser

1. Check camera permission:
   - **macOS**: System Preferences → Security & Privacy → Camera
   - **Linux**: Check browser permissions
   
2. Verify browser has permission:
   - Firefox: Preferences → Privacy → Permissions → Camera
   - Chrome/Brave: Settings → Privacy & Security → Site Settings → Camera

3. Ensure camera not in use:
   ```bash
   # Check what processes access camera
   lsof | grep video  # Linux
   lsof | grep camera  # macOS
   ```

4. Try different browser

---

## Linux-Specific Notes

### Using apt (Ubuntu/Debian)

```bash
# Update package lists
sudo apt update
sudo apt upgrade

# Install build tools (if needed)
sudo apt install build-essential python3-dev

# Install system dependencies for OpenCV
sudo apt install libgl1-mesa-glx libglib2.0-0
```

### Using yum/dnf (CentOS/Fedora)

```bash
# Install build tools
sudo dnf groupinstall "Development Tools"

# Install Python development
sudo dnf install python3.11-devel

# Install system dependencies
sudo dnf install mesa-libGL glib2
```

### File Permissions

If scripts aren't executable:
```bash
chmod +x setup.sh
chmod +x backend/manage.py
```

---

## macOS-Specific Notes

### M1/M2 Macs (Apple Silicon)

Some packages may need special handling:

```bash
# Install using conda if having issues
brew install conda
conda create -n venv python=3.11
conda activate venv
pip install -r requirements.txt
```

### Homebrew Path Issues

If `python3` or `node` not found after installing via Homebrew:

```bash
# Check Homebrew paths
export PATH="/usr/local/bin:$PATH"
export PATH="/opt/homebrew/bin:$PATH"

# Add to ~/.zshrc or ~/.bash_profile for persistence
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Using Virtual Environments

```bash
# Use venv (recommended)
python3 -m venv venv
source venv/bin/activate

# Or conda (alternative)
conda create -n venv python=3.11
conda activate venv
```

---

## Docker Alternative

If you prefer containerization:

```bash
# Install Docker Desktop (all platforms)
# Visit: https://www.docker.com/products/docker-desktop

# Run with Docker Compose
docker-compose up

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Performance Tips

### For Slower Systems

1. **Use minimal TensorFlow**
   ```bash
   pip install tensorflow-cpu==2.13.0  # Smaller than 2.16
   ```

2. **Reduce npm dependencies**
   ```bash
   cd VU
   npm ci  # Use lock file instead of fresh install
   ```

3. **Run single-threaded**
   ```bash
   cd backend
   python manage.py runserver 127.0.0.1:8000 --nothreading
   ```

### For Faster Systems

1. **Enable GPU if available**
   ```bash
   pip install tensorflow[and-cuda]
   ```

2. **Use uvicorn for faster async handling**
   ```bash
   pip install uvicorn
   uvicorn core.wsgi:application --reload
   ```

---

## Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/vu-exam.service`:

```ini
[Unit]
Description=VU Exam System Backend
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/home/app/vu-exam-system/backend
ExecStart=/home/app/vu-exam-system/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    core.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable vu-exam
sudo systemctl start vu-exam
sudo systemctl status vu-exam
```

### Using systemd for Frontend

Create `/etc/systemd/system/vu-exam-frontend.service`:

```ini
[Unit]
Description=VU Exam System Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/app/vu-exam-system/VU
ExecStart=/usr/bin/npm run preview
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Getting Help

1. Check system logs:
   ```bash
   # Backend logs
   tail -f backend/logs/django.log
   
   # Check system messages
   journalctl -e  # Linux
   log show --predicate 'process == "python"'  # macOS
   ```

2. Enable verbose output:
   ```bash
   python manage.py runserver --verbosity 3
   npm run dev --debug
   ```

3. Check browser console:
   - Open DevTools: `F12` or `Cmd+Option+I`
   - Check "Console" tab for JavaScript errors
   - Check "Network" tab for API calls

---

**macOS/Linux Setup Complete!**

Next steps:
1. Start the backend: `python manage.py runserver`
2. Start the frontend: `npm run dev`
3. Open http://localhost:3000 in your browser
4. Create a test student account
5. Test the exam verification system

See main [README.md](README.md) for usage instructions.
