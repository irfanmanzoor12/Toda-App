# Data Model: Phase I – In-Memory Todo CLI

**Feature**: 001-in-memory-cli
**Date**: 2025-12-28
**Phase**: 1 (Design)

## Entities

### Todo

Represents a single task to be completed.

**Purpose**: Core data entity for the todo application. Captures all information needed to track a task from creation through completion.

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | int | Yes | Auto-increment | Unique identifier for the todo |
| title | str | Yes | - | Brief description of the task (1-500 chars) |
| description | str | No | "" | Detailed description or notes (0-2000 chars) |
| status | TodoStatus | Yes | PENDING | Current state of the todo |
| created_at | datetime | Yes | now() | Timestamp when todo was created |

**Validation Rules**:
- **title**:
  - MUST NOT be empty or whitespace-only
  - MUST be 1-500 characters after trimming
  - MAY contain any Unicode characters
- **description**:
  - MAY be empty
  - MUST be 0-2000 characters if provided
  - MAY contain any Unicode characters including newlines
- **id**:
  - MUST be positive integer
  - MUST be unique across all todos in session
  - MUST be auto-assigned by storage layer
- **status**:
  - MUST be one of: PENDING or COMPLETE
  - Defaults to PENDING on creation
  - Can only transition: PENDING → COMPLETE or COMPLETE → COMPLETE (idempotent)
- **created_at**:
  - MUST be UTC timestamp
  - MUST be auto-assigned on creation
  - MUST NOT be modifiable after creation

**State Transitions**:
```
[PENDING] ──(mark_complete)──> [COMPLETE]
    ↑                                ↓
    └──────(mark_complete)───────────┘
         (idempotent)
```

**Relationships**: None (todos are independent entities in Phase I)

**Invariants**:
- Once created, `id` and `created_at` are immutable
- `title` must always be non-empty
- Status can only be PENDING or COMPLETE (no intermediate states)

---

### TodoStatus

Enumeration of possible todo states.

**Purpose**: Type-safe representation of todo completion status.

**Values**:

| Value | String Representation | Meaning |
|-------|----------------------|---------|
| PENDING | "pending" | Task not yet completed |
| COMPLETE | "complete" | Task finished |

**Usage**: Used as the type for Todo.status field.

---

## Storage Schema (In-Memory)

For Phase I, data is stored in memory using Python data structures.

**Primary Storage**: Dictionary (hash map)
```python
{
    1: Todo(id=1, title="Buy groceries", ...),
    2: Todo(id=2, title="Write report", ...),
    3: Todo(id=3, title="Call dentist", ...),
}
```

**Key**: Todo ID (int)
**Value**: Todo object

**Indexes**: None (Phase I supports list-all only, no search/filter)

**Capacity**: Limited by available memory (target: 1000+ todos)

**Persistence**: None - all data lost when CLI session ends

---

## Future Phase Considerations

### Phase II Migration (Web + Persistence)

When migrating to SQLModel/database:

**Todo Table**:
```sql
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,  -- New field for Phase II
    CHECK (status IN ('pending', 'complete')),
    CHECK (LENGTH(TRIM(title)) > 0)
);

CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
```

**Migration Strategy**:
1. Add `updated_at` field (optional in Phase II)
2. Add database constraints matching validation rules
3. Create indexes for status and date queries
4. TodoStatus enum values map directly to VARCHAR column
5. Data model class remains same, just inherit from SQLModel instead of dataclass

### Phase III Additions (AI Chatbot)

Potential new fields when MCP/agents introduced:
- `tags`: List[str] for categorization
- `priority`: int for ranking
- `due_date`: Optional[datetime] for deadlines
- `user_id`: int for multi-user support

These are OUT OF SCOPE for Phase I per constitution's Phase-Gated Evolution principle.

---

## Examples

### Example 1: Minimal Todo (Title Only)
```python
Todo(
    id=1,
    title="Buy milk",
    description="",
    status=TodoStatus.PENDING,
    created_at=datetime(2025, 12, 28, 10, 30, 0)
)
```

