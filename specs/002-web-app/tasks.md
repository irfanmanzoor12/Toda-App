# Implementation Tasks: Phase II – Better Auth + Authorization Header Pattern

**Feature**: 002-web-app
**Architecture**: ADR-001 (Better Auth + JWT via Authorization Header)
**Created**: 2025-12-30
**Status**: Ready for Approval
**Phase**: II (Web + Better Auth + Persistence)

---

## Architecture Compliance

**CRITICAL**: All tasks MUST comply with ADR-001:
- ✅ Frontend uses Better Auth for authentication
- ✅ Backend verifies JWT via Authorization header ONLY
- ✅ Backend is stateless (no session storage)
- ✅ Shared BETTER_AUTH_SECRET for JWT verification
- ❌ NO custom password hashing in backend
- ❌ NO custom JWT generation in backend
- ❌ NO cookie-based auth in backend
- ❌ NO Next.js proxy configuration

---

## Task Format

```
- [ ] [TaskID] [Priority] [Subsystem] Description with file path
```

**Priority Levels**:
- **P1**: Critical for MVP (blocking)
- **P2**: Core features
- **P3**: Polish and documentation

**Subsystem Labels**:
- **[DB]**: Database models, migrations
- **[Auth]**: Authentication (Better Auth integration)
- **[API]**: FastAPI backend
- **[UI]**: Next.js frontend
- **[Test]**: Testing
- **[Docs]**: Documentation

---

## Phase Overview

1. **Phase 1**: Backend Foundation (Database + JWT Verification) - 8 tasks
2. **Phase 2**: Frontend Foundation (Better Auth + API Client) - 7 tasks
3. **Phase 3**: Todo API Endpoints (CRUD with user isolation) - 6 tasks
4. **Phase 4**: Todo UI Components - 5 tasks
5. **Phase 5**: Integration & Testing - 5 tasks
6. **Phase 6**: Documentation - 3 tasks

**Total**: 34 tasks (streamlined via Better Auth - no custom auth implementation needed)

---

## Phase 1: Backend Foundation

**Goal**: Database models, migrations, and JWT verification for Better Auth tokens

### Database Models (SQLModel)

- [x] **T201** [P1] [DB] Create `backend/src/models/user.py` with User SQLModel (id, email, created_at) - minimal model for foreign keys only
- [x] **T202** [P1] [DB] Create `backend/src/models/todo.py` with Todo SQLModel (id, title, description, status, user_id FK, created_at, updated_at)
- [x] **T203** [P1] [DB] Create `backend/src/models/__init__.py` exporting User, Todo, TodoStatus

### Database Migrations

- [ ] **T204** [P1] [DB] Initialize Alembic: `alembic init alembic` and configure `alembic.ini` with DATABASE_URL from .env
- [ ] **T205** [P1] [DB] Configure `alembic/env.py` to import SQLModel metadata and set target_metadata
- [ ] **T206** [P1] [DB] Generate migration: `alembic revision --autogenerate -m "Initial schema"` and verify DDL
- [ ] **T207** [P1] [DB] Apply migration: `alembic upgrade head` and verify tables exist

### JWT Verification (Better Auth Integration)

- [ ] **T208** [P1] [Auth] Create `backend/src/auth/jwt.py` with `decode_access_token(token: str)` that verifies Better Auth JWT using BETTER_AUTH_SECRET and extracts user_id from 'sub' claim
- [ ] **T209** [P1] [API] Create `backend/src/api/dependencies.py` with `get_current_user_id(token: str)` dependency using OAuth2PasswordBearer to extract JWT from Authorization header and return user_id
- [ ] **T210** [P1] [API] Create `backend/src/api/main.py` with FastAPI app, CORS middleware, and health check GET /health

**Checkpoint**: Backend can verify Better Auth JWTs, database schema created

---

## Phase 2: Frontend Foundation

**Goal**: Better Auth setup, JWT extraction, and API client with Authorization header

### Better Auth Setup

- [ ] **T211** [P1] [Auth] Install Better Auth: `npm install better-auth better-auth/react better-sqlite3 --save`
- [ ] **T212** [P1] [Auth] Create `frontend/lib/auth.ts` with Better Auth configuration (emailAndPassword enabled, session config, BETTER_AUTH_SECRET from env)
- [ ] **T213** [P1] [Auth] Create `frontend/lib/auth-client.ts` exporting authClient, signIn, signUp, signOut, useSession
- [ ] **T214** [P1] [Auth] Create `frontend/app/api/auth/[...better-auth]/route.ts` for Better Auth API routes

### JWT Token Extraction & API Client

- [ ] **T215** [P1] [API] Create `frontend/app/api/auth/token/route.ts` (Next.js API route) that extracts JWT from Better Auth HTTP-only cookie and returns it to client
- [ ] **T216** [P1] [API] Create `frontend/lib/auth-token.ts` with `getJWTToken()` that calls `/api/auth/token` and `getAuthorizationHeader()` that returns `Bearer <token>`
- [ ] **T217** [P1] [API] Create `frontend/lib/api.ts` with `apiCall(endpoint, options)` that adds Authorization header from `getAuthorizationHeader()` and handles errors

**Checkpoint**: Better Auth working, JWT extraction working, API client sends Authorization header

---

## Phase 3: Todo API Endpoints

**Goal**: Backend CRUD endpoints with JWT verification and user isolation

### API Routes

