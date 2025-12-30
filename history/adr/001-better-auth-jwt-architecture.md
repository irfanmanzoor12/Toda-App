# ADR-001: Better Auth + JWT Verification Architecture

**Status:** Accepted
**Date:** 2025-12-30
**Context:** Hackathon II - Phase II Web Application

## Context and Problem Statement

We need a secure authentication system for a multi-user todo web application. The system must support user registration, login, session management, and API authentication.

**Hard Requirement:** Use Better Auth (Hackathon II mandate).

## Decision

**Architecture:** Better Auth issues JWTs → Frontend sends JWT in Authorization header → Backend verifies JWT

### Flow

```
1. User submits credentials to Better Auth
2. Better Auth validates and issues JWT
3. Frontend stores JWT
4. Frontend sends: Authorization: Bearer <JWT>
5. Backend extracts JWT from Authorization header
6. Backend verifies JWT using BETTER_AUTH_SECRET
7. Backend extracts user_id from JWT payload
8. Backend filters todos by user_id
```

### JWT Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "exp": 1704067200,
  "iat": 1703980800
}
```

### Backend Verification

```python
def get_current_user_id(token: str) -> int:
    payload = decode_jwt(token, BETTER_AUTH_SECRET)
    return int(payload["sub"])
```

## Rationale

- **Stateless:** Backend has no sessions, scales horizontally
- **Simple:** Standard Authorization header pattern
- **Secure:** JWT is cryptographically signed
- **Compliant:** Follows Bearer token standard (RFC 6750)

## Consequences

### Positive
- Backend is stateless (no session store)
- Standard HTTP authentication pattern
- JWT verification is fast (no database lookup)
- Clear separation: Better Auth handles auth, backend verifies

### Negative
- Frontend must manage JWT storage
- JWT must be included in every request
- Token revocation requires expiration-based invalidation

## Security

- JWT signed with BETTER_AUTH_SECRET (shared secret)
- Backend verifies signature before trusting claims
- user_id extracted from JWT only (never from URL/body)
- All protected routes require valid JWT

## Implementation

**Backend:** Read Authorization header → Verify JWT → Extract user_id
**Frontend:** Store JWT → Add Authorization: Bearer <JWT> to all requests
**Shared:** BETTER_AUTH_SECRET in environment variables

## Compliance

- RFC 6750: OAuth 2.0 Bearer Token Usage
- RFC 7519: JSON Web Token (JWT)
- Stateless backend architecture
