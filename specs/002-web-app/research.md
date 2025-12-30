# Research & Technical Decisions: Phase II Web Application

**Feature**: 002-web-app
**Created**: 2025-12-28
**Status**: Draft

---

## Purpose

This document captures research findings and technical decisions for Phase II implementation. Each decision includes options considered, evaluation criteria, and rationale for the chosen approach.

---

## Decision 1: Database Choice (PostgreSQL vs SQLite)

### Options Considered

**Option A: PostgreSQL Only**
- ✅ Production-grade, ACID-compliant
- ✅ Full-featured (JSON types, full-text search, etc.)
- ✅ Horizontal scalability ready
- ❌ Requires separate server process
- ❌ More complex local development setup
- ❌ Overkill for development/testing

**Option B: SQLite Only**
- ✅ Zero configuration (file-based)
- ✅ Perfect for development and testing
- ✅ Single file, easy to reset
- ❌ Limited concurrency (write locks)
- ❌ Not recommended for production web apps
- ❌ No user management/permissions

**Option C: SQLite (dev) + PostgreSQL (prod)** ✅ SELECTED
- ✅ Best of both worlds
- ✅ Fast local development (SQLite)
- ✅ Production-ready (PostgreSQL)
- ✅ SQLModel abstracts differences
- ❌ Need to test on both databases
- ❌ Slight config complexity (DB_URL switching)

### Decision

**Selected**: Option C - SQLite for development, PostgreSQL for production

**Rationale**:
- Fastest developer experience (SQLite: no setup)
- Production-ready without compromise (PostgreSQL)
- SQLModel/SQLAlchemy handles dialect differences
- Connection string switching via environment variable
- Aligns with Phase IV scalability (PostgreSQL ready)

**Implementation**:
```python
# Environment variable determines database
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./todoapp.db")

# SQLModel handles both dialects
engine = create_engine(DB_URL)
```

**Testing Strategy**:
- Unit/integration tests: SQLite in-memory (`sqlite:///:memory:`)
- Local development: SQLite file (`sqlite:///./todoapp.db`)
- Staging/Production: PostgreSQL (`postgresql://...`)

---

## Decision 2: ORM Choice (SQLModel vs SQLAlchemy vs Pydantic+Raw SQL)

### Options Considered

**Option A: SQLAlchemy Core (Raw SQL)**
- ✅ Maximum control and performance
- ✅ No abstraction overhead
- ❌ Verbose, manual query construction
- ❌ No automatic validation
- ❌ More boilerplate code
- ❌ Doesn't align with constitution (SQLModel mandated)

**Option B: SQLAlchemy ORM**
- ✅ Mature, battle-tested ORM
- ✅ Rich feature set (relationships, lazy loading)
- ✅ Excellent documentation
- ❌ Separate models from Pydantic schemas (duplication)
- ❌ More complex than needed for Phase II

**Option C: SQLModel** ✅ SELECTED (Constitution Mandated)
- ✅ Combines SQLAlchemy + Pydantic
- ✅ Single model definition (DRY principle)
- ✅ Automatic validation and serialization
- ✅ Mandated by constitution (Principle IX)
- ✅ Perfect for FastAPI integration
- ❌ Newer, smaller community (but backed by FastAPI author)

### Decision

**Selected**: Option C - SQLModel

**Rationale**:
- Constitution Principle IX mandates SQLModel
- Eliminates duplication (ORM model ≠ API schema)
- Type safety with Python 3.13+ type hints
- Seamless FastAPI integration (same author)
- Simpler than SQLAlchemy for CRUD operations
- Sufficient for Phase II complexity

**Example**:
```python
# Single model for ORM + API schema
class Todo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=500)
    description: str = Field(default="", max_length=2000)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="users.id")

# Automatically works as Pydantic model for FastAPI
@app.post("/api/todos", response_model=Todo)
async def create_todo(todo: Todo, db: Session = Depends(get_db)):
    # todo is already validated
    db.add(todo)
    db.commit()
    return todo
```

---

## Decision 3: Database Migration Tool (Alembic vs custom scripts)

