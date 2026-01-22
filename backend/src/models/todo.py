"""Todo model for Phase V with advanced features.

TASK-010: Update Task model with new fields
REQ-002, REQ-003, REQ-004: Due dates, priorities, tags
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR


class PriorityEnum(str, Enum):
    """Task priority levels."""
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Todo(SQLModel, table=True):
    """Todo model for multi-user todo application with Phase V enhancements.

    Phase V adds:
    - Priority levels (low, medium, high, critical)
    - Due dates with reminders
    - Tags (many-to-many relationship)
    - Soft delete
    - Full-text search
    """

    # Original fields
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Phase V: Priority (REQ-003)
    priority: str = Field(default="medium", max_length=20)

    # Phase V: Due dates and reminders (REQ-002)
    due_date: Optional[datetime] = Field(default=None, index=True)
    reminder_schedule: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB)
    )

    # Phase V: Soft delete (REQ-006)
    deleted_at: Optional[datetime] = Field(default=None, index=True)

    # Phase V: Full-text search (REQ-005)
    # Note: search_vector is managed by PostgreSQL trigger, not set directly
    search_vector: Optional[str] = Field(
        default=None,
        sa_column=Column(TSVECTOR)
    )

    # Relationships (Phase V: REQ-004)
    # Note: Tags relationship is loaded separately via query joins
    # to avoid circular imports and lazy loading issues
