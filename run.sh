#!/bin/bash
# ============================================================
# Fitness Tracker App — Local Development Runner
# Usage: bash run.sh
# ============================================================

set -e

ROOT_DIR="C:/Users/gruha/fitness_tracker_app"
VENV_DIR="$ROOT_DIR/venv"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PYTHON="$VENV_DIR/Scripts/python.exe"
PIP="$VENV_DIR/Scripts/pip.exe"
NODE="/c/Program Files/nodejs/node.exe"
NPM="/c/Program Files/nodejs/npm.cmd"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Fitness Tracker — Starting Up${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ----------------------------------------------------------
# 1. Backend setup
# ----------------------------------------------------------
echo -e "${YELLOW}[1/6] Installing backend dependencies...${NC}"
"$PIP" install -r "$BACKEND_DIR/requirements/base.txt" --quiet 2>&1 | tail -3

echo -e "${YELLOW}[2/6] Running database migrations...${NC}"
export DJANGO_SETTINGS_MODULE=config.settings.development
export SECRET_KEY=dev-secret-key-local-only
cd "$BACKEND_DIR"
"$PYTHON" manage.py migrate --run-syncdb 2>&1 | tail -5

echo -e "${YELLOW}[3/6] Creating superuser (skip if exists)...${NC}"
"$PYTHON" -c "
import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.development'
os.environ['SECRET_KEY'] = 'dev-secret-key-local-only'
django.setup()
from apps.users.models import User
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@admin.com', password='Admin@1234')
    print('  Superuser created: admin@admin.com / Admin@1234')
else:
    print('  Superuser already exists, skipping.')
" 2>&1

# ----------------------------------------------------------
# 2. Frontend setup
# ----------------------------------------------------------
echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"

# Create .env.local if missing
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=placeholder" >> .env.local
    echo "  Created frontend/.env.local"
fi

"$NPM" install --silent 2>&1 | tail -3

# ----------------------------------------------------------
# 3. Start both servers
# ----------------------------------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting servers...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API docs: ${GREEN}http://localhost:8000/api/docs/${NC}"
echo -e "  Admin:    ${GREEN}http://localhost:8000/admin/${NC}  (admin@admin.com / Admin@1234)"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop both servers.${NC}"
echo ""

# Start backend in background
echo -e "${YELLOW}[5/6] Starting Django backend (port 8000)...${NC}"
cd "$BACKEND_DIR"
"$PYTHON" manage.py runserver 8000 &
BACKEND_PID=$!

# Start frontend
echo -e "${YELLOW}[6/6] Starting Next.js frontend (port 3000)...${NC}"
cd "$FRONTEND_DIR"
"$NPM" run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to kill both
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both
wait
