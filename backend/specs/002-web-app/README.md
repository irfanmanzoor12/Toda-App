# 002-web-app: Full-Stack Todo Web Application

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13+
- uv (Python package manager)

### Setup

**Backend:**
```bash
cd backend
uv pip install -r requirements.txt
alembic upgrade head
uv run uvicorn src.api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Project Structure

```
todoapp/
├── specs/002-web-app/          # Specifications
│   ├── spec.md                 # Requirements
│   ├── plan.md                 # Architecture
│   └── tasks.md                # Task list
├── history/
│   ├── adr/                    # Architecture decisions
│   └── prompts/002-web-app/    # Development history
├── frontend/                   # Next.js application
└── backend/                    # FastAPI application
```

## Key Files

**Configuration:**
- `frontend/.env.local` - Frontend environment variables
- `backend/.env` - Backend environment variables
- `frontend/next.config.js` - Next.js proxy configuration

**Authentication:**
- `frontend/lib/auth.ts` - Better Auth setup
- `frontend/lib/auth-client.ts` - Better Auth client
- `backend/src/api/dependencies.py` - JWT verification
- `backend/src/auth/jwt.py` - JWT decode logic

**API Routes:**
- `backend/src/api/routes/todos.py` - Todo CRUD endpoints
- `backend/src/api/routes/auth.py` - Auth endpoints (deprecated)

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Backend (.env)
```bash
DATABASE_URL=sqlite:///./todoapp.db
BETTER_AUTH_SECRET=your-secret-here-min-32-chars
CORS_ORIGINS=http://localhost:3000
```

**IMPORTANT:** BETTER_AUTH_SECRET must be identical in both files.

## Testing

### Manual Testing Checklist
1. Register new user
2. Login with credentials
3. Create todo
4. View todos list
5. Mark todo complete
6. Edit todo
7. Delete todo
8. Logout and verify redirect

### Verification Commands
```bash
# Check backend health
curl http://localhost:8000/health

# Test authentication (after login)
curl -b cookies.txt http://localhost:3000/api/todos
```

## Troubleshooting

**Issue:** "Session expired" after login
**Fix:** Ensure Next.js proxy is configured in next.config.js

**Issue:** 401 Unauthorized on /api/todos
**Fix:** Verify BETTER_AUTH_SECRET matches in both .env files

**Issue:** CORS errors
**Fix:** Proxy should eliminate CORS (requests appear same-origin)

**Issue:** Name field validation error
**Fix:** Ensure Better Auth user config has name field as optional

## Documentation

- **Spec:** See `specs/002-web-app/spec.md`
- **Architecture:** See `specs/002-web-app/plan.md`
- **Auth Decision:** See `history/adr/001-better-auth-jwt-architecture.md`
- **Tasks:** See `specs/002-web-app/tasks.md`
