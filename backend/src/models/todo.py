"""Todo model for Phase II multi-user support.

Task: T202 - Create Todo SQLModel with user isolation via user_id from JWT.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Todo(SQLModel, table=True):
    """Todo model for multi-user todo application.

    T202: Todo items are isolated by user_id (string from JWT).
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