### Options Considered

**Option A: Custom SQL Scripts**
- ✅ Simple, full control
- ✅ No dependencies
- ❌ Manual versioning
- ❌ No auto-generation
- ❌ Error-prone rollbacks

**Option B: Alembic** ✅ SELECTED
- ✅ Industry standard for SQLAlchemy/SQLModel
- ✅ Auto-generates migrations from models
- ✅ Version control built-in
- ✅ Rollback support
- ✅ Works with both SQLite and PostgreSQL
- ❌ Slight learning curve

### Decision

**Selected**: Option B - Alembic

**Rationale**:
- De facto standard for SQLAlchemy-based projects
- Auto-generation saves time: `alembic revision --autogenerate`
- Version control prevents migration conflicts
- Rollback capability (`alembic downgrade -1`)
- Production-ready (used by major projects)

**Migration Workflow**:
```bash
# 1. Modify SQLModel models in code
# 2. Generate migration
alembic revision --autogenerate -m "Add user_id to todos"

# 3. Review generated migration (always review!)
# 4. Apply migration
alembic upgrade head

# 5. Rollback if needed
alembic downgrade -1
```

---

## Decision 4: Authentication Strategy (JWT vs Session Cookies)

### Options Considered

**Option A: Session Cookies (Server-Side Sessions)**
- ✅ Proven, traditional approach
- ✅ Server controls session invalidation
- ❌ Requires session store (Redis, database)
- ❌ Breaks stateless backend requirement (Principle VII)
- ❌ Complicates horizontal scaling

**Option B: JWT Tokens (Stateless)** ✅ SELECTED
- ✅ Stateless (aligns with Principle VII)
- ✅ Horizontally scalable (no session store)
- ✅ Client stores token (localStorage/cookie)
- ✅ Standard approach for REST APIs
- ❌ Cannot revoke tokens before expiration
- ❌ Token size larger than session ID

**Option C: JWT + Refresh Tokens**
- ✅ Best of both (short JWT + long refresh)
- ✅ Can revoke refresh tokens
- ❌ More complexity (two token types)
- ❌ Overkill for Phase II (deferred to Phase III)

### Decision

**Selected**: Option B - JWT Tokens (Stateless)

**Rationale**:
- Constitution Principle VII requires stateless backend
- No session store needed (fully stateless)
- Horizontally scalable (Phase IV readiness)
- Industry standard for REST APIs
- Simple to implement in Phase II
- Refresh tokens deferred to Phase III (not critical yet)

**JWT Configuration**:
```python
# Token payload
{
  "sub": "user_id",  # Subject (user identifier)
  "email": "user@example.com",  # For display only
  "exp": 1704153600,  # Expiration (24 hours)
  "iat": 1704067200   # Issued at
}

# Algorithm: HS256 (HMAC with SHA-256)
# Secret: 32+ byte random string from env var
# Expiration: 24 hours (configurable)
```

**Token Revocation Strategy** (Phase II limitation):
- No token revocation before expiration
- User can log out (client deletes token)
- Compromised token valid until expiration
- Mitigation: Short expiration time (24h)
- Future: Refresh tokens + token blacklist (Phase III)

---

## Decision 5: Password Hashing (bcrypt vs argon2 vs scrypt)

### Options Considered

**Option A: SHA-256 + Salt**
- ❌ Too fast (vulnerable to brute force)
- ❌ Not designed for passwords
- ❌ Not recommended by security experts

**Option B: bcrypt** ✅ SELECTED
- ✅ Industry standard for password hashing
- ✅ Built-in salt generation
- ✅ Configurable cost factor (work factor)
- ✅ Mature, well-tested
- ✅ Available in Python (`bcrypt` package)
- ❌ Maximum password length: 72 bytes (not an issue)

**Option C: Argon2**
- ✅ Winner of Password Hashing Competition
- ✅ More modern than bcrypt
- ✅ Memory-hard (GPU-resistant)
- ❌ Less widely supported (Python library exists)
- ❌ Overkill for Phase II threat model

### Decision

**Selected**: Option B - bcrypt

