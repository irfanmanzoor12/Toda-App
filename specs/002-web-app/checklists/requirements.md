# Phase II Requirements Validation Checklist

**Feature**: 002-web-app (Web Application with Persistent Storage)
**Created**: 2025-12-28
**Status**: Pending Implementation

## Purpose

This checklist validates that all requirements from specs/002-web-app/spec.md are implemented correctly. Each item must be verified through testing before marking complete.

## How to Use

- [ ] = Not started or not verified
- [x] = Implemented and verified through testing
- Mark an item complete ONLY after:
  1. Implementation exists
  2. Tests pass
  3. Manual verification (if applicable)
  4. Meets success criteria

---

## Constitution Compliance

- [ ] **CC-001**: Business logic remains in skills layer (TodoManager, TodoValidator)
- [ ] **CC-002**: Phase I skills are reused without modification to core logic
- [ ] **CC-003**: FastAPI backend is stateless (no in-memory session state)
- [ ] **CC-004**: All persistence uses external database (no local filesystem state)
- [ ] **CC-005**: No Phase III+ features appear (AI, agents, MCP)
- [ ] **CC-006**: Uses mandated technologies: FastAPI, SQLModel, Next.js
- [ ] **CC-007**: TodoStore abstraction maintained from Phase I

---

## Functional Requirements - Authentication & User Management

- [ ] **FR-001**: User registration endpoint accepts email and password
- [ ] **FR-002**: Passwords are hashed using bcrypt (cost factor >= 12)
- [ ] **FR-003**: Login endpoint returns JWT token on valid credentials
- [ ] **FR-004**: JWT tokens are validated on all protected endpoints
- [ ] **FR-005**: Todos are associated with authenticated user (user_id foreign key)
- [ ] **FR-006**: Users cannot access other users' todos (authorization checks)

**Verification**:
- Register new user and verify password is hashed in database
- Login with valid credentials and receive JWT token
- Login with invalid credentials and receive 401
- Access todo endpoint without token and receive 401
- Access todo endpoint with invalid token and receive 401
- Create todo as User A, attempt to access as User B, receive 403

---

## Functional Requirements - Todo Operations

- [ ] **FR-007**: Authenticated users can create todos via POST /api/todos
- [ ] **FR-008**: Todos are stored in persistent database (PostgreSQL or SQLite)
- [ ] **FR-009**: GET /api/todos returns only authenticated user's todos
- [ ] **FR-010**: Users can mark todos complete via PATCH /api/todos/{id}/complete
- [ ] **FR-011**: Users can update todo title/description via PUT /api/todos/{id}
- [ ] **FR-012**: Users can delete todos via DELETE /api/todos/{id}
- [ ] **FR-013**: TodoValidator from Phase I is reused for input validation
- [ ] **FR-014**: Validation rules match Phase I (title: 1-500 chars, description: 0-2000 chars)

**Verification**:
- Create todo via API and verify it appears in database
- Restart application and verify todo still exists (persistence)
- Create todos as User A and User B, verify each sees only their own
- Mark todo complete and verify status changes to "complete"
- Update todo title/description and verify changes persist
- Delete todo and verify it's removed from database
- Attempt to create todo with empty title, receive 400 with validation error
- Attempt to create todo with 501-char title, receive 400 with validation error

---

## Functional Requirements - REST API

- [ ] **FR-015**: FastAPI REST API accessible at /api prefix
- [ ] **FR-016**: All endpoints use JSON for requests and responses
- [ ] **FR-017**: Appropriate HTTP status codes returned (200, 201, 400, 401, 404, 500)
- [ ] **FR-018**: OpenAPI/Swagger documentation available at /docs
- [ ] **FR-019**: CORS configured to allow Next.js frontend access
- [ ] **FR-020**: Request payloads validated with clear error messages

**Verification**:
- Access API at /api/auth/login and /api/todos endpoints
- Verify all responses use JSON content-type
- Test each endpoint and verify correct status codes
- Navigate to /docs and verify interactive API documentation
- Make request from Next.js frontend and verify CORS headers allow it
- Send invalid JSON payload and receive 422 with validation details

---

## Functional Requirements - Web UI

