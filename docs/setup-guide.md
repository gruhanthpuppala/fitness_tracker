# Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd fitness_tracker_app
```

### 2. Start the database

```bash
docker-compose -f docker-compose.dev.yml up postgres -d
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/development.txt

# Copy env file
cp ../.env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run dev server
python manage.py runserver
```

### 4. Frontend setup

```bash
cd frontend
npm install

# Copy env file
cp ../.env.example .env.local
# Edit .env.local (only NEXT_PUBLIC_* vars needed)

# Run dev server
npm run dev
```

### 5. Access the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Swagger docs: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Django Admin: http://localhost:8000/admin/
- pgAdmin: http://localhost:5050 (if started)

## Docker (Full Stack)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Running Tests

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## Management Commands

```bash
# Compute monthly metrics
python manage.py compute_monthly_metrics

# Cleanup expired tokens
python manage.py cleanup_expired_tokens
```
