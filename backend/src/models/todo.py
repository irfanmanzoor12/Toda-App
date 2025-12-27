"""Todo model and status enumeration for Phase II (SQLModel-based)."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, Relationship


class TodoStatus(Enum):
    """Enumeration of possible todo states."""
    PENDING = "pending"
    COMPLETE = "complete"


class Todo(SQLModel, table=True):
    """
    Represents a single task to be completed with persistent storage.

    Attributes:
        id: Unique identifier (auto-assigned by database)
        title: Brief description of the task (1-500 chars)
        description: Detailed description or notes (0-2000 chars)
        status: Current state (PENDING or COMPLETE)
        created_at: Timestamp when todo was created (UTC)
        user_id: Foreign key to the owning user
        user: Relationship to User model
    """
    __tablename__ = "todos"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=500, index=True)
    description: str = Field(default="", max_length=2000)
    status: str = Field(default=TodoStatus.PENDING.value, max_length=20)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: int = Field(foreign_key="users.id", index=True)

    # Relationship (will be populated by SQLModel)
    # user: Optional["User"] = Relationship(back_populates="todos")

    def __init__(self, **data):
        """Initialize and validate todo fields."""
        # Validate title before setting
        if "title" in data:
            title = data["title"]
            if not title or not str(title).strip():
                raise ValueError("Title cannot be empty or whitespace-only")
            # Trim title
            data["title"] = str(title).strip()
            # Validate title length
            if len(data["title"]) > 500:
                raise ValueError("Title cannot exceed 500 characters")

        # Validate description
        if "description" in data:
            description = data["description"]
            if len(str(description)) > 2000:
                raise ValueError("Description cannot exceed 2000 characters")

        # Convert TodoStatus enum to string if needed
        if "status" in data and isinstance(data["status"], TodoStatus):
            data["status"] = data["status"].value

        super().__init__(**data)
