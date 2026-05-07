#!/bin/bash
# VU Exam System - Setup Script for macOS/Linux

set -e  # Exit on error

echo "========================================="
echo "VU Exam System - Setup (macOS/Linux)"
echo "========================================="
echo ""

# Check Python version
echo "✓ Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 is required but not installed."
    echo "  Install Python from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "  Found Python $PYTHON_VERSION"

if (( $(echo "$PYTHON_VERSION < 3.9" | bc -l) )); then
    echo "✗ Python 3.9+ is required"
    exit 1
fi

# Setup Backend
echo ""
echo "========================================="
echo "Setting up Backend (Django)"
echo "========================================="

cd backend

# Create virtual environment
echo "✓ Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "✓ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "✓ Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "✓ Creating .env file from template..."
    cp .env.example .env
    echo "  ⚠ Please configure .env with your settings"
fi

# Run migrations
echo "✓ Running database migrations..."
python manage.py migrate

# Collect static files
echo "✓ Collecting static files..."
python manage.py collectstatic --noinput

# Return to root
cd ..

# Setup Frontend
echo ""
echo "========================================="
echo "Setting up Frontend (Astro/React)"
echo "========================================="

cd VU

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is required but not installed."
    echo "  Install from https://nodejs.org/ (v22.12+ recommended)"
    echo "  After installing Node.js, run: npm install"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if (( NODE_VERSION < 22 )); then
    echo "⚠ Node.js v22+ recommended (found v$(node --version))"
fi

# Install dependencies
echo "✓ Installing Node dependencies..."
npm install

echo "✓ Frontend compatibility check..."
echo "  Astro uses a Vite 7 override to avoid dev-server 500 errors."
echo "  If you update frontend dependencies, rerun npm install so the lockfile stays in sync."

# Return to root
cd ..

# Completion message
echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "To start development:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd VU"
echo "  npm run dev"
echo ""
echo "The system will be available at:"
echo "  Frontend: http://localhost:4321 (or shown by Astro)"
echo "  API: http://localhost:8000/api"
echo ""