**Rationale**:
- Industry standard, proven security
- Specification requires bcrypt (NFR-010)
- Simple API: `bcrypt.hashpw()` and `bcrypt.checkpw()`
- Cost factor 12 provides good security/performance balance
- Phase II threat model doesn't require Argon2's advanced features

**Implementation**:
```python
import bcrypt

# Hashing (registration)
password_hash = bcrypt.hashpw(
    password.encode('utf-8'),
    bcrypt.gensalt(rounds=12)
)

# Verification (login)
is_valid = bcrypt.checkpw(
    password.encode('utf-8'),
    stored_hash
)
```

**Cost Factor Justification**:
- Cost 12: ~250ms hashing time (acceptable UX)
- Too low (< 10): Vulnerable to brute force
- Too high (> 14): Poor user experience (seconds to login)
- Configurable via environment variable

---

## Decision 6: JWT Library (PyJWT vs python-jose)

### Options Considered

**Option A: PyJWT** ✅ SELECTED
- ✅ Most popular JWT library for Python
- ✅ Simple, focused API
- ✅ Well-maintained (Python JWT standard)
- ✅ Supports HS256, RS256, etc.
- ✅ Clean documentation

**Option B: python-jose**
- ✅ Used in FastAPI documentation
- ✅ Supports JWS, JWE, JWK
- ❌ More features than needed
- ❌ Slightly heavier dependency

### Decision

**Selected**: Option A - PyJWT

**Rationale**:
- Most widely used JWT library in Python ecosystem
- Simple API for Phase II needs
- Only need HS256 (symmetric signing) for Phase II
- Specification doesn't require advanced features (JWE, etc.)
- Lighter dependency

**Usage**:
```python
import jwt
from datetime import datetime, timedelta

# Encode (create token)
payload = {
    "sub": str(user.id),
    "email": user.email,
    "exp": datetime.utcnow() + timedelta(hours=24),
    "iat": datetime.utcnow()
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Decode (validate token)
try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id = int(payload["sub"])
except jwt.ExpiredSignatureError:
    # Token expired
except jwt.InvalidTokenError:
    # Invalid token
```

---

## Decision 7: FastAPI Dependency Injection Pattern

### Options Considered

**Option A: Manual Context Passing**
- ❌ Pass db session and user_id to every function
- ❌ Verbose, error-prone
- ❌ Not idiomatic FastAPI

**Option B: Global State (app.state)**
- ❌ Breaks stateless requirement
- ❌ Thread-safety issues
- ❌ Not testable

**Option C: FastAPI Depends() System** ✅ SELECTED
- ✅ Idiomatic FastAPI pattern
- ✅ Type-safe dependency injection
- ✅ Testable (can mock dependencies)
- ✅ Reusable across routes
- ✅ Clear separation of concerns

### Decision

**Selected**: Option C - FastAPI Depends() System

**Rationale**:
- FastAPI's built-in dependency injection
- Clean, declarative code
- Easy to test (inject mock dependencies)
- Handles database sessions, current user, etc.

**Pattern**:
```python
# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # Decode JWT, fetch user from db
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401)
    return user

# Route using dependencies
@app.get("/api/todos")
async def list_todos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # db session and current_user injected automatically
    return db.query(Todo).filter(Todo.user_id == current_user.id).all()
```

---

## Decision 8: CORS Middleware Configuration

### Options Considered

**Option A: Wildcard CORS (allow all origins)**
- ❌ Security risk (allows any website to call API)
- ❌ Not acceptable for production
- ❌ Violates security requirements

**Option B: Hardcoded Origin**
- ✅ Secure
- ❌ Not flexible (different origins for dev/prod)
- ❌ Requires code change for deployment

**Option C: Environment-Based Origins** ✅ SELECTED
- ✅ Secure (explicit allowed origins)
- ✅ Flexible (different per environment)
- ✅ Configurable without code changes
- ✅ Follows 12-factor app principles

### Decision

**Selected**: Option C - Environment-Based Origins

