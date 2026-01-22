"""TaskTag junction model for Phase V.

TASK-011: Create Tag and TaskTag models
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class TaskTag(SQLModel, table=True):
    """Junction table for many-to-many relationship between tasks and tags."""
    __tablename__ = "task_tags"

    task_id: int = Field(foreign_key="todo.id", primary_key=True, ondelete="CASCADE")
    tag_id: int = Field(foreign_key="tags.id", primary_key=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        # SQLModel config
        table = True
