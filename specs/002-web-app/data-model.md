# Data Model: Phase II Web Application

**Feature**: 002-web-app
**Created**: 2025-12-28
**Status**: Draft

---

## Purpose

This document defines the data model evolution from Phase I (in-memory) to Phase II (database-backed with multi-user support). It specifies entity structures, relationships, constraints, and migration strategy.

---

## Data Model Evolution

### Phase I Model (Baseline)

**Todo Entity** (In-Memory):
```python
@dataclass
class Todo:
    id: int
    title: str
    description: str = ""
    status: TodoStatus = field(default=TodoStatus.PENDING)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
```

**TodoStatus Enum**:
```python
class TodoStatus(Enum):
    PENDING = "pending"
    COMPLETE = "complete"
```

**Characteristics**:
- No user association (single-user app)
- No database persistence
- Simple integer IDs (manual counter)
- No relationships

### Phase II Model (Enhanced)

**User Entity** (New):
```python
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    todos: list["Todo"] = Relationship(back_populates="user")
```

**Todo Entity** (Extended):
```python
class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=2000)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="users.id")  # NEW

    # Relationships
    user: User = Relationship(back_populates="todos")
```

**TodoStatus Enum** (Unchanged):
```python
class TodoStatus(Enum):
    PENDING = "pending"
    COMPLETE = "complete"
```

**Changes from Phase I**:
- ✅ Added `user_id` foreign key to Todo
- ✅ Added User entity
- ✅ Added relationships (User ↔ Todo)
- ✅ Changed from dataclass to SQLModel
- ✅ Added database constraints (unique email, foreign key)
- ❌ No changes to validation rules (title, description lengths)
- ❌ No changes to status enum values

---

## Entity Specifications

### User Entity

**Purpose**: Represents an authenticated user with their own todo list.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| `email` | str(255) | UNIQUE, NOT NULL, INDEX | User's email address (login) |
| `password_hash` | str(255) | NOT NULL | Bcrypt-hashed password (never plaintext) |
| `created_at` | datetime | NOT NULL, DEFAULT NOW | Account creation timestamp |

**Relationships**:
- **todos**: One-to-many with Todo (user has many todos)

**Indexes**:
- Primary: `id` (automatic)
- Unique: `email` (for login lookups)

**Constraints**:
- `email` must be unique across all users
- `email` must be valid email format (validated in application layer)
- `password_hash` must be bcrypt hash (validated in application layer)
- Cannot delete user if they have todos (CASCADE delete policy)

**Validation Rules** (Application Layer):
- Email: RFC 5322 compliant
- Password (before hashing): Minimum 8 characters, at least one letter and one number

**Security Considerations**:
- `password_hash` never exposed in API responses
- `password_hash` never logged
- Bcrypt cost factor: 12 (configurable)

---

### Todo Entity

**Purpose**: Represents a task to be completed, owned by a user.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Unique todo identifier |
| `title` | str(500) | NOT NULL, LENGTH 1-500 | Todo title (required) |
| `description` | str(2000) | LENGTH 0-2000, DEFAULT '' | Todo description (optional) |
| `status` | str(20) | NOT NULL, DEFAULT 'pending' | Todo completion status |
| `created_at` | datetime | NOT NULL, DEFAULT NOW | Todo creation timestamp |
| `user_id` | int | FOREIGN KEY → users.id, NOT NULL | Owner of this todo |

**Relationships**:
- **user**: Many-to-one with User (todo belongs to user)

**Indexes**:
- Primary: `id` (automatic)
- Foreign key: `user_id` (for efficient filtering by user)
- Additional: `created_at DESC` (for sorting newest first)

**Constraints**:
- `user_id` must reference valid user (foreign key constraint)
- `title` cannot be empty (CHECK LENGTH(title) > 0)
- `status` must be 'pending' or 'complete' (CHECK or ENUM)
- Deleting user CASCADE deletes their todos

**Validation Rules** (Application Layer - Phase I Reused):
- Title: 1-500 characters (TodoValidator.validate_title)
- Description: 0-2000 characters (TodoValidator.validate_description)
- Status: Must be TodoStatus.PENDING or TodoStatus.COMPLETE

**Business Rules**:
- User can only access their own todos (application-level authorization)
- Marking todo complete is idempotent (can mark complete multiple times)
- Todos ordered by created_at DESC by default (newest first)

---

## Entity Relationships

### Relationship Diagram

```
┌──────────────────────────┐
│         User             │
│ ─────────────────────── │
│ id (PK)                 │
│ email (UNIQUE)          │
│ password_hash           │
│ created_at              │
└──────────┬───────────────┘
           │
           │ 1
           │
           │
           │ n
           │
┌──────────▼───────────────┐
│         Todo             │
│ ─────────────────────── │
│ id (PK)                 │
│ title                   │
│ description             │
│ status                  │
│ created_at              │
│ user_id (FK)            │
└──────────────────────────┘
```