### Example 2: Complete Todo with Description
```python
Todo(
    id=2,
    title="Prepare presentation for Monday meeting",
    description="Include Q4 sales figures and 2026 projections. Add charts from analytics dashboard.",
    status=TodoStatus.COMPLETE,
    created_at=datetime(2025, 12, 27, 14, 15, 0)
)
```

### Example 3: Unicode Support
```python
Todo(
    id=3,
    title="Comprar café ☕",
    description="Marca preferida: Lavazza. Tamaño: 1kg.",
    status=TodoStatus.PENDING,
    created_at=datetime(2025, 12, 28, 9, 0, 0)
)
```

---

## Implementation Notes

### Dataclass Implementation
```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

class TodoStatus(Enum):
    PENDING = "pending"
    COMPLETE = "complete"

@dataclass
class Todo:
    id: int
    title: str
    description: str = ""
    status: TodoStatus = field(default=TodoStatus.PENDING)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        """Validate todo fields after initialization"""
        if not self.title or not self.title.strip():
            raise ValueError("Title cannot be empty or whitespace-only")
        if len(self.title) > 500:
            raise ValueError("Title cannot exceed 500 characters")
        if len(self.description) > 2000:
            raise ValueError("Description cannot exceed 2000 characters")
        # Trim title
        self.title = self.title.strip()
```

### Storage Implementation
```python
class MemoryStore:
    def __init__(self):
        self._todos: dict[int, Todo] = {}
        self._next_id: int = 1

    def add(self, title: str, description: str = "") -> Todo:
        todo = Todo(
            id=self._next_id,
            title=title,
            description=description
        )
        self._todos[todo.id] = todo
        self._next_id += 1
        return todo

    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        return self._todos.get(todo_id)

    def get_all(self) -> List[Todo]:
        return list(self._todos.values())

    def update(self, todo_id: int, title: Optional[str] = None,
               description: Optional[str] = None) -> Todo:
        if todo_id not in self._todos:
            raise KeyError(f"Todo #{todo_id} not found")

        todo = self._todos[todo_id]
        if title is not None:
            todo.title = title
        if description is not None:
            todo.description = description
        return todo

    def delete(self, todo_id: int) -> bool:
        if todo_id in self._todos:
            del self._todos[todo_id]
            return True
        return False

    def mark_complete(self, todo_id: int) -> Todo:
        if todo_id not in self._todos:
            raise KeyError(f"Todo #{todo_id} not found")

        todo = self._todos[todo_id]
        todo.status = TodoStatus.COMPLETE
        return todo
```

---

## Validation Reference

All validation rules are centralized in `src/skills/validator.py` to ensure consistency and reusability:

```python
class TodoValidator:
    MAX_TITLE_LENGTH = 500
    MAX_DESCRIPTION_LENGTH = 2000

    @staticmethod
    def validate_title(title: str) -> str:
        """Validate and normalize title. Raises ValueError if invalid."""
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")

        normalized = title.strip()
        if len(normalized) > TodoValidator.MAX_TITLE_LENGTH:
            raise ValueError(f"Title cannot exceed {TodoValidator.MAX_TITLE_LENGTH} characters")

        return normalized

    @staticmethod
    def validate_description(description: str) -> str:
        """Validate description. Raises ValueError if invalid."""
        if len(description) > TodoValidator.MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description cannot exceed {TodoValidator.MAX_DESCRIPTION_LENGTH} characters")

        return description

    @staticmethod
    def validate_id(todo_id: str) -> int:
        """Validate and parse todo ID. Raises ValueError if invalid."""
        try:
            id_int = int(todo_id)
            if id_int <= 0:
                raise ValueError("Todo ID must be a positive integer")
            return id_int
        except ValueError:
            raise ValueError(f"Invalid todo ID: '{todo_id}'. Must be a positive integer.")
```
