# Research: Phase I – In-Memory Todo CLI

**Feature**: 001-in-memory-cli
**Date**: 2025-12-28
**Phase**: 0 (Research & Technology Selection)

## Research Questions

### Q1: What CLI argument parsing approach should we use for Python 3.13+?

**Decision**: Use Python's built-in `argparse` module

**Rationale**:
- Standard library (no external dependencies required for Phase I)
- Mature, well-documented, widely understood
- Supports all required features: subcommands, positional args, optional flags, help generation
- Future-proof for Phase II/III transitions
- Constitution mandates standard approaches where possible

**Alternatives Considered**:
- **Click**: Modern, decorator-based CLI framework
  - Rejected: External dependency, overkill for simple Phase I CLI
- **Typer**: Type-hint based CLI with automatic help
  - Rejected: External dependency, adds complexity for simple use case
- **sys.argv manual parsing**: Direct argument access
  - Rejected: Too primitive, error-prone, no built-in help

**Best Practices**:
- Use subcommands for each operation (add, list, update, delete, complete, help)
- Provide clear help text for all commands
- Validate arguments before passing to business logic
- Return consistent exit codes (0 = success, 1 = error)

---

### Q2: How should we structure the Todo data model for Phase I with future phases in mind?

**Decision**: Use Python dataclass with explicit field types and validation

**Rationale**:
- Dataclasses provide clean, type-safe data containers
- Compatible with future Pydantic/SQLModel migration in Phase II
- Built-in `__repr__`, `__eq__`, etc. reduce boilerplate
- Type hints enable better IDE support and validation
- Easy to serialize/deserialize for future API needs

**Alternatives Considered**:
- **Plain dict**: Simple key-value storage
  - Rejected: No type safety, no validation, error-prone
- **NamedTuple**: Immutable data container
  - Rejected: Immutability conflicts with update operations
- **Pydantic BaseModel**: Advanced validation
  - Rejected: External dependency, overkill for Phase I (but will use in Phase II)

**Data Model Structure**:
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
    status: TodoStatus = TodoStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
```

---

### Q3: What testing strategy should we employ for Phase I?

**Decision**: pytest with unit tests for skills/models and integration tests for user stories

**Rationale**:
- pytest is Python's de facto standard testing framework
- Minimal boilerplate compared to unittest
- Rich assertion introspection
- Fixture system ideal for test data setup
- Plugin ecosystem for future needs (coverage, etc.)
- Constitution mandates thorough testing

**Test Coverage Strategy**:
- **Unit Tests** (tests/unit/):
  - Todo model (creation, status transitions)
  - TodoManager skills (add, list, update, delete, complete logic)
  - Validator (input validation rules)
  - MemoryStore (storage operations)
- **Integration Tests** (tests/integration/):
  - End-to-end user story workflows
  - CLI command execution
  - Error handling paths

**Alternatives Considered**:
- **unittest**: Standard library testing
  - Rejected: More verbose, less intuitive than pytest
- **nose2**: pytest predecessor
  - Rejected: Less actively maintained than pytest

**Best Practices**:
- Aim for 90%+ code coverage
- Test both happy paths and error conditions
- Use fixtures for common test data (sample todos)
- Integration tests map directly to user story acceptance criteria

---

### Q4: How should we implement the in-memory storage for Phase I with Phase II migration in mind?

**Decision**: Abstract storage interface with in-memory implementation

**Rationale**:
- Repository pattern provides clean separation between business logic and storage
- Easy to swap MemoryStore for DatabaseStore in Phase II
- Skills layer remains unchanged when storage backend changes
- Follows constitution's skills-first architecture principle

**Storage Interface Design**:
```python
from abc import ABC, abstractmethod
from typing import List, Optional

class TodoStore(ABC):
    @abstractmethod
    def add(self, todo: Todo) -> Todo:
        """Add a new todo"""
        pass

    @abstractmethod
    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        """Retrieve todo by ID"""
        pass

    @abstractmethod
    def get_all(self) -> List[Todo]:
        """Retrieve all todos"""
        pass

    @abstractmethod
    def update(self, todo: Todo) -> Todo:
        """Update existing todo"""
        pass

    @abstractmethod
    def delete(self, todo_id: int) -> bool:
        """Delete todo by ID"""
        pass
```

**Phase I Implementation** (MemoryStore):
- Use Python dict keyed by todo ID
- Maintain counter for auto-incrementing IDs
- All operations in O(1) or O(n) time

**Phase II Migration Path**:
- Implement DatabaseStore using SQLModel
- Same interface, different backend
- Skills layer requires zero changes

**Alternatives Considered**:
- **Direct list/dict in TodoManager**: Simpler but couples logic to storage
  - Rejected: Violates separation of concerns, hard Phase II migration
- **File-based persistence**: JSON/pickle storage
  - Rejected: Out of scope for Phase I (no persistence allowed)

**Best Practices**:
- Keep storage interface minimal (CRUD only)
- No business logic in storage layer
- Return immutable copies to prevent accidental mutations

---

### Q5: What CLI UX patterns should we follow for error handling and user feedback?

**Decision**: Clear, actionable error messages with contextual help hints

**Rationale**:
- Success criteria SC-007 requires 90% error clarity
- Good UX reduces support burden
- Helps users self-correct without documentation

**Error Handling Strategy**:
1. **Validation Errors**: Show what's wrong and what's expected
   ```
   Error: Title cannot be empty
   Usage: todo add <title> [--description TEXT]
   ```

2. **Not Found Errors**: Confirm action and suggest alternatives
   ```
   Error: Todo #5 not found
   Tip: Use 'todo list' to see all available todos
   ```

3. **Success Messages**: Confirm action with details
   ```
   ✓ Todo #3 created: "Buy groceries"
   ✓ Todo #3 marked as complete
   ```

4. **Help Integration**: Always available via `todo help` or `todo <command> --help`

**Display Formatting**:
- Use tabular format for list output
- Visual status indicators (✓ complete, ○ pending)
- Timestamps in human-readable format
- Color coding (optional, with fallback for no-color terminals)

**Alternatives Considered**:
- **Terse Unix-style errors**: Minimal output
  - Rejected: Fails SC-007 clarity requirement
- **Verbose debug output**: Full stack traces
  - Rejected: Overwhelming for users, better suited for --debug flag

**Best Practices**:
- Exit code 0 for success, 1 for user errors, 2 for system errors
- Use stderr for errors, stdout for output
- Provide examples in help text
- Keep messages concise (< 2 lines)

---

## Summary

All research questions resolved with clear decisions and rationale. Key technology choices:

- **CLI Framework**: argparse (standard library)
- **Data Model**: dataclass with enums
- **Testing**: pytest with unit and integration tests
- **Storage**: Abstract interface with in-memory implementation
- **UX**: Clear error messages with contextual help

No external dependencies required for Phase I. All choices align with:
- Constitution principle: Technology Lock (Python 3.13+)
- Constitution principle: Skills Before Agents (clean separation)
- Constitution principle: Phase-Gated Evolution (in-memory only)
- Success criteria: SC-007 (error message clarity)

Ready to proceed to Phase 1 (Design).
