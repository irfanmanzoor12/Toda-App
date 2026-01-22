"""Pydantic schemas for Task/Todo API.

TASK-010: Update Task model with new fields
REQ-002, REQ-003, REQ-004: Due dates, priorities, tags
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

from src.models.todo import PriorityEnum


class TaskBase(BaseModel):
    """Base schema for Task with common fields."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: PriorityEnum = Field(default=PriorityEnum.medium)
    due_date: Optional[datetime] = None
    reminder_schedule: Optional[List[str]] = Field(
        None,
        description="List of reminder offsets (e.g., ['1h', '1d', '1w'])"
    )


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    tags: Optional[List[str]] = Field(
        None,
        description="List of tag names to associate with the task"
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tag names."""
        if v is not None:
            # Remove duplicates and empty strings
            v = [tag.strip() for tag in v if tag.strip()]
            # Limit tag name length
            for tag in v:
                if len(tag) > 50:
                    raise ValueError(f"Tag name too long: {tag}")
        return v


class TaskUpdate(BaseModel):
    """Schema for updating an existing task (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    completed: Optional[bool] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[datetime] = None
    reminder_schedule: Optional[List[str]] = None
    tags: Optional[List[str]] = None

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tag names."""
        if v is not None:
            v = [tag.strip() for tag in v if tag.strip()]
            for tag in v:
                if len(tag) > 50:
                    raise ValueError(f"Tag name too long: {tag}")
        return v


class TagResponse(BaseModel):
    """Schema for tag in API response."""
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    """Schema for task in API response."""
    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    priority: str
    due_date: Optional[datetime]
    reminder_schedule: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = Field(default_factory=list)

    # Computed fields
    is_overdue: bool = Field(default=False)

    class Config:
        from_attributes = True

    def __init__(self, **data):
        """Initialize and compute is_overdue."""
        super().__init__(**data)
        if self.due_date and not self.completed:
            self.is_overdue = self.due_date < datetime.now(self.due_date.tzinfo)


class TaskListResponse(BaseModel):
    """Schema for paginated task list."""
    tasks: List[TaskResponse]
    total: int
    limit: int
    offset: int


class TaskSearchResponse(BaseModel):
    """Schema for search results with relevance."""
    task: TaskResponse
    relevance: Optional[float] = Field(None, description="Search relevance score")

    class Config:
        from_attributes = True