**Rationale**:
- Security: Explicitly allow only trusted origins
- Flexibility: Different origins for dev/staging/prod
- 12-Factor App: Configuration via environment variables
- Easy deployment: Change env var, not code

**Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

# Load from environment
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000"  # Default for development
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

**Environment Examples**:
- Development: `CORS_ORIGINS=http://localhost:3000`
- Production: `CORS_ORIGINS=https://app.example.com,https://www.example.com`

---

## Decision 9: API Error Handling Pattern

### Options Considered

**Option A: Raise HTTPException Directly**
- ✅ Simple, built into FastAPI
- ❌ Inconsistent error format across routes
- ❌ Difficult to customize error responses

**Option B: Custom Exception Handler** ✅ SELECTED
- ✅ Consistent error format across all routes
- ✅ Can map custom exceptions to HTTP codes
- ✅ Centralized error logging
- ✅ Better error responses (structured JSON)

### Decision

**Selected**: Option B - Custom Exception Handler

**Rationale**:
- Consistent error responses across API
- Centralized logging (log all errors in one place)
- Easy to extend (add new exception types)
- Cleaner route code (raise domain exceptions, not HTTP)

**Pattern**:
```python
# Custom exceptions
class TodoNotFoundError(Exception):
    pass

class UnauthorizedError(Exception):
    pass

# Exception handlers
@app.exception_handler(TodoNotFoundError)
async def todo_not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Todo not found", "error_code": "TODO_NOT_FOUND"}
    )

@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request, exc):
    return JSONResponse(
        status_code=403,
        content={"detail": "Not authorized", "error_code": "FORBIDDEN"}
    )

# Usage in routes
@app.delete("/api/todos/{id}")
async def delete_todo(id: int, current_user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == id).first()
    if not todo:
        raise TodoNotFoundError()  # Clean, domain-level exception
    if todo.user_id != current_user.id:
        raise UnauthorizedError()
    db.delete(todo)
    db.commit()
    return {"message": "Deleted"}
```

---

## Decision 10: Next.js Data Fetching Strategy

### Options Considered

**Option A: Client-Side Fetching (useEffect)**
- ✅ Simple, familiar React pattern
- ✅ Works for all dynamic data
- ❌ No SSR (poor SEO, slower initial load)
- ❌ Loading states required for everything

**Option B: Server Components (App Router)** ✅ SELECTED
- ✅ Server-side rendering (faster initial load)
- ✅ No client-side JavaScript for static parts
- ✅ SEO-friendly
- ✅ Next.js 13+ default pattern
- ❌ Requires understanding RSC model
- ✅ Aligns with constitution (Next.js App Router mandated)

**Option C: Mix (Server Components + Client Components)**
- ✅ Best of both worlds
- ✅ Use Server Components for initial data
- ✅ Use Client Components for interactivity
- ✅ Optimal for Phase II (mostly client-side after auth)

### Decision

**Selected**: Option C - Mix of Server and Client Components

**Rationale**:
- Constitution mandates Next.js App Router
- Use Server Components for landing/login pages (SEO)
- Use Client Components for todo list (authenticated, interactive)
- Fetch data client-side after authentication (JWT in localStorage)
- Simpler than full SSR with authentication

**Pattern**:
```javascript
// Server Component (landing page)
export default async function LandingPage() {
  // Runs on server, no client JS
  return <Hero />;
}

// Client Component (todo list)
'use client';
export default function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetch('/api/todos', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setTodos);
  }, []);

  return <ul>{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}</ul>;
}
```

---

## Decision 11: Frontend State Management

### Options Considered

**Option A: Redux**
- ✅ Powerful, predictable state
- ❌ Boilerplate-heavy
- ❌ Overkill for Phase II complexity

**Option B: Zustand**
- ✅ Simpler than Redux
- ✅ Good for global state
- ❌ Still extra dependency
- ❌ Not needed for Phase II

**Option C: React Hooks (useState, useContext)** ✅ SELECTED
- ✅ Built into React (no dependencies)
- ✅ Sufficient for Phase II scope
- ✅ Familiar to all React developers
- ✅ AuthContext for user state
- ✅ Local state for forms and lists
- ❌ Less structured (no time-travel debugging)

