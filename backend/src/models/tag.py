"""Tag model for Phase V.

TASK-011: Create Tag and TaskTag models
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Tag(SQLModel, table=True):
    """Tag model for categorizing tasks.

    Tags are user-scoped with unique constraint on (name, user_id).
    """
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, index=True)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        # SQLModel config
        table = True
