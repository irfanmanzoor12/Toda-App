# Project Constitution

## Mission
Secure, user-friendly full-stack todo app demonstrating auth best practices.

## Principles
1. Security First - JWT auth, data isolation, HTTP-only cookies
2. Simplicity - Use proven libraries, avoid custom auth
3. Spec-Driven - All features documented, changes tracked

## Stack
- Frontend: Next.js 14+ (App Router) + Better Auth + TypeScript
- Backend: FastAPI + SQLModel + Python 3.13+
- Database: SQLite (dev) → PostgreSQL (prod)

## Auth Constraints
- MUST use Better Auth (frontend)
- MUST verify JWT only (backend)
- MUST use BETTER_AUTH_SECRET (shared)
- MUST extract user_id from JWT
- MUST NOT accept user_id from URL/body

## Prohibited
- Plain text passwords
- user_id in URL parameters
- Custom JWT generation in backend
- localStorage for auth tokens
- Hardcoded secrets
