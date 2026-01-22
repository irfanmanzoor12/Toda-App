"""Reminder model for scheduled notifications.

TASK-033: Create Reminder model in Reminder Service
REQ-002: Due Dates & Time Reminders
COMP-003: Reminder Service
"""

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class Reminder(SQLModel, table=True):
    """Model for storing scheduled reminders.

    Matches the reminders table created in migration TASK-008.
    """
    __tablename__ = "reminders"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(index=True)
    user_id: str = Field(index=True)

    # When to trigger the reminder
    trigger_at: datetime = Field(index=True)

    # State tracking
    sent_at: Optional[datetime] = Field(default=None)
    cancelled_at: Optional[datetime] = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