- [ ] **FR-021**: Next.js web interface deployed and accessible
- [ ] **FR-022**: Registration page with email/password form exists
- [ ] **FR-023**: Login page with email/password form exists
- [ ] **FR-024**: Todo list page displays all user's todos
- [ ] **FR-025**: Form exists to add new todos (title and description inputs)
- [ ] **FR-026**: UI controls exist to mark complete, edit, and delete todos
- [ ] **FR-027**: Validation errors from API displayed in UI
- [ ] **FR-028**: JWT token persisted in browser for session continuity

**Verification**:
- Navigate to registration page and submit form
- Navigate to login page and authenticate
- View todo list page and verify todos display
- Use "Add Todo" form and verify new todo appears
- Click "Complete" button and verify todo marked complete
- Click "Edit" button, modify todo, verify changes save
- Click "Delete" button, verify todo removed
- Submit invalid form data and verify errors display in UI
- Close browser, reopen, verify still logged in (token persisted)

---

## Functional Requirements - Persistence & Data Integrity

- [ ] **FR-029**: SQLModel used for database ORM
- [ ] **FR-030**: Todos persisted to database immediately on create/update
- [ ] **FR-031**: Database migrations implemented for schema changes
- [ ] **FR-032**: Data integrity maintained across application restarts
- [ ] **FR-033**: Database constraints enforce data validity (foreign keys, not null)

**Verification**:
- Verify SQLModel models defined for User and Todo
- Create todo via API, query database directly, verify row exists
- Run migration command and verify schema updated
- Add todos, restart application, verify todos still exist
- Verify foreign key constraint on todo.user_id (cannot delete user with todos)
- Verify not-null constraints on required fields (title, email, password_hash)

---

## Non-Functional Requirements - Performance

- [ ] **NFR-001**: API endpoints respond within 200ms for p95 (measured under load)
- [ ] **NFR-002**: System handles 100 concurrent users without degradation
- [ ] **NFR-003**: Database queries use indexes for user_id and todo_id
- [ ] **NFR-004**: Web UI initial page load completes within 2 seconds on 3G

**Verification**:
- Load test API with 100 requests, measure p95 latency < 200ms
- Concurrent test with 100 simulated users, verify no errors
- Run EXPLAIN on queries, verify indexes used for user_id and todo.id
- Test page load on throttled connection, measure < 2s

---

## Non-Functional Requirements - Security

- [ ] **NFR-005**: HTTPS enforced in production (configuration verified)
- [ ] **NFR-006**: User inputs validated to prevent SQL injection
- [ ] **NFR-007**: Outputs escaped to prevent XSS attacks
- [ ] **NFR-008**: Rate limiting on auth endpoints (10 attempts/minute)
- [ ] **NFR-009**: Passwords and JWT tokens not logged
- [ ] **NFR-010**: Bcrypt password hashing with cost factor >= 12
- [ ] **NFR-011**: JWT tokens expire after 24 hours
- [ ] **NFR-012**: JWT signature and expiration validated on every request

**Verification**:
- Verify HTTPS redirect in production config (nginx/deployment)
- Attempt SQL injection in todo title, verify sanitized
- Attempt XSS payload in description, verify escaped in UI
- Make 11 login attempts in 1 minute, verify 11th is rate-limited
- Check logs for password/token exposure (should be redacted)
- Verify bcrypt.gensalt(rounds=12) or higher in code
- Decode JWT and verify 'exp' claim is 24 hours from issue
- Submit expired JWT, verify 401 Unauthorized

---

## Non-Functional Requirements - Reliability

- [ ] **NFR-013**: Database connection failures handled with retries
- [ ] **NFR-014**: Errors logged with sufficient detail (timestamp, user_id, endpoint, error)
- [ ] **NFR-015**: User-friendly error messages returned (no stack traces)
- [ ] **NFR-016**: Foreign key relationships validated before deletion

**Verification**:
- Simulate database disconnect, verify retries and graceful error
- Trigger error, check logs for timestamp, context, stack trace
- Trigger 500 error via API, verify response has generic message (not stack trace)
- Attempt to delete user with todos, verify foreign key prevents deletion

