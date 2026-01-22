"""Pydantic schemas for Tag API.

TASK-011: Create Tag and TaskTag models
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    """Schema for creating a new tag."""
    name: str = Field(..., min_length=1, max_length=50)


class TagResponse(BaseModel):
    """Schema for tag in API response."""
    id: int
    name: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TagWithCount(BaseModel):
    """Schema for tag with usage count."""
    id: int
    name: str
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True