- [ ] **T218** [P1] [API] Create `backend/src/api/routes/todos.py` with POST /api/todos endpoint (creates todo with user_id from JWT)
- [ ] **T219** [P1] [API] Add GET /api/todos endpoint (returns only current user's todos filtered by user_id)
- [ ] **T220** [P2] [API] Add GET /api/todos/{id} endpoint with ownership verification (todo.user_id == current_user_id)
- [ ] **T221** [P2] [API] Add PUT /api/todos/{id} endpoint with ownership verification
- [ ] **T222** [P2] [API] Add PATCH /api/todos/{id}/complete endpoint with ownership verification
- [ ] **T223** [P2] [API] Add DELETE /api/todos/{id} endpoint with ownership verification, returns 204

**Checkpoint**: All 6 todo endpoints working with authorization, user isolation enforced

---

## Phase 4: Todo UI Components

**Goal**: Frontend pages for auth and todo management

### Authentication Pages

- [ ] **T224** [P1] [UI] Create `frontend/app/register/page.tsx` with Better Auth registration form (email, password, calls signUp)
- [ ] **T225** [P1] [UI] Create `frontend/app/login/page.tsx` with Better Auth login form (email, password, calls signIn)
- [ ] **T226** [P1] [UI] Create `frontend/middleware.ts` to protect /todos routes (checks Better Auth session, redirects to /login if missing)

### Todo Pages

- [ ] **T227** [P1] [UI] Create `frontend/app/todos/page.tsx` with todo list display and "Add Todo" form (calls apiCall with Authorization header)
- [ ] **T228** [P2] [UI] Add complete/edit/delete buttons to todo items in todos page with confirmation dialogs

**Checkpoint**: Full UI working, Better Auth login/register, todos CRUD via Authorization header

---

## Phase 5: Integration & Testing

**Goal**: End-to-end validation and security verification

### Testing

- [ ] **T229** [P1] [Test] Manual test: Register user → Login → Create todo → Verify Authorization header in DevTools Network tab
- [ ] **T230** [P1] [Test] Manual test: Verify JWT structure (decode token, check 'sub' claim contains user_id)
- [ ] **T231** [P2] [Test] Manual test: Multi-user isolation (2 browsers, 2 users, verify todos separated)
- [ ] **T232** [P2] [Test] Manual test: Token expiration (wait for expiration, verify 401 error)
- [ ] **T233** [P2] [Test] Security audit: Verify BETTER_AUTH_SECRET matches in both .env files, verify no hardcoded secrets

**Checkpoint**: All authentication flows tested, authorization verified, security validated

---

## Phase 6: Documentation

**Goal**: Document architecture and deployment

### Documentation

- [ ] **T234** [P2] [Docs] Create `specs/002-web-app/IMPLEMENTATION.md` documenting Authorization header architecture and testing checklist
- [ ] **T235** [P3] [Docs] Update root README.md with Phase II setup instructions (environment variables, database migration, startup commands)
- [ ] **T236** [P3] [Docs] Create deployment guide with production considerations (HTTPS, BETTER_AUTH_SECRET generation, database setup)

**Checkpoint**: Phase II complete and documented

---

## Critical Dependencies

### Sequential (Must Follow Order)

```
Backend: T201-T203 (models) → T204-T207 (migrations) → T208-T209 (JWT verification) → T210 (FastAPI app) → T218-T223 (API routes)

Frontend: T211-T214 (Better Auth) → T215-T217 (JWT extraction + API client) → T224-T226 (auth pages) → T227-T228 (todo UI)
```

### Parallelizable

**After T210 (Backend foundation)**:
- Can parallelize: T211-T217 (entire Frontend foundation)

**After T217 (API client ready)**:
- Can parallelize: T218-T223 (Backend APIs), T224-T228 (Frontend UI)

**After T228 (UI complete)**:
- Can parallelize: T229-T236 (All testing and docs)

---

## Environment Variables Required

### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<min-32-chars-same-as-backend>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Backend `.env`
```bash
DATABASE_URL=sqlite:///./todoapp.db
BETTER_AUTH_SECRET=<min-32-chars-same-as-frontend>
CORS_ORIGINS=http://localhost:3000
```

**CRITICAL**: BETTER_AUTH_SECRET must be identical in both files.

---

## Validation Criteria

Each task is complete when:
- [ ] Implementation exists at specified file path
- [ ] Code aligns with ADR-001 (Authorization header pattern)
- [ ] No cookie-based auth in backend
- [ ] No custom password hashing or JWT generation
- [ ] Manual testing passes (for UI tasks)
- [ ] No Phase III features introduced

---

## MVP Definition

**Backend MVP** (Tasks T201-T223):
- Database models and migrations
- JWT verification for Better Auth tokens
- 6 todo CRUD endpoints with user isolation

**Frontend MVP** (Tasks T211-T228):
- Better Auth integration (login/register)
- JWT extraction via Next.js API route
- Authorization header in all API calls
- Todo list UI with CRUD operations

**Full Phase II** (All 36 tasks):
- Complete authentication + authorization
- Full todo management
- Tested and documented

---

## Ready for Implementation When

- [ ] This tasks.md approved
- [ ] ADR-001 approved
- [ ] spec.md and plan.md approved
- [ ] BETTER_AUTH_SECRET generated and added to both .env files
- [ ] No questions about architecture or scope

---

## References

- **ADR**: `history/adr/001-better-auth-jwt-architecture.md`
- **Spec**: `specs/002-web-app/spec.md`
- **Plan**: `specs/002-web-app/plan.md`
- **Data Model**: `specs/002-web-app/data-model.md`
