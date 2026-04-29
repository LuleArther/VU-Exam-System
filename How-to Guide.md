# How-to Guide

This guide helps non-technical users install and run the VU Exam System on Windows.

## What You Need

- A Windows 10 or Windows 11 computer
- Internet connection
- A webcam
- Administrator access (to install software)

## Step 1: Install Required Software

Install these tools in this order:

1. Git
- Download: https://git-scm.com/download/win
- Install with default options

2. Python 3.11
- Download: https://www.python.org/downloads/release/python-3119/
- Important: tick "Add Python to PATH" during installation

3. Node.js 20 LTS
- Download: https://nodejs.org/
- Install the LTS version

4. Visual Studio Code (optional but recommended)
- Download: https://code.visualstudio.com/

## Step 2: Download the Project from GitHub

1. Open Command Prompt (or PowerShell).
2. Choose where you want the project folder, for example:

```bat
cd %USERPROFILE%\Downloads
```

3. Clone the repository:

```bat
git clone https://github.com/LuleArther/VU-Exam-System.git
cd VU-Exam-System
```

## Step 3: Start the Backend (Django API)

1. Open a terminal in the project root.
2. Move into backend folder:

```bat
cd backend
```

3. Create virtual environment:

```bat
py -3.11 -m venv venv
```

4. Activate virtual environment:

```bat
venv\Scripts\activate
```

5. Install backend packages:

```bat
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
pip install tf-keras
```

6. Run database migrations:

```bat
python manage.py migrate
```

7. Start backend server:

```bat
python manage.py runserver 8000
```

Leave this terminal open.

Expected backend URL:
- http://localhost:8000

## Step 4: Start the Frontend (Astro)

1. Open a second terminal.
2. Move into frontend folder:

```bat
cd VU
```

3. Install frontend packages:

```bat
npm install
```

4. Build static files:

```bat
npm run build
```

5. Serve frontend:

```bat
cd dist
py -m http.server 3000
```

Leave this terminal open.

Expected frontend URL:
- http://localhost:3000

## Step 5: Use the System

1. Open browser and go to http://localhost:3000
2. Register a student account and capture baseline photo
3. Login and open dashboard
4. Choose an exam and continue
5. If your camera is dark or your image is not recognized well, open **Settings** and update your reference image with a clearer photo

Notes:
- If face match is low, the system now gives a warning and lets the student continue.
- If face is not detected for 1 minute during exam, the student gets a warning.
- If you have a low-light camera, you can still try registration, but updating the reference image later with a clearer photo is recommended.

## Common Issues and Quick Fixes

1. "Failed to fetch"
- Confirm backend is running on http://localhost:8000
- Confirm frontend is running on http://localhost:3000

2. Camera not working
- Allow camera permission in browser
- Close apps using webcam (Zoom/Teams)

3. Python not found
- Reinstall Python 3.11 and tick "Add Python to PATH"

4. Node/NPM not found
- Reinstall Node.js LTS

5. TensorFlow/retinaface errors
- Activate backend venv and run:

```bat
pip install tf-keras
```

## Updating Your Photo Later

If the image you used during registration is too dark or unclear:

1. Sign in to the portal
2. Open **Settings** from the side menu
3. Enter your password
4. Capture a new picture or upload a clearer photo
5. Click **Update Reference Image**

This replaces the old reference image so the system can recognize you more reliably.

## How to Push Your Local Changes to GitHub

Use these commands from project root:

```bat
git add .
git commit -m "Update exam warnings, verification flow, and setup guide"
git branch -M main
git remote remove origin
git remote add origin https://github.com/LuleArther/VU-Exam-System.git
git push -u origin main
```

If Git asks for authentication:
- Use your GitHub username
- Use a GitHub Personal Access Token as password (not your account password)

## Done

If both servers are running and browser opens localhost:3000, the system is installed correctly.
