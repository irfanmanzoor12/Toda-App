# Implementation Plan: 002-web-app

**Feature ID:** 002-web-app
**Status:** In Progress

## Architecture

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. POST /api/auth/sign-in (Better Auth)
     ▼
┌──────────────┐
│  Better Auth │ Returns JWT
└────┬─────────┘
     │
     │ 2. Authorization: Bearer <JWT>
     ▼
┌──────────────┐
│   FastAPI    │ Verifies JWT
│   Backend    │ Extracts user_id
│  (Port 8000) │ Filters by user_id
└──────────────┘
```

## Authentication Flow

1. Better Auth handles registration/login
2. Better Auth issues JWT
3. Frontend stores JWT
4. Frontend adds header: `Authorization: Bearer <JWT>`
5. Backend reads Authorization header
6. Backend verifies JWT with BETTER_AUTH_SECRET
7. Backend extracts user_id from 'sub' claim
8. Backend filters todos by user_id

## Key Decisions

- **Auth Provider:** Better Auth (frontend)
- **Auth Method:** JWT via Authorization header
- **Backend Role:** JWT verification only (stateless)
- **Transport:** Authorization: Bearer <token>
- **User Identity:** Extracted from JWT 'sub' claim only

## API Routes

**All backend routes require Authorization header**

- POST /api/todos - Create todo
- GET /api/todos - List user's todos
- GET /api/todos/{id} - Get specific todo
- PUT /api/todos/{id} - Update todo
- PATCH /api/todos/{id}/complete - Mark complete
- DELETE /api/todos/{id} - Delete todo

## Data Models

### User (Backend)
```python
id: int (PK)
email: str
created_at: datetime
```

### Todo (Backend)
```python
id: int (PK)
title: str
description: str
status: str
user_id: int (FK)
created_at: datetime
```

## Security

- JWT verification on all routes
- user_id from JWT only (never URL/body)
- Backend is stateless (no session storage)
- Shared secret: BETTER_AUTH_SECRET

## Implementation Requirements

**Backend:**
- Extract JWT from Authorization header
- Verify using BETTER_AUTH_SECRET
- Decode and extract user_id from 'sub'
- Filter all queries by user_id

**Frontend:**
- Store JWT after Better Auth login
- Include Authorization header in all API calls
- Handle 401 errors (token expired/invalid)
