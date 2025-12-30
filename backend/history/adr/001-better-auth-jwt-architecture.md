# ADR-001: Better Auth + JWT Verification Architecture

**Status:** Accepted
**Date:** 2025-12-30
**Context:** Hackathon II - Phase II Web Application

## Context and Problem Statement

We need a secure authentication system for a multi-user todo web application. The system must support user registration, login, session management, and API authentication while maintaining security best practices.

## Decision Drivers

- Security: Prevent unauthorized access and user impersonation
- Simplicity: Avoid reinventing authentication infrastructure
- Performance: Stateless API authentication (no database lookups per request)
- Hackathon Requirement: Must use Better Auth (mandatory constraint)
- Developer Experience: Minimal configuration and maintenance

## Considered Options

### Option 1: Better Auth + Backend JWT Verification (CHOSEN)
- Frontend: Better Auth handles registration, login, session management
- Backend: Verifies JWT tokens issued by Better Auth
- Shared: BETTER_AUTH_SECRET for JWT signing/verification
- Transport: HTTP-only cookies via same-origin proxy

### Option 2: Full Backend Authentication
- Backend handles everything (passwords, sessions, JWT generation)
- Rejected: Violates Hackathon II requirement to use Better Auth
- Rejected: More complex, duplicates Better Auth functionality

### Option 3: Better Auth Only (No Backend Auth)
- Better Auth handles everything, backend trusts all requests
- Rejected: Insecure - backend has no way to verify user identity
- Rejected: Cannot implement user-specific data filtering

### Option 4: Dual Authentication (Better Auth + Backend Passwords)
- Both systems maintain separate user databases and passwords
- Rejected: Overcomplicated, confusing UX
- Rejected: User must login twice or systems must sync

## Decision Outcome

**Chosen Option:** Better Auth + Backend JWT Verification (Option 1)

### Architecture

```
┌──────────┐
│ Browser  │
└────┬─────┘
     │
     │ 1. POST /api/auth/sign-in/email
     ▼
┌──────────────┐
│ Better Auth  │ (Frontend: localhost:3000)
│  validates   │
│  creates JWT │
│  sets cookie │
└────┬─────────┘
     │
     │ 2. Cookie: better-auth.session_token=JWT
     │ 3. GET /api/todos (proxied)
     ▼
┌──────────────┐
│  FastAPI     │ (Backend: localhost:8000)
│  reads cookie│
│  verifies JWT│
│  extracts ID │
│  filters data│
└──────────────┘
```

### Positive Consequences

✅ **Security:**
- JWTs are cryptographically signed (tamper-proof)
- HTTP-only cookies prevent XSS attacks
- Shared secret never exposed to client
- Backend verifies every request

✅ **Simplicity:**
- Better Auth handles complex auth flows (registration, login, sessions)
- Backend logic is simple (verify JWT, extract user_id, filter data)
- No password storage/hashing in backend
- No session database needed

✅ **Performance:**
- Stateless authentication (no database lookup per request)
- JWT verification is fast (cryptographic operation only)
- Backend can scale horizontally

✅ **Developer Experience:**
- Clear separation of concerns
- Easy to test (mock JWT in tests)
- Standard JWT libraries available

### Negative Consequences

⚠️ **Cross-Origin Cookie Challenge:**
- Different ports = different origins (localhost:3000 vs localhost:8000)
- Mitigation: Next.js proxy makes requests appear same-origin
- Alternative: SameSite=None + Secure (requires HTTPS)

⚠️ **JWT Claims Dependency:**
- Backend must trust Better Auth's JWT format
- Mitigation: Documented JWT structure, integration tests
- Risk: Breaking changes if Better Auth changes JWT schema

⚠️ **Shared Secret Management:**
- Same secret must be configured in both systems
- Mitigation: Environment variables, clear documentation
- Risk: Security breach if secret is leaked

⚠️ **User Database Duplication:**
- Better Auth has users table (email, password_hash)
- Backend has users table (for foreign keys)
- Mitigation: User records created on first authenticated request
- Trade-off: Slight complexity vs maintaining single source

## Implementation Details

### JWT Structure (Better Auth)
```json
{
  "sub": "123",              // user_id
  "email": "user@example.com",
  "exp": 1704067200,         // expiration
  "iat": 1703980800          // issued at
}
```

### Backend JWT Verification
```python
# dependencies.py
def get_current_user_id(request: Request) -> int:
    jwt_token = request.cookies.get("better-auth.session_token")
    payload = decode_access_token(jwt_token)  # Verifies with BETTER_AUTH_SECRET
    return payload["user_id"]  # Normalized from 'sub'
```

### Same-Origin Proxy
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*'
    }];
  }
};
```

## Security Considerations

### Threat: User Impersonation
**Mitigation:** user_id ONLY from JWT (never from URL/body parameters)
**Verification:** All backend routes use `get_current_user_id` dependency

### Threat: JWT Token Theft
**Mitigation:** HTTP-only cookies (JavaScript cannot access)
**Limitation:** Still vulnerable to CSRF (acceptable for this phase)

### Threat: Weak Shared Secret
**Mitigation:** Require minimum 32 characters in documentation
**Verification:** Environment variable validation on startup

### Threat: Expired Token Attacks
**Mitigation:** JWT verification checks expiration timestamp
**Configuration:** 24-hour expiration (configurable)

## Compliance and Standards

- ✅ OAuth 2.0 concepts (bearer tokens)
- ✅ JWT RFC 7519 standard
- ✅ OWASP secure cookie practices
- ✅ Principle of least privilege (user can only access own data)

## Alternatives Considered Later

If requirements change:
- **Phase III:** Add refresh tokens for longer sessions
- **Production:** Move to shared authentication service (e.g., Auth0)
- **Scale:** Implement token rotation for enhanced security

## References

- Better Auth Documentation: https://better-auth.com
- JWT RFC 7519: https://tools.ietf.org/html/rfc7519
- OWASP Authentication Cheat Sheet
- Hackathon II Requirements Document

## Decision Review

**Review Date:** TBD (after Phase II completion)
**Criteria:**
- No security incidents related to authentication
- Authentication flow works reliably
- Developer feedback on maintainability
- Performance metrics (JWT verification latency < 10ms)
