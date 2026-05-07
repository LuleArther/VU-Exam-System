# VU Exam System

A full-stack exam proctoring system with AI-powered facial recognition to prevent cheating during online exams.

## 🎯 Features

- **Student Registration** with ID photo capture
- **AI-Powered Face Verification** using DeepFace
- **Real-time Exam Monitoring** with continuous identity verification
- **Exam Dashboard** for instructors to view logs and alerts
- **Cross-Platform Support** (macOS, Windows, Linux)
- **Responsive Design** for desktop and tablet browsers

## 🏗️ Architecture

### Backend Stack
- **Django 5.0** + Django REST Framework
- **DeepFace** + OpenCV for facial recognition
- **TensorFlow** for machine learning
- **PostgreSQL/SQLite** for data storage
- **Gunicorn** for production serving

### Frontend Stack
- **Astro 6** for static site generation
- **React 19** for interactive components
- **TailwindCSS** for styling
- **react-webcam** for camera integration

### ML Components
- **Facenet512** model for face embedding
- **OpenCV** for image processing
- **TensorFlow/Keras** as ML runtime

## 📋 System Requirements

### Minimum
- **CPU**: 2+ cores
- **RAM**: 4GB
- **Storage**: 3GB (for dependencies)
- **OS**: Windows 10/11, macOS 10.14+, or Linux

### Recommended
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 5GB
- **GPU**: NVIDIA GPU with CUDA (optional, for faster inference)

## 🚀 Quick Start

### For Windows Users
```powershell
# 1. Download and extract the project
# 2. Open Command Prompt in project directory
# 3. Run the automated setup script:
setup.bat

# Then in TWO separate terminals:
# Terminal 1 - Backend
cd backend
venv\Scripts\activate.bat
python manage.py runserver

# Terminal 2 - Frontend
cd VU
npm run dev
```

**👉 See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed Windows instructions**

### For macOS/Linux Users
```bash
# 1. Open Terminal in project directory
# 2. Run the automated setup script:
bash setup.sh

# Then in TWO separate terminals:
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2 - Frontend
cd VU
npm run dev
```

**👉 See [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md) for detailed instructions**

## 📖 Documentation

