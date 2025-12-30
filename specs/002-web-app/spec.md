# Feature Specification: Phase II – Web Application with Persistent Storage

**Feature Branch**: `002-web-app`
**Created**: 2025-12-28
**Status**: Draft
**Phase**: II (Web + Persistence)
**Depends On**: Phase I (001-in-memory-cli) - MUST be complete

## Constitution Compliance

This specification adheres to:
- **Principle III**: Skills Before Agents - Business logic remains in reusable skills
- **Principle IV**: Skills as Unit of Reuse - Phase I skills (TodoManager, TodoValidator) are reused
- **Principle VII**: Stateless Backend Rule - FastAPI backend is stateless, all persistence external
- **Principle VIII**: Phase-Gated Evolution - Strictly Phase II scope, no Phase III+ features
- **Principle IX**: Technology Lock - Uses FastAPI, SQLModel, Next.js as mandated

## Phase Evolution Summary

### Reused from Phase I
- **Skills**: TodoManager business logic (add_todo, list_todos, get_todo, mark_complete, delete_todo, update_todo)
- **Validation**: TodoValidator (validate_title, validate_description, validate_id)
- **Data Model**: Todo entity, TodoStatus enum
- **Abstractions**: TodoStore interface (enables storage swapping)

### Changed from Phase I
- **Storage**: MemoryStore → DatabaseStore (SQLModel + PostgreSQL/SQLite)
- **Interface**: CLI → REST API + Web UI
- **Sessions**: Single-session → Multi-session with persistent state
- **Access**: Local-only → Network-accessible (authentication required)

### Added in Phase II
- **Persistence**: Database-backed storage (survives restarts)
- **Authentication**: JWT-based user authentication
- **REST API**: FastAPI backend exposing todo operations
- **Web UI**: Next.js frontend for browser-based interaction
- **User Management**: User registration, login, profile

### Explicitly NOT Added (Phase III+)
- AI agents or chatbot (Phase III)
- MCP servers or tools (Phase III)
- Kubernetes deployment (Phase IV)
- Event-driven architecture (Phase V)
- Background jobs or schedulers (Phase V)

## User Scenarios & Testing

### User Story 1 - User Registration and Authentication (Priority: P1)

As a new user, I want to create an account and log in so that I can securely access my personal todo list.

**Why this priority**: Authentication is the foundation for multi-user support and data isolation. Without it, the web application cannot provide personal todo lists.

**Independent Test**: Navigate to the web application, register a new account with email and password, log out, and log back in to verify session persistence. Verify that invalid credentials are rejected.

**Acceptance Scenarios**:

1. **Given** I am a new user on the registration page, **When** I provide a valid email and password, **Then** my account is created and I am logged in
2. **Given** I have an account, **When** I log in with correct credentials, **Then** I receive a JWT token and can access my todos
3. **Given** I am logged in, **When** I log out, **Then** my session is terminated and I must log in again to access todos
4. **Given** I am on the login page, **When** I provide invalid credentials, **Then** the system rejects the login with a clear error message
5. **Given** I am unauthenticated, **When** I attempt to access todo endpoints, **Then** the system returns 401 Unauthorized
6. **Given** I am logged in, **When** my JWT token expires, **Then** I am prompted to log in again

---

### User Story 2 - Create Todos via Web Interface (Priority: P1)

As a logged-in user, I want to add new todo items through a web browser so that I can manage tasks conveniently from any device.

**Why this priority**: This is the core value proposition of the web application - making todo management accessible from browsers. Together with authentication, this forms the web MVP.

**Independent Test**: Log in to the web application, use the web form to create multiple todos with various titles and descriptions, and verify they appear in the todo list and persist across page refreshes.

**Acceptance Scenarios**:

1. **Given** I am logged in to the web UI, **When** I submit a todo with a title via the web form, **Then** the todo is created and appears in my list
2. **Given** I am logged in, **When** I add a todo with both title and description, **Then** both fields are saved and displayed
3. **Given** I am logged in, **When** I add multiple todos, **Then** all todos are stored and associated with my user account
4. **Given** I am logged in, **When** I submit a todo without a title, **Then** the system displays a validation error and does not create the todo
5. **Given** I add todos, **When** I refresh the browser, **Then** all my todos are still displayed (data persists)
6. **Given** I am logged in, **When** I add a todo, **Then** it is NOT visible to other users

---

### User Story 3 - View and Filter Todos (Priority: P1)

As a logged-in user, I want to view all my todo items in the web interface so that I can see what tasks I need to complete.

