"""Pydantic schemas for Reminder API.

TASK-033: Create Reminder model in Reminder Service
REQ-002: Due Dates & Time Reminders
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ReminderScheduleRequest(BaseModel):
    """Schema for scheduling reminders."""
    task_id: int = Field(..., description="ID of the task")
    due_date: datetime = Field(..., description="Task due date")
    reminder_times: List[str] = Field(
        ...,
        description="Reminder times before due date: '1h', '1d', '1w'"
    )


class ReminderCreate(BaseModel):
    """Schema for creating a single reminder."""
    task_id: int
    trigger_at: datetime


class ReminderResponse(BaseModel):
    """Schema for reminder in API response."""
    id: int
    task_id: int
    user_id: str
    trigger_at: datetime
    sent_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
