# Implementation Plan: 002-web-app

**Feature ID:** 002-web-app
**Status:** In Progress

## Architecture
- Frontend: Next.js (port 3000) + Better Auth
- Backend: FastAPI (port 8000) + JWT verification
- Database: SQLite (dev)
- Proxy: Next.js rewrites /api/* → localhost:8000/api/*

## Authentication Flow
1. Better Auth handles registration/login
2. JWT stored in HTTP-only cookie (better-auth.session_token)
3. Browser sends cookie automatically (same-origin via proxy)
4. Backend extracts JWT from cookie
5. Backend verifies with BETTER_AUTH_SECRET
6. Backend extracts user_id from 'sub' claim
7. Backend filters todos by user_id

## Key Decisions
- Better Auth for frontend auth (JWT issuer)
- Backend JWT verification only (no password handling)
- HTTP-only cookies for transport (XSS protection)
- Next.js proxy for same-origin (solves cross-origin cookie issues)
- user_id from JWT only (prevents impersonation)

## API Routes
Backend (all authenticated):
- POST /api/todos - Create
- GET /api/todos - List
- GET /api/todos/{id} - Get
- PUT /api/todos/{id} - Update
- PATCH /api/todos/{id}/complete - Complete
- DELETE /api/todos/{id} - Delete

## Security
- JWT verification on all routes
- Ownership checks (user_id filtering)
- HTTP-only cookies (no XSS)
- Shared secret (BETTER_AUTH_SECRET)