---

## Non-Functional Requirements - Maintainability

- [ ] **NFR-017**: TodoStore abstraction maintained (DatabaseStore implements interface)
- [ ] **NFR-018**: Business logic in skills layer (TodoManager methods unchanged)
- [ ] **NFR-019**: API routes separated from business logic (thin controllers)
- [ ] **NFR-020**: Configuration via environment variables (DB_URL, JWT_SECRET)

**Verification**:
- Verify DatabaseStore class implements TodoStore interface
- Verify TodoManager.add_todo, list_todos, etc. match Phase I signatures
- Verify FastAPI route handlers delegate to TodoManager
- Verify .env file or environment variables used (no hardcoded secrets)

---

## API Contract Validation

### Authentication Endpoints

- [ ] **API-AUTH-001**: POST /api/auth/register accepts email and password, returns 201 with user object
- [ ] **API-AUTH-002**: POST /api/auth/register returns 400 if email already registered
- [ ] **API-AUTH-003**: POST /api/auth/register returns 422 for invalid email format
- [ ] **API-AUTH-004**: POST /api/auth/login returns 200 with JWT token for valid credentials
- [ ] **API-AUTH-005**: POST /api/auth/login returns 401 for invalid credentials
- [ ] **API-AUTH-006**: GET /api/auth/me returns 200 with user object when authenticated
- [ ] **API-AUTH-007**: GET /api/auth/me returns 401 when not authenticated

### Todo Endpoints

- [ ] **API-TODO-001**: POST /api/todos creates todo and returns 201 with todo object
- [ ] **API-TODO-002**: POST /api/todos returns 400 for validation errors (empty title)
- [ ] **API-TODO-003**: POST /api/todos returns 401 without authentication
- [ ] **API-TODO-004**: GET /api/todos returns 200 with array of user's todos
- [ ] **API-TODO-005**: GET /api/todos returns empty array for new user
- [ ] **API-TODO-006**: GET /api/todos returns 401 without authentication
- [ ] **API-TODO-007**: GET /api/todos/{id} returns 200 with todo object
- [ ] **API-TODO-008**: GET /api/todos/{id} returns 404 if todo not found
- [ ] **API-TODO-009**: GET /api/todos/{id} returns 403 if todo belongs to different user
- [ ] **API-TODO-010**: PUT /api/todos/{id} updates todo and returns 200
- [ ] **API-TODO-011**: PUT /api/todos/{id} returns 404 if todo not found
- [ ] **API-TODO-012**: PUT /api/todos/{id} returns 403 if todo belongs to different user
- [ ] **API-TODO-013**: PATCH /api/todos/{id}/complete marks complete and returns 200
- [ ] **API-TODO-014**: PATCH /api/todos/{id}/complete returns 404 if todo not found
- [ ] **API-TODO-015**: PATCH /api/todos/{id}/complete returns 403 if todo belongs to different user
- [ ] **API-TODO-016**: DELETE /api/todos/{id} deletes todo and returns 204
- [ ] **API-TODO-017**: DELETE /api/todos/{id} returns 404 if todo not found
- [ ] **API-TODO-018**: DELETE /api/todos/{id} returns 403 if todo belongs to different user

**Verification**: Use curl or HTTP client to test each endpoint with various inputs and verify response codes and bodies match specification.

---

## Success Criteria Validation

### Functionality
- [ ] **SC-001**: User can register, login, and access todos within 30 seconds (timed manual test)
- [ ] **SC-002**: Authenticated user can create todo and see it within 3 seconds (timed manual test)
- [ ] **SC-003**: All Phase I todo operations available via web UI (manual verification)
- [ ] **SC-004**: All Phase I todo operations available via REST API (automated test suite)
- [ ] **SC-005**: TodoManager and TodoValidator reused without modification (code diff Phase I vs II)

### Data Persistence
- [ ] **SC-006**: Todos persist across app restarts (restart test)
- [ ] **SC-007**: User can logout, login, see todos (session persistence test)
- [ ] **SC-008**: 99.9% of operations committed to database (monitor database write success rate)