### Setup Guides
- [Windows Setup Guide](WINDOWS_SETUP.md) - Complete Windows 10/11 guide
- [macOS/Linux Setup](SETUP_MACOS_LINUX.md) - macOS & Linux instructions
- [Docker Setup](backend/README.md#docker) - Using Docker Compose

### User Guides
- [Student Guide](docs/STUDENT_GUIDE.md) - How to register and take exams
- [Instructor Guide](docs/INSTRUCTOR_GUIDE.md) - Exam setup and monitoring
- [API Documentation](docs/API.md) - REST API endpoints

### Development
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and extending
- [Architecture](docs/ARCHITECTURE.md) - System design overview
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and fixes

### Frontend Compatibility Note

The frontend is pinned to Vite 7 in [VU/package.json](VU/package.json) to avoid Astro dev-server 500s such as `Missing field moduleType`. If that error returns, rerun `npm install` in `VU/`.

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend configuration
SECRET_KEY=your-secret-key-here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (defaults to SQLite)
# DATABASE_URL=postgresql://user:password@localhost:5432/vudb

# Frontend
FRONTEND_URL=http://localhost:4321

# DeepFace settings
DEEPFACE_MODEL=Facenet512
DEEPFACE_ENFORCE_DETECTION=True
```

### Database Setup

**Development (SQLite - default)**
```bash
cd backend
python manage.py migrate
```

**Production (PostgreSQL)**
```bash
# Update DATABASE_URL in .env
pip install psycopg2-binary
python manage.py migrate
```

## 📱 Usage

### For Students

1. **Register**
   - Go to the frontend URL shown by Astro, usually `http://localhost:4321/register`
   - Provide registration number, name, password
   - Upload/capture student ID photo
   - Click "Register"

2. **Take Exam**
   - Login with credentials
   - Select exam from dashboard
   - Pass face verification
   - Complete exam

### For Instructors

1. **Create Exam**
   - Use Django admin: `http://localhost:8000/admin`
   - Add exam with ID, title, date, duration

2. **Monitor**
   - View verification logs: `http://localhost:8000/admin/logs`
   - Check impersonation flags
   - Review student participation

## 🧪 Testing

### Test Face Verification Locally

```python
# In backend terminal with venv activated
python manage.py shell

from verification.models import Student
from deepface import DeepFace

# Query a student
student = Student.objects.get(registration_number="VU-BIT-2503-1728-DAY")

# Verify a test image against their reference
result = DeepFace.verify(
    img1_path="path/to/test/image.jpg",
    img2_path=student.reference_image_path,
    model_name="Facenet512"
)

print(result)  # Shows 'verified': True/False
```

### Run Unit Tests

```bash
cd backend
python manage.py test verification
```

## 🔒 Security Considerations

⚠️ **Development Settings**

The default configuration is for **local development only**:
- `DEBUG = True`
- `SECRET_KEY` is exposed in repo
- CORS allows all origins
- Database is local SQLite

⚠️ **For Production**, you MUST:

1. **Change SECRET_KEY**
   ```python
   # Generate a new one:
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

2. **Set DEBUG = False**
   ```python
   DEBUG = False
   ```

3. **Configure ALLOWED_HOSTS**
   ```python
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
   ```

4. **Use PostgreSQL**
   - Set proper database credentials
   - Use environment variables

5. **Enable HTTPS/SSL**
   - Use a reverse proxy (nginx, Apache)
   - Configure proper SSL certificates

6. **Secure Image Storage**
   - Store reference images in protected location
   - Implement proper access controls
   - Use cloud storage (S3, Azure Blob) if needed

7. **Run Behind Reverse Proxy**
   - Use Gunicorn + nginx/Apache
   - Enable rate limiting
   - Implement CSRF protection properly

See [SECURITY.md](docs/SECURITY.md) for detailed security hardening guide.

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up

# Backend will be at: http://localhost:8000
# Frontend will be at: http://localhost:4321

# Run migrations inside container
docker-compose exec web python manage.py migrate

# Create superuser for admin
docker-compose exec web python manage.py createsuperuser
```

## 📊 Performance Tuning

### For Large-Scale Deployments

1. **Use Redis for caching**
   ```bash
   pip install django-redis
   ```

2. **Optimize image sizes**
   - Compress registration photos
   - Use appropriate JPEG quality

3. **Horizontal scaling**
   - Run multiple Gunicorn workers
   - Use load balancer
   - Separate database

4. **GPU Acceleration** (Optional)
   ```bash
   # Install CUDA-enabled TensorFlow
   pip install tensorflow[and-cuda]
   ```

## 🐛 Troubleshooting

### Issue: "Module not found" errors
```bash
# Ensure virtual environment is activated
# On Windows:
backend\venv\Scripts\activate.bat

# On macOS/Linux:
source backend/venv/bin/activate

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### Issue: Face verification not working
1. Check webcam permission in browser
2. Verify lighting conditions
3. Ensure face is clearly visible
4. Try closing other apps using camera

### Issue: Database locked
```bash
# Delete and recreate SQLite database
cd backend
rm db.sqlite3
python manage.py migrate
```

**👉 See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more issues**

## 📝 Project Structure

```
vu-exam-system/
├── backend/                    # Django REST API
│   ├── core/                   # Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── verification/           # Exam verification app
│   │   ├── models.py          # Student, Exam, ExamLog
│   │   ├── views.py           # API endpoints
│   │   ├── urls.py
│   │   └── migrations/
│   ├── manage.py
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example           # Environment template
│
├── VU/                         # Astro + React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── exam/          # Exam interface
│   │   │   ├── auth/          # Login/Register
│   │   │   └── admin/         # Instructor dashboard
│   │   ├── pages/             # Astro pages
│   │   ├── layouts/           # Page layouts
│   │   └── styles/            # Global CSS
│   ├── package.json
│   ├── astro.config.mjs
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── docs/                       # Documentation
├── .gitattributes             # Line ending config
├── .gitignore
├── setup.sh                   # macOS/Linux setup
├── setup.bat                  # Windows setup
├── WINDOWS_SETUP.md           # Windows guide
├── SETUP_MACOS_LINUX.md       # macOS/Linux guide
└── README.md                  # This file
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Submit a pull request with description

## 📄 License

This project is proprietary software for VU. All rights reserved.

## 🆘 Support

For issues and questions:

1. Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Review [WINDOWS_SETUP.md](WINDOWS_SETUP.md) or [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)
3. Check system logs in `backend/logs/`
4. Contact system administrator

## 🚀 Next Steps

- [ ] Run `setup.bat` (Windows) or `bash setup.sh` (macOS/Linux)
- [ ] Configure `.env` file
- [ ] Start backend: `python manage.py runserver`
- [ ] Start frontend: `npm run dev`
- [ ] Create test student account
- [ ] Test face verification
- [ ] Register an exam
- [ ] Take a test exam

---

**Welcome to VU Exam System! 🎓**

For detailed platform-specific setup instructions:
- **Windows Users** → [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
- **macOS/Linux Users** → [SETUP_MACOS_LINUX.md](SETUP_MACOS_LINUX.md)