**Relationship Cardinality**:
- One User → Many Todos (1:n)
- One Todo → One User (n:1)

**SQLModel Relationship Definition**:
```python
# User side
todos: list["Todo"] = Relationship(back_populates="user")

# Todo side
user: User = Relationship(back_populates="todos")
```

**Database Foreign Key**:
```sql
ALTER TABLE todos
ADD CONSTRAINT fk_todos_user_id
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;
```

**Cascade Behavior**:
- Deleting a user → Deletes all their todos (CASCADE)
- Deleting a todo → No effect on user (simple delete)

**Query Patterns**:
```python
# Get all todos for a user
user_todos = db.query(Todo).filter(Todo.user_id == user.id).all()

# Get user for a todo
todo_owner = db.query(User).join(Todo).filter(Todo.id == todo_id).first()

# Eager loading (avoid N+1)
user_with_todos = db.query(User).options(joinedload(User.todos)).first()
```

---

## Database Schema (DDL)

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Todos table
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL CHECK (LENGTH(title) > 0),
    description VARCHAR(2000) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
```

### SQLite Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Todos table
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 500),
    description TEXT DEFAULT '' CHECK (LENGTH(description) <= 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
```

**Differences**:
- PostgreSQL: `SERIAL` vs SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT`
- PostgreSQL: `VARCHAR` vs SQLite: `TEXT`
- Both support CHECK constraints and foreign keys

---

## Data Validation Layers

### Layer 1: Database Constraints

**Enforced by Database**:
- Primary key uniqueness (id)
- Foreign key validity (user_id → users.id)
- NOT NULL constraints
- UNIQUE constraint (email)
- CHECK constraints (title length > 0, status values)
- Default values (created_at, description, status)

**Purpose**: Last line of defense, data integrity

---

### Layer 2: SQLModel Validation

**Enforced by Pydantic (SQLModel)**:
```python
class Todo(SQLModel, table=True):
    title: str = Field(min_length=1, max_length=500)  # Validates length
    description: str = Field(default="", max_length=2000)  # Validates length
    status: str = Field(default="pending", max_length=20)  # Validates type
    user_id: int = Field(foreign_key="users.id")  # Validates type
```

**Purpose**: Pre-insert validation, better error messages

---

### Layer 3: Business Logic Validation (Phase I Reused)

**Enforced by TodoValidator**:
```python
class TodoValidator:
    @staticmethod
    def validate_title(title: str) -> str:
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        normalized = title.strip()
        if len(normalized) > 500:
            raise ValueError("Title cannot exceed 500 characters")
        return normalized

    @staticmethod
    def validate_description(description: str) -> str:
        if len(description) > 2000:
            raise ValueError("Description cannot exceed 2000 characters")
        return description
```

**Purpose**: Same validation rules as Phase I, ensures consistency

---

### Layer 4: API Schema Validation

**Enforced by Pydantic Request Models**:
```python
class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=2000)

class UserRegister(BaseModel):
    email: EmailStr  # Validates email format
    password: str = Field(min_length=8)

    @validator('password')
    def validate_password(cls, v):
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v
```

**Purpose**: Validate requests before hitting business logic

---

## Data Migration Strategy

### Phase I to Phase II Migration

**No Data Migration Required**:
- Phase I had no persistence (in-memory only)
- Phase II starts with empty database
- No existing data to migrate

**Initial Migration** (Alembic):
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema: users and todos"

# Migration creates:
# - users table
# - todos table
# - indexes
# - foreign key constraints
```

**Migration File** (Generated):
```python
def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

    # Create todos table
    op.create_table(
        'todos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.String(2000), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_todos_user_id', 'todos', ['user_id'])
    op.create_index('idx_todos_created_at', 'todos', ['created_at'])

def downgrade():
    op.drop_table('todos')
    op.drop_table('users')
```

---

## API Request/Response Models

### User Models

**UserRegister** (Request):
```python
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
```

**UserLogin** (Request):
```python
class UserLogin(BaseModel):
    email: EmailStr
    password: str
```

**UserResponse** (Response):
```python
class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        orm_mode = True
```

**Note**: `password_hash` NEVER exposed in responses

---

### Todo Models

**TodoCreate** (Request):
```python
class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=2000)
```

**TodoUpdate** (Request):
```python
class TodoUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = Field(None, max_length=2000)
```

**TodoResponse** (Response):
```python
class TodoResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    created_at: datetime
    user_id: int

    class Config:
        orm_mode = True
```

**Note**: `user_id` included in response for ownership verification

---

## Data Access Patterns

### Create Operations

