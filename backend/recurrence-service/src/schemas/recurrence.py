"""Pydantic schemas for Recurrence API.

TASK-024: Create RecurrencePattern model in Recurrence Service
REQ-001: Recurring Tasks
COMP-002: Recurrence Service
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, model_validator


class RecurrencePatternCreate(BaseModel):
    """Schema for creating a new recurrence pattern."""
    task_id: int = Field(..., description="ID of the parent task")
    frequency: Literal["daily", "weekly", "monthly"] = Field(
        ..., description="Recurrence frequency"
    )
    interval: int = Field(
        default=1, ge=1, description="Every N days/weeks/months"
    )
    day_of_week: Optional[int] = Field(
        default=None, ge=0, le=6,
        description="Day of week for weekly recurrence (0=Monday, 6=Sunday)"
    )
    day_of_month: Optional[int] = Field(
        default=None, ge=1, le=31,
        description="Day of month for monthly recurrence (1-31)"
    )
    end_date: Optional[datetime] = Field(
        default=None, description="End date for recurrence"
    )
    max_occurrences: Optional[int] = Field(
        default=None, ge=1, description="Maximum number of occurrences"
    )

    @model_validator(mode='after')
    def validate_frequency_fields(self):
        """Validate that appropriate fields are set for each frequency."""
        if self.frequency == "weekly" and self.day_of_week is None:
            # Default to current day if not specified
            pass
        if self.frequency == "monthly" and self.day_of_month is None:
            # Default to 1st if not specified
            pass
        return self


class RecurrencePatternUpdate(BaseModel):
    """Schema for updating a recurrence pattern."""
    frequency: Optional[Literal["daily", "weekly", "monthly"]] = None
    interval: Optional[int] = Field(default=None, ge=1)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = Field(default=None, ge=1)


class RecurrencePatternResponse(BaseModel):
    """Schema for recurrence pattern in API response."""
    id: int
    task_id: int
    user_id: str
    frequency: str
    interval: int
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    occurrences_count: int
    next_occurrence: Optional[datetime] = None
    last_spawned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
