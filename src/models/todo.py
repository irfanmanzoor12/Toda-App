"""Todo model and status enumeration."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class TodoStatus(Enum):
    """Enumeration of possible todo states."""
    PENDING = "pending"
    COMPLETE = "complete"


@dataclass
class Todo:
    """
    Represents a single task to be completed.

    Attributes:
        id: Unique identifier (auto-assigned by storage)
        title: Brief description of the task (1-500 chars)
        description: Detailed description or notes (0-2000 chars)
        status: Current state (PENDING or COMPLETE)
        created_at: Timestamp when todo was created (UTC)
    """
    id: int
    title: str
    description: str = ""
    status: TodoStatus = field(default=TodoStatus.PENDING)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        """Validate todo fields after initialization."""
        # Validate title
        if not self.title or not self.title.strip():
            raise ValueError("Title cannot be empty or whitespace-only")

        # Trim title
        self.title = self.title.strip()

        # Validate title length
        if len(self.title) > 500:
            raise ValueError("Title cannot exceed 500 characters")

        # Validate description length
        if len(self.description) > 2000:
            raise ValueError("Description cannot exceed 2000 characters")
