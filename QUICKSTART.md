# Quick Start Guide

## Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL database (Neon or local)

## Environment Setup

### 1. Backend Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -hex 32`

### 2. Frontend Environment Variables

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local` and set:
- `BETTER_AUTH_SECRET` - **Must match backend secret**
- Other variables are pre-configured for local development

## Installation

### Backend

```bash
cd backend

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Create database tables
python -c "from src.database import engine; from src.models import Todo; from sqlmodel import SQLModel; SQLModel.metadata.create_all(engine)"
```

### Frontend

```bash
cd frontend

# Dependencies already installed, but if needed:
# npm install
```

## Run Application

### Terminal 1 - Backend

```bash
cd backend
source .venv/bin/activate
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

**Backend API**: http://127.0.0.1:8000
**API Docs**: http://127.0.0.1:8000/docs

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

**Frontend App**: http://localhost:3000

## Verify

1. Open http://localhost:3000
2. Register a new account
3. Login
4. Create, edit, complete, and delete todos

## Troubleshooting

- **"No authentication token available"**: Ensure `BETTER_AUTH_SECRET` matches in both `.env` files
- **CORS errors**: Check backend CORS configuration in `src/api/main.py`
- **Database errors**: Verify `DATABASE_URL` is correct and database is accessible
- **Module not found**: Ensure you're running from the correct directory with virtual environment activated