### Security
- [ ] **SC-009**: Users cannot access other users' todos (authorization test suite 100% pass)
- [ ] **SC-010**: Unauthenticated requests return 401 (security test suite 100% pass)
- [ ] **SC-011**: Invalid JWT rejected (token validation test 100% pass)
- [ ] **SC-012**: Password strength enforced (min 8 chars, alphanumeric - validation test)

### Performance
- [ ] **SC-013**: API p95 latency < 200ms (load test measurement)
- [ ] **SC-014**: UI responsive with 100+ todos (manual test with seeded data)
- [ ] **SC-015**: 100 concurrent users without errors (load test)

### Usability
- [ ] **SC-016**: Users complete workflows on first attempt 80% of time (user testing)
- [ ] **SC-017**: API errors clear to developers 90% of time (developer testing)
- [ ] **SC-018**: Validation errors display inline in UI (manual verification)

---

## Phase Boundary Enforcement

### Forbidden Phase III+ Features (MUST NOT Exist)
- [ ] **PB-001**: No AI/LLM integration code exists
- [ ] **PB-002**: No MCP server implementations exist
- [ ] **PB-003**: No agent orchestration code exists
- [ ] **PB-004**: No Kubernetes manifests exist
- [ ] **PB-005**: No Dockerfile exists
- [ ] **PB-006**: No event streaming (Kafka/Dapr) code exists
- [ ] **PB-007**: No background workers exist
- [ ] **PB-008**: No WebSocket connections exist
- [ ] **PB-009**: No real-time update mechanisms exist

### Phase I Reuse (MUST Exist Unchanged)
- [ ] **PB-010**: TodoManager methods match Phase I signatures
- [ ] **PB-011**: TodoValidator methods match Phase I signatures
- [ ] **PB-012**: Todo model matches Phase I structure (added user_id only)
- [ ] **PB-013**: TodoStatus enum matches Phase I values
- [ ] **PB-014**: TodoStore interface matches Phase I definition
- [ ] **PB-015**: Validation rules match Phase I (title: 1-500, desc: 0-2000)

**Verification**: Code review and diff comparison between Phase I and Phase II skills.

---

## Edge Case Coverage

- [ ] **EC-001**: User attempts to access another user's todo by ID (returns 403)
- [ ] **EC-002**: Concurrent updates to same todo (last write wins or optimistic locking)
- [ ] **EC-003**: JWT expires during active session (user prompted to re-login)
- [ ] **EC-004**: Database connection failure (graceful error, retry logic)
- [ ] **EC-005**: Duplicate email registration (returns 400 with clear message)
- [ ] **EC-006**: Extremely large payload (10MB description) (rejected with 413 or 400)
- [ ] **EC-007**: Special characters in input (properly escaped, no injection)
- [ ] **EC-008**: XSS payload in description (escaped in UI output)

**Verification**: Specific test cases for each edge case scenario.

---

## Pre-Implementation Checklist

Before starting implementation, verify:
- [ ] Phase I (001-in-memory-cli) is complete and tested
- [ ] Phase I skills (TodoManager, TodoValidator) are working correctly
- [ ] Database (PostgreSQL or SQLite) is available for development
- [ ] Next.js development environment is set up
- [ ] All team members have reviewed and approved this specification
- [ ] No ambiguities exist in requirements (all testable)

---

## Post-Implementation Checklist

After completing implementation, verify:
- [ ] All functional requirements (FR-001 to FR-033) are checked
- [ ] All non-functional requirements (NFR-001 to NFR-020) are checked
- [ ] All API contracts are verified
- [ ] All success criteria are met
- [ ] Phase boundary enforcement verified
- [ ] Edge cases tested
- [ ] Manual testing completed for all user stories
- [ ] Automated test suite passes 100%
- [ ] OpenAPI documentation is accurate
- [ ] README updated with Phase II instructions
- [ ] No regression in Phase I CLI functionality (if maintained)

---

## Sign-Off

**Specification Approved By**: _______________ Date: ___________
**Implementation Verified By**: _______________ Date: ___________
**Testing Completed By**: _______________ Date: ___________
**Ready for Phase III**: ☐ Yes ☐ No (if no, list blockers below)

**Blockers**:
1.
2.
3.