**User Registration**:
```python
def create_user(db: Session, email: str, password: str) -> User:
    # Hash password
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))

    # Create user
    user = User(email=email, password_hash=password_hash.decode())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
```

**Todo Creation**:
```python
def create_todo(db: Session, title: str, description: str, user_id: int) -> Todo:
    # Validate via TodoValidator (Phase I reuse)
    validated_title = TodoValidator.validate_title(title)
    validated_description = TodoValidator.validate_description(description)

    # Create todo
    todo = Todo(
        title=validated_title,
        description=validated_description,
        user_id=user_id
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo
```

---

### Read Operations

**List User's Todos**:
```python
def list_todos(db: Session, user_id: int) -> list[Todo]:
    return (
        db.query(Todo)
        .filter(Todo.user_id == user_id)
        .order_by(Todo.created_at.desc())
        .all()
    )
```

**Get Specific Todo**:
```python
def get_todo(db: Session, todo_id: int, user_id: int) -> Todo | None:
    return (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == user_id)
        .first()
    )
```

---

### Update Operations

**Mark Todo Complete**:
```python
def mark_complete(db: Session, todo_id: int, user_id: int) -> Todo:
    todo = get_todo(db, todo_id, user_id)
    if not todo:
        raise TodoNotFoundError()

    todo.status = TodoStatus.COMPLETE.value
    db.commit()
    db.refresh(todo)
    return todo
```

**Update Todo Fields**:
```python
def update_todo(
    db: Session,
    todo_id: int,
    user_id: int,
    title: str | None,
    description: str | None
) -> Todo:
    todo = get_todo(db, todo_id, user_id)
    if not todo:
        raise TodoNotFoundError()

    if title is not None:
        validated_title = TodoValidator.validate_title(title)
        todo.title = validated_title

    if description is not None:
        validated_description = TodoValidator.validate_description(description)
        todo.description = validated_description

    db.commit()
    db.refresh(todo)
    return todo
```

---

### Delete Operations

**Delete Todo**:
```python
def delete_todo(db: Session, todo_id: int, user_id: int) -> bool:
    todo = get_todo(db, todo_id, user_id)
    if not todo:
        raise TodoNotFoundError()

    db.delete(todo)
    db.commit()
    return True
```

**Delete User** (Cascades to Todos):
```python
def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UserNotFoundError()

    db.delete(user)  # CASCADE deletes all user's todos
    db.commit()
    return True
```

---

## Performance Considerations

### Indexing Strategy

**users.email** (UNIQUE INDEX):
- Purpose: Fast login lookups
- Query: `SELECT * FROM users WHERE email = ?`
- Frequency: Every login attempt

**todos.user_id** (INDEX):
- Purpose: Fast filtering by user
- Query: `SELECT * FROM todos WHERE user_id = ?`
- Frequency: Every todo list request

**todos.created_at** (INDEX DESC):
- Purpose: Fast ordering by newest first
- Query: `SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC`
- Frequency: Every todo list request

### Query Optimization

**Avoid N+1 Queries**:
```python
# Bad: N+1 query (fetches user for each todo)
todos = db.query(Todo).all()
for todo in todos:
    print(todo.user.email)  # Separate query for each user

# Good: Single query with join
todos = db.query(Todo).options(joinedload(Todo.user)).all()
for todo in todos:
    print(todo.user.email)  # User already loaded
```

**Pagination** (Future Enhancement):
```python
# Not required for Phase II, but pattern for future:
def list_todos_paginated(db: Session, user_id: int, page: int, limit: int):
    offset = (page - 1) * limit
    return (
        db.query(Todo)
        .filter(Todo.user_id == user_id)
        .order_by(Todo.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
```

---

## Data Integrity Rules

### Referential Integrity

**Foreign Key Enforcement**:
- `todos.user_id` MUST reference valid `users.id`
- Database enforces via FOREIGN KEY constraint
- Cannot insert todo with invalid user_id

**Cascade Delete**:
- Deleting user → Deletes all their todos
- Prevents orphaned todos
- `ON DELETE CASCADE` policy

### Uniqueness Constraints

**User Email**:
- Email must be unique across all users
- Database enforces via UNIQUE constraint
- Attempt to register duplicate email → Database error → API returns 400

### Check Constraints

**Todo Title**:
- Title must not be empty
- `CHECK (LENGTH(title) > 0)`

**Todo Status**:
- Status must be 'pending' or 'complete'
- `CHECK (status IN ('pending', 'complete'))`

---

## Related Documents

- **Specification**: `specs/002-web-app/spec.md`
- **Implementation Plan**: `specs/002-web-app/plan.md`
- **Research Decisions**: `specs/002-web-app/research.md`
- **API Contracts**: `specs/002-web-app/contracts/api.md`
- **Phase I Data Model**: `specs/001-in-memory-cli/data-model.md` (for comparison)
