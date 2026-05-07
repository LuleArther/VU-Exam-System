#!/bin/bash
set -e

echo "============================================"
echo "  VU Exam System - Deployment Script"
echo "  Target: Ubuntu 24.04 LTS (DigitalOcean)"
echo "============================================"
echo ""

# -----------------------------------------------
# 1. SWAP SPACE (critical for TensorFlow/DeepFace)
# -----------------------------------------------
echo "[1/6] Setting up 4GB swap space..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  ✅ Swap created and enabled"
else
    echo "  ⏭️  Swap already exists, skipping"
fi

# -----------------------------------------------
# 2. SYSTEM UPDATES & FIREWALL
# -----------------------------------------------
echo ""
echo "[2/6] Updating system & configuring firewall..."
apt-get update -y && apt-get upgrade -y -q

# UFW firewall
ufw allow OpenSSH
ufw allow 8000/tcp    # Django/Gunicorn
ufw allow 80/tcp      # HTTP (for future nginx/reverse proxy)
ufw allow 443/tcp     # HTTPS (for future SSL)
echo "y" | ufw enable
echo "  ✅ Firewall configured (SSH, 8000, 80, 443 open)"

# -----------------------------------------------
# 3. INSTALL DOCKER & DOCKER COMPOSE
# -----------------------------------------------
echo ""
echo "[3/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Install Docker using official convenience script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Enable Docker to start on boot
    systemctl enable docker
    systemctl start docker
    echo "  ✅ Docker installed"
else
    echo "  ⏭️  Docker already installed"
fi

# Docker Compose plugin (comes with Docker now, but verify)
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi
echo "  ✅ Docker Compose available: $(docker compose version --short)"

# -----------------------------------------------
# 4. CLONE REPOSITORY
# -----------------------------------------------
echo ""
echo "[4/6] Setting up project..."
PROJECT_DIR="/opt/vu-exam-system"

if [ -d "$PROJECT_DIR" ]; then
    echo "  ⏭️  Project directory exists, pulling latest..."
    cd "$PROJECT_DIR"
    git pull origin main || git pull origin master || true
else
    echo "  Enter your GitHub repo URL (e.g. https://github.com/user/vu-exam-system.git):"
    read -r REPO_URL
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# -----------------------------------------------
# 5. ENVIRONMENT CONFIGURATION
# -----------------------------------------------
echo ""
echo "[5/6] Configuring environment..."
ENV_FILE="$PROJECT_DIR/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    # Generate a random Django secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")

    cat > "$ENV_FILE" << EOF
# Django Settings
DEBUG=False
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=167.99.7.208,localhost,127.0.0.1

# Database (matches docker-compose.yml)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=vudb
DB_USER=vuser
DB_PASSWORD=vpassword
DB_HOST=db
DB_PORT=5432
EOF
    echo "  ✅ .env file created at $ENV_FILE"
    echo "  ⚠️  Review and edit if needed: nano $ENV_FILE"
else
    echo "  ⏭️  .env already exists"
fi

# -----------------------------------------------
# 6. BUILD & LAUNCH CONTAINERS
# -----------------------------------------------
echo ""
echo "[6/6] Building and starting containers..."
cd "$PROJECT_DIR/backend"

# Build (this will take a while - TensorFlow + DeepFace models)
docker compose build --no-cache

# Start in detached mode
docker compose up -d

# Wait for DB to be ready, then run migrations
echo ""
echo "  Waiting for PostgreSQL to be ready..."
sleep 10

docker compose exec web python manage.py migrate --noinput
echo "  ✅ Database migrations applied"

echo ""
echo "============================================"
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "  API is live at: http://167.99.7.208:8000"
echo ""
echo "  Useful commands:"
echo "    cd /opt/vu-exam-system/backend"
echo "    docker compose logs -f          # View logs"
echo "    docker compose restart          # Restart services"  
echo "    docker compose down             # Stop everything"
echo "    docker compose up -d --build    # Rebuild & restart"
echo ""
echo "  Monitor resources:"
echo "    htop                            # CPU & RAM usage"
echo "    free -h                         # Memory + swap"
echo "    docker stats                    # Container resources"
echo ""