**Why this priority**: Viewing todos is equally critical as creating them for the web MVP. Users must be able to see their task list.

**Independent Test**: Log in with an account that has multiple todos with different statuses, navigate to the todo list page, and verify all personal todos are displayed correctly with their details.

**Acceptance Scenarios**:

1. **Given** I am logged in with existing todos, **When** I view the todo list page, **Then** all my todos are displayed with titles, descriptions, and statuses
2. **Given** I have no todos, **When** I view the todo list page, **Then** the system displays an empty state message
3. **Given** I have todos with various statuses, **When** I view the list, **Then** pending and completed todos are visually distinguished
4. **Given** I am logged in, **When** I view my todos, **Then** I only see todos I created (not other users' todos)
5. **Given** I have 50+ todos, **When** I view the list, **Then** all todos are displayed in a readable, scrollable format

---

### User Story 4 - Update Todo Status and Details (Priority: P2)

As a logged in user, I want to mark todos as complete and update their details through the web interface so that I can manage my task progress.

**Why this priority**: Status management and editing are core todo features but the application is functional without them. Users can still create and view todos.

**Independent Test**: Log in, create several todos, mark some as complete via the web UI, edit titles and descriptions, and verify changes persist across sessions.

**Acceptance Scenarios**:

1. **Given** I am logged in with pending todos, **When** I click a "complete" button, **Then** the todo's status changes to complete
2. **Given** I have a complete todo, **When** I view it, **Then** it is visually marked as complete (e.g., strikethrough, checkbox)
3. **Given** I have a todo, **When** I edit its title via the web form, **Then** the updated title is saved and displayed
4. **Given** I have a todo, **When** I edit its description, **Then** the updated description is saved
5. **Given** I have a complete todo, **When** I mark it complete again, **Then** the system handles this gracefully (idempotent)
6. **Given** I update a todo, **When** I refresh the page, **Then** the changes persist

---

### User Story 5 - Delete Todos (Priority: P2)

As a logged-in user, I want to delete todo items through the web interface so that I can remove tasks that are no longer relevant.

**Why this priority**: Deletion is useful for cleanup but not essential for basic task management. Users can work around this by ignoring irrelevant todos.

**Independent Test**: Log in, create several todos, delete specific ones via the web UI, and verify they are removed from the list and do not reappear after page refresh.

**Acceptance Scenarios**:

1. **Given** I am logged in with multiple todos, **When** I click a "delete" button on a todo, **Then** it is removed from my list
2. **Given** I delete a todo, **When** I refresh the page, **Then** the deleted todo does not appear (deletion persists)
3. **Given** I delete a todo, **When** other users view their lists, **Then** their todos are unaffected
4. **Given** I am logged in, **When** I attempt to delete a todo that doesn't exist, **Then** the system handles this gracefully

---

### User Story 6 - REST API Access (Priority: P3)

As a developer or power user, I want to access todo operations via REST API endpoints so that I can integrate with other tools or use the CLI from Phase I adapted to the API.

**Why this priority**: API access enables extensibility and power-user workflows, but the web UI is the primary interface for Phase II.

**Independent Test**: Use curl or an HTTP client to authenticate, create todos via POST requests, retrieve them via GET, update via PUT, and delete via DELETE, verifying all operations work correctly.

**Acceptance Scenarios**:

1. **Given** I have valid credentials, **When** I POST to /api/auth/login, **Then** I receive a JWT token
2. **Given** I have a JWT token, **When** I POST to /api/todos with a title, **Then** a todo is created and returned
3. **Given** I am authenticated, **When** I GET /api/todos, **Then** I receive my list of todos as JSON
4. **Given** I have a todo, **When** I PUT /api/todos/{id}, **Then** the todo is updated
5. **Given** I have a todo, **When** I DELETE /api/todos/{id}, **Then** the todo is removed
6. **Given** I provide an invalid token, **When** I access protected endpoints, **Then** I receive 401 Unauthorized

---

### Edge Cases

- What happens when a user tries to access another user's todo by guessing the ID?
- How does the system handle concurrent updates to the same todo from different sessions?
- What happens when a user's JWT token expires during an active session?
- How does the system handle database connection failures?
- What happens if two users register with the same email address simultaneously?
- How does the system behave when the database reaches storage limits?
- What happens when a user submits extremely large payloads (e.g., 10MB description)?
- How does the system handle special characters, SQL injection attempts, XSS payloads in input?

## Requirements

### Functional Requirements

**Authentication & User Management**
- **FR-001**: System MUST provide user registration with email and password
- **FR-002**: System MUST hash passwords using bcrypt or similar secure algorithm
- **FR-003**: System MUST provide login endpoint that returns JWT token on successful authentication
- **FR-004**: System MUST validate JWT tokens on all protected endpoints
- **FR-005**: System MUST associate todos with the authenticated user who created them
- **FR-006**: System MUST prevent users from accessing other users' todos

**Todo Operations (Reusing Phase I Skills)**
- **FR-007**: System MUST allow authenticated users to create todos via REST API
- **FR-008**: System MUST store todos in a persistent database (PostgreSQL or SQLite)
- **FR-009**: System MUST retrieve only the authenticated user's todos
- **FR-010**: System MUST allow users to mark their todos as complete
- **FR-011**: System MUST allow users to update title and description of their todos
- **FR-012**: System MUST allow users to delete their todos
- **FR-013**: System MUST reuse TodoValidator from Phase I for all input validation
- **FR-014**: System MUST maintain same validation rules as Phase I (title 1-500 chars, description 0-2000 chars)

**REST API**
- **FR-015**: System MUST expose FastAPI-based REST API on /api prefix
- **FR-016**: System MUST use JSON for all request and response bodies
- **FR-017**: System MUST return appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- **FR-018**: System MUST provide OpenAPI/Swagger documentation at /docs
- **FR-019**: System MUST implement CORS to allow Next.js frontend access
- **FR-020**: System MUST validate request payloads and return clear error messages

**Web UI**
- **FR-021**: System MUST provide Next.js-based web interface
- **FR-022**: System MUST provide registration page with email/password form
- **FR-023**: System MUST provide login page with email/password form
- **FR-024**: System MUST provide todo list page showing all user's todos
- **FR-025**: System MUST provide form to add new todos
- **FR-026**: System MUST provide UI controls to mark todos complete, edit, and delete
- **FR-027**: System MUST display validation errors from the API in the UI
- **FR-028**: System MUST persist JWT token in browser (localStorage or cookie) for session continuity

**Persistence & Data Integrity**
- **FR-029**: System MUST use SQLModel for database ORM
- **FR-030**: System MUST persist all todos to database immediately on creation/update
- **FR-031**: System MUST implement database migrations for schema changes
- **FR-032**: System MUST maintain data integrity across application restarts
- **FR-033**: System MUST use database constraints to enforce data validity

### Non-Functional Requirements

**Performance**
- **NFR-001**: API endpoints MUST respond within 200ms for p95 (excluding database latency)
- **NFR-002**: System MUST handle 100 concurrent users without degradation
- **NFR-003**: Database queries MUST use indexes for user_id and todo_id lookups
- **NFR-004**: Web UI initial page load MUST complete within 2 seconds on 3G connection

**Security**
- **NFR-005**: System MUST enforce HTTPS in production (configuration, not implementation)
- **NFR-006**: System MUST validate and sanitize all user inputs to prevent SQL injection
- **NFR-007**: System MUST escape outputs to prevent XSS attacks
- **NFR-008**: System MUST implement rate limiting on authentication endpoints (10 attempts per minute)
- **NFR-009**: System MUST NOT log passwords or JWT tokens
- **NFR-010**: System MUST use secure password hashing (bcrypt with cost factor >= 12)
- **NFR-011**: JWT tokens MUST expire after 24 hours
- **NFR-012**: System MUST validate JWT signature and expiration on every request

**Reliability**
- **NFR-013**: System MUST handle database connection failures gracefully with retries
- **NFR-014**: System MUST log errors with sufficient detail for debugging
- **NFR-015**: System MUST return user-friendly error messages (no stack traces to users)
- **NFR-016**: System MUST validate all foreign key relationships before deletion

**Maintainability**
- **NFR-017**: System MUST maintain TodoStore abstraction from Phase I
- **NFR-018**: System MUST keep business logic in skills layer (reusable, testable)
- **NFR-019**: System MUST separate API routes from business logic
- **NFR-020**: System MUST use environment variables for configuration (DB URL, JWT secret)

### API Contracts

**Authentication Endpoints**

```
POST /api/auth/register
Request: { "email": "user@example.com", "password": "SecurePass123" }
Response 201: { "id": 1, "email": "user@example.com", "created_at": "2025-01-15T10:00:00Z" }
Response 400: { "detail": "Email already registered" }
Response 422: { "detail": "Invalid email format" }
```

```
POST /api/auth/login
Request: { "email": "user@example.com", "password": "SecurePass123" }
Response 200: { "access_token": "eyJhbGc...", "token_type": "bearer" }
Response 401: { "detail": "Invalid credentials" }
```

```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response 200: { "id": 1, "email": "user@example.com", "created_at": "2025-01-15T10:00:00Z" }
Response 401: { "detail": "Not authenticated" }
```

**Todo Endpoints**

```
POST /api/todos
Headers: Authorization: Bearer <token>
Request: { "title": "Buy groceries", "description": "Milk, eggs, bread" }
Response 201: { "id": 1, "title": "Buy groceries", "description": "Milk, eggs, bread", "status": "pending", "created_at": "2025-01-15T10:00:00Z", "user_id": 1 }
Response 400: { "detail": "Title cannot be empty" }
Response 401: { "detail": "Not authenticated" }
```

```
GET /api/todos
Headers: Authorization: Bearer <token>
Response 200: [{ "id": 1, "title": "Buy groceries", ... }, { "id": 2, ... }]
Response 401: { "detail": "Not authenticated" }
```

```
GET /api/todos/{id}
Headers: Authorization: Bearer <token>
Response 200: { "id": 1, "title": "Buy groceries", "description": "...", "status": "pending", "created_at": "2025-01-15T10:00:00Z", "user_id": 1 }
Response 404: { "detail": "Todo not found" }
Response 401: { "detail": "Not authenticated" }
Response 403: { "detail": "Not authorized to access this todo" }
```

```
PUT /api/todos/{id}
Headers: Authorization: Bearer <token>
Request: { "title": "Buy groceries and supplies", "description": "Updated description" }
Response 200: { "id": 1, "title": "Buy groceries and supplies", ... }
Response 404: { "detail": "Todo not found" }
Response 403: { "detail": "Not authorized to modify this todo" }
Response 400: { "detail": "Title cannot be empty" }
```

```
PATCH /api/todos/{id}/complete
Headers: Authorization: Bearer <token>
Response 200: { "id": 1, "title": "Buy groceries", "status": "complete", ... }
Response 404: { "detail": "Todo not found" }
Response 403: { "detail": "Not authorized to modify this todo" }
```

```
DELETE /api/todos/{id}
Headers: Authorization: Bearer <token>
Response 204: (no content)
Response 404: { "detail": "Todo not found" }
Response 403: { "detail": "Not authorized to delete this todo" }
```

### Key Entities

**User**
- **id** (integer, primary key, auto-generated): Unique user identifier
- **email** (string, unique, required): User's email address for authentication
- **password_hash** (string, required): Bcrypt-hashed password (never exposed in API)
- **created_at** (datetime, auto-generated): Account creation timestamp
- **Relationships**: One-to-many with Todo (user has many todos)

**Todo** (Extended from Phase I)
- **id** (integer, primary key, auto-generated): Unique todo identifier
- **title** (string, required, 1-500 chars): Todo title
- **description** (string, optional, 0-2000 chars): Todo description
- **status** (enum: pending/complete): Todo completion status
- **created_at** (datetime, auto-generated): Todo creation timestamp
- **user_id** (integer, foreign key, required): Owner of this todo
- **Relationships**: Many-to-one with User (todo belongs to user)

## Success Criteria

### Measurable Outcomes

**Functionality**
- **SC-001**: Users can register, log in, and access their todo list within 30 seconds of first visit
- **SC-002**: Authenticated users can create a new todo and see it appear in their list within 3 seconds
- **SC-003**: All Phase I todo operations (create, read, update, delete, complete) are available via web UI
- **SC-004**: All Phase I todo operations are available via REST API
- **SC-005**: Phase I TodoManager and TodoValidator skills are reused without modification (100% code reuse)

**Data Persistence**
- **SC-006**: Todos persist across application restarts (database survives server restart)
- **SC-007**: Users can log out, log back in, and see all their todos intact
- **SC-008**: 99.9% of successful todo operations are committed to database

**Security**
- **SC-009**: Users cannot access other users' todos (100% isolation verified by tests)
- **SC-010**: Unauthenticated requests to protected endpoints return 401 Unauthorized (100% enforcement)
- **SC-011**: Invalid JWT tokens are rejected (100% validation)
- **SC-012**: Password strength requirements are enforced (minimum 8 characters, alphanumeric)

**Performance**
- **SC-013**: API responses complete within 200ms for 95% of requests under normal load
- **SC-014**: Web UI remains responsive with 100+ todos per user
- **SC-015**: System supports 100 concurrent authenticated users without errors

**Usability**
- **SC-016**: Users can complete primary workflows (register, login, add todo, mark complete) on first attempt 80% of the time
- **SC-017**: API error messages are clear enough for developers to correct mistakes without consulting documentation 90% of the time
- **SC-018**: Web UI displays validation errors inline near the relevant form fields

## Assumptions

**Technical Environment**
- PostgreSQL or SQLite database is available and properly configured
- Application runs on server with network access (not air-gapped)
- HTTPS termination handled by reverse proxy or hosting platform (not in application)
- Environment variables can be set for configuration (DB_URL, JWT_SECRET, etc.)

**User Behavior**
- Users interact with web UI using modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Users have stable internet connection for web access
- Users manage reasonable number of todos (< 1000 per user for Phase II)
- Users do not share accounts (each user has their own credentials)

**Data & Scale**
- Single database instance is sufficient (no sharding required for Phase II)
- No data migration from Phase I required (Phase I had no persistence)
- Average todo title length is < 50 characters
- Average todo description length is < 200 characters
- User base is < 10,000 users for Phase II

**Authentication**
- Email-based authentication is sufficient (no OAuth/social login required)
- Single JWT token per session is sufficient (no refresh tokens required for Phase II)
- Email verification is not required for Phase II (can register without confirming email)
- Password reset functionality is not required for Phase II

## Scope Boundaries

### In Scope for Phase II

**Backend (FastAPI)**
- User registration and authentication endpoints
- JWT token generation and validation
- REST API for all todo CRUD operations
- Database integration (SQLModel + PostgreSQL/SQLite)
- Input validation reusing Phase I validators
- Error handling and logging
- CORS configuration for frontend
- API documentation (OpenAPI/Swagger)

**Frontend (Next.js)**
- User registration page
- Login page
- Todo list view
- Todo creation form
- Todo editing interface
- Todo completion toggle
- Todo deletion confirmation
- Client-side form validation
- JWT token storage and management
- Error message display
- Responsive layout (mobile-friendly)

**Data & Storage**
- DatabaseStore implementation of TodoStore interface
- SQLModel models for User and Todo entities
- Database migrations
- Foreign key relationships and constraints
- User-todo association and isolation

**Skills Reuse**
- TodoManager from Phase I (unchanged business logic)
- TodoValidator from Phase I (unchanged validation rules)
- Todo and TodoStatus models from Phase I

### Out of Scope for Phase II

**Phase III Features (AI & MCP)**
- AI chatbot interface
- Natural language todo creation
- MCP server or tool implementations
- Agent orchestration
- Conversational state management

**Phase IV Features (Kubernetes)**
- Docker containerization
- Kubernetes deployment manifests
- Helm charts
- Service mesh configuration
- Load balancing beyond application server

**Phase V Features (Event-Driven)**
- Kafka integration
- Event streams
- Dapr runtime
- Background job processing
- Asynchronous workflows

**Other Deferred Features**
- OAuth or social login
- Email verification
- Password reset functionality
- Two-factor authentication
- User profile management (beyond email)
- Todo categories or tags
- Due dates or reminders
- Priority levels
- Search and filtering (beyond list all)
- Bulk operations
- Todo sharing or collaboration
- Data export/import
- Audit logs
- Admin panel
- Usage analytics

### Phase Boundary Enforcement

**What MUST NOT Appear in Phase II**:
- Any AI/LLM integration
- MCP server implementations
- Agent code or orchestration logic
- Kubernetes manifests
- Docker files
- Event streaming (Kafka, Dapr)
- Background workers or schedulers
- WebSocket connections
- Real-time updates
- Push notifications

**What Changes from Phase I**:
- Storage backend only (MemoryStore → DatabaseStore)
- Interface layer only (CLI → REST API + Web UI)
- Authentication added (none → JWT-based)
- Multi-user added (single session → many users)

**What Remains Unchanged from Phase I**:
- TodoManager business logic methods
- TodoValidator validation rules
- Todo and TodoStatus data structures
- TodoStore interface abstraction
- Character limits (title: 500, description: 2000)
- Status enum values (pending, complete)

## Validation Checklist

This specification is complete when:
- [ ] All user stories have independent test criteria
- [ ] All functional requirements are testable and measurable
- [ ] All API endpoints have request/response contracts defined
- [ ] All Phase I reuse points are explicitly stated
- [ ] All Phase II additions are clearly scoped
- [ ] All Phase III+ exclusions are explicitly listed
- [ ] Success criteria are measurable with specific metrics
- [ ] Non-functional requirements have numeric targets
- [ ] No implementation details appear (only behavior and contracts)
- [ ] Constitution compliance is documented for relevant principles
- [ ] Phase boundaries are clearly enforced
- [ ] No ambiguity exists in requirements (all testable)