### Decision

**Selected**: Option C - React Hooks (useState, useContext)

**Rationale**:
- Phase II has simple state requirements
- No complex state interactions
- Most state is server state (fetch from API)
- AuthContext sufficient for user/token state
- Local useState for form inputs
- Can add Zustand/Redux in Phase III if needed

**State Architecture**:
```javascript
// Auth state (global via context)
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Login, logout, check auth functions
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Todo state (local to component)
function TodoList() {
  const [todos, setTodos] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchTodos(token).then(setTodos);
  }, [token]);

  return /* render todos */;
}
```

---

## Decision 12: API Client Pattern (Frontend)

### Options Considered

**Option A: Inline fetch() Calls**
- ✅ No abstraction
- ❌ Duplicated code (auth headers, error handling)
- ❌ Hard to test
- ❌ Inconsistent error handling

**Option B: axios Library**
- ✅ Interceptors for auth headers
- ✅ Better error handling
- ❌ Extra dependency
- ❌ Slightly heavier

**Option C: Centralized fetch() Wrapper** ✅ SELECTED
- ✅ DRY principle (shared auth, error handling)
- ✅ No extra dependencies
- ✅ Easy to test (mock one function)
- ✅ Consistent across app

### Decision

**Selected**: Option C - Centralized fetch() Wrapper

**Rationale**:
- No external dependency (use native fetch)
- Centralize auth header injection
- Centralize error handling (401 → redirect to login)
- Easy to mock in tests

**Pattern**:
```javascript
// lib/api.ts
export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

// Usage
export async function createTodo(title, description) {
  return apiCall('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}
```

---

## Decision 13: Database Session Management

### Options Considered

**Option A: Global Session (app startup)**
- ❌ Not thread-safe
- ❌ Breaks stateless requirement
- ❌ Doesn't work with async

**Option B: Session per Request** ✅ SELECTED
- ✅ Thread-safe (each request has own session)
- ✅ Automatic cleanup (session closed after request)
- ✅ Stateless (no shared state between requests)
- ✅ FastAPI Depends() pattern supports this

### Decision

**Selected**: Option B - Session per Request

**Rationale**:
- FastAPI Depends() creates new session per request
- Session scoped to request (thread-safe)
- Automatic cleanup in finally block
- Stateless backend requirement (Principle VII)

**Pattern**:
```python
from sqlmodel import Session, create_engine

engine = create_engine(DATABASE_URL)

# Dependency
def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

# Usage
@app.post("/api/todos")
async def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    # New session created for this request
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo
    # Session automatically closed after response
```

---

## Summary of Key Decisions

| Decision | Selected Option | Rationale |
|----------|----------------|-----------|
| Database | SQLite (dev) + PostgreSQL (prod) | Fast dev setup, production-ready |
| ORM | SQLModel | Constitution mandated, combines SQLAlchemy + Pydantic |
| Migrations | Alembic | Industry standard, auto-generation |
| Auth | JWT (stateless) | Stateless backend requirement, horizontally scalable |
| Password Hash | bcrypt (cost 12) | Industry standard, specification requirement |
| JWT Library | PyJWT | Most popular, simple API |
| Dependency Injection | FastAPI Depends() | Idiomatic, testable, type-safe |
| CORS | Environment-based origins | Secure, flexible, 12-factor compliant |
| Error Handling | Custom exception handlers | Consistent, centralized, clean code |
| Frontend Data | Server + Client Components | Next.js App Router, optimal for auth'd app |
| Frontend State | React Hooks + Context | Sufficient for Phase II, no extra deps |
| API Client | Centralized fetch wrapper | DRY, no dependency, testable |
| DB Sessions | Session per request | Thread-safe, stateless, automatic cleanup |

---

## Related Documents

- **Specification**: `specs/002-web-app/spec.md`
- **Implementation Plan**: `specs/002-web-app/plan.md`
- **Data Model**: `specs/002-web-app/data-model.md`
- **API Contracts**: `specs/002-web-app/contracts/api.md`
