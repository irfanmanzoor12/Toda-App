"""Event schemas for Kafka messages.

TASK-012: Implement EventPublisher class for Kafka via Dapr
REQ-006: Event-Driven Architecture with Kafka
COMP-001: Task Service (Enhanced)
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class BaseEvent(BaseModel):
    """Base event schema."""
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]


class TaskCreatedEvent(BaseModel):
    """Schema for task.created event."""
    task_id: int
    user_id: str
    title: str
    description: Optional[str]
    priority: str
    tags: List[str]
    due_date: Optional[str]  # ISO 8601 timestamp
    created_at: str  # ISO 8601 timestamp


class TaskUpdatedEvent(BaseModel):
    """Schema for task.updated event."""
    task_id: int
    user_id: str
    changes: Dict[str, Dict[str, Any]]  # field_name -> {old, new}
    updated_at: str  # ISO 8601 timestamp


class TaskCompletedEvent(BaseModel):
    """Schema for task.completed event."""
    task_id: int
    user_id: str
    completed_at: str  # ISO 8601 timestamp


class TaskDeletedEvent(BaseModel):
    """Schema for task.deleted event."""
    task_id: int
    user_id: str
    deleted_at: str  # ISO 8601 timestamp


class TaskPriorityChangedEvent(BaseModel):
    """Schema for task.priority_changed event."""
    task_id: int
    user_id: str
    old_priority: str
    new_priority: str
    changed_at: str  # ISO 8601 timestamp


class TaskDueDateSetEvent(BaseModel):
    """Schema for task.due_date_set event."""
    task_id: int
    user_id: str
    due_date: str  # ISO 8601 timestamp
    reminder_schedule: Optional[List[str]]
    set_at: str  # ISO 8601 timestamp


class TaskTaggedEvent(BaseModel):
    """Schema for task.tagged event."""
    task_id: int
    user_id: str
    tags_added: List[str]
    tagged_at: str  # ISO 8601 timestamp


class TaskUntaggedEvent(BaseModel):
    """Schema for task.untagged event."""
    task_id: int
    user_id: str
    tag_removed: str
    untagged_at: str  # ISO 8601 timestamp
