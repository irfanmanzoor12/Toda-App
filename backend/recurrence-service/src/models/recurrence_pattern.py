"""RecurrencePattern model for recurring tasks.

TASK-024: Create RecurrencePattern model in Recurrence Service
REQ-001: Recurring Tasks
COMP-002: Recurrence Service
"""

from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text


class FrequencyEnum(str, Enum):
    """Recurrence frequency options."""
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class RecurrencePattern(SQLModel, table=True):
    """Model for storing recurrence patterns.

    Matches the recurrence_pattern table created in migration TASK-007.
    """
    __tablename__ = "recurrence_pattern"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(index=True, unique=True)
    user_id: str = Field(index=True)

    # Recurrence configuration
    frequency: str = Field(max_length=20)  # daily, weekly, monthly
    interval: int = Field(default=1, ge=1)  # Every N days/weeks/months

    # For weekly recurrence (0=Monday, 6=Sunday)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)

    # For monthly recurrence (1-31)
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)

    # End conditions
    end_date: Optional[datetime] = Field(default=None)
    max_occurrences: Optional[int] = Field(default=None, ge=1)

    # State tracking
    occurrences_count: int = Field(default=0)
    next_occurrence: Optional[datetime] = Field(default=None, index=True)
    last_spawned_at: Optional[datetime] = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = Field(default=None, index=True)
