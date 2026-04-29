@echo off
REM VU Exam System - Setup Script for Windows
REM Run this script from the project root directory

setlocal enabledelayedexpansion
color 0A

echo =========================================
echo VU Exam System - Setup (Windows)
echo =========================================
echo.

REM Check Python
echo. & echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Python is not installed or not in PATH
    echo    Install Python from https://www.python.org/downloads
    echo    Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Found Python %PYTHON_VERSION%

REM Setup Backend
echo.
echo =========================================
echo Setting up Backend (Django)
echo =========================================
echo.

cd backend
if %errorlevel% neq 0 (
    echo [X] Could not enter backend directory
    pause
    exit /b 1
)

REM Create virtual environment
echo [*] Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo [X] Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [X] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Upgrade pip
echo [*] Upgrading pip...
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo [X] Failed to upgrade pip
    pause
    exit /b 1
)

REM Install dependencies
echo [*] Installing Python dependencies...
echo     This may take a few minutes...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [X] Failed to install dependencies
    echo     Some dependencies may require additional setup:
    echo     - TensorFlow: Ensure you have enough disk space (2-3 GB)
    echo     - OpenCV: Requires Visual C++ Build Tools on Windows
    echo.
    echo     See WINDOWS_SETUP.md for troubleshooting
    pause
    exit /b 1
)

REM Create .env file
if not exist .env (
    echo [*] Creating .env file from template...
    copy .env.example .env
    echo     [!] Please configure .env with your settings
) else (
    echo [OK] .env file already exists
)

REM Run migrations
echo [*] Running database migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo [X] Failed to run migrations
    pause
    exit /b 1
)

REM Collect static files
echo [*] Collecting static files...
python manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo [X] Failed to collect static files
    pause
    exit /b 1
)

REM Return to root
cd ..

REM Setup Frontend
echo.
echo =========================================
echo Setting up Frontend (Astro/React)
echo =========================================
echo.

cd VU
if %errorlevel% neq 0 (
    echo [X] Could not enter VU directory
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js is required but not installed
    echo    Install from https://nodejs.org/ (v22+ recommended)
    echo.
    echo    After installing Node.js:
    echo    1. Close this window
    echo    2. Open a new Command Prompt
    echo    3. Run setup.bat again
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Found Node.js %NODE_VERSION%

REM Install dependencies
echo [*] Installing Node.js dependencies...
echo     This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo [X] Failed to install Node dependencies
    pause
    exit /b 1
)

REM Return to root
cd ..

REM Completion message
echo.
echo =========================================
echo [OK] Setup Complete!
echo =========================================
echo.
echo To start development:
echo.
echo Backend (Command Prompt 1):
echo   cd backend
echo   venv\Scripts\activate.bat
echo   python manage.py runserver
echo.
echo Frontend (Command Prompt 2):
echo   cd VU
echo   npm run dev
echo.
echo The system will be available at:
echo   Frontend: http://localhost:3000 (or shown by Astro)
echo   API: http://localhost:8000/api
echo.
pause
