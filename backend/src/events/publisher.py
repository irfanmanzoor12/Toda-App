"""Event Publisher for Kafka via Dapr Pub/Sub.

TASK-012: Implement EventPublisher class for Kafka via Dapr
REQ-006: Event-Driven Architecture with Kafka
COMP-001: Task Service (Enhanced)
"""

import httpx
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Event types for task operations."""
    TASK_CREATED = "task.created"
    TASK_UPDATED = "task.updated"
    TASK_COMPLETED = "task.completed"
    TASK_DELETED = "task.deleted"
    TASK_PRIORITY_CHANGED = "task.priority_changed"
    TASK_DUE_DATE_SET = "task.due_date_set"
    TASK_TAGGED = "task.tagged"
    TASK_UNTAGGED = "task.untagged"


class EventPublisher:
    """Publishes events to Kafka via Dapr Pub/Sub HTTP API.

    Dapr Pub/Sub abstracts Kafka complexity and provides:
    - Automatic retry with exponential backoff
    - Dead letter queue for failed events
    - At-least-once delivery guarantee
    """

    def __init__(self, dapr_port: int = 3500, pubsub_name: str = "kafka-pubsub"):
        """Initialize EventPublisher.

        Args:
            dapr_port: Dapr HTTP port (default: 3500)
            pubsub_name: Dapr Pub/Sub component name (default: kafka-pubsub)
        """
        self.dapr_url = f"http://localhost:{dapr_port}/v1.0/publish"
        self.pubsub_name = pubsub_name
        self.client = httpx.AsyncClient(timeout=5.0)

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def publish_event(
        self,
        topic: str,
        event_type: EventType,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, str]] = None
    ) -> bool:
        """Publish an event to Kafka via Dapr Pub/Sub.

        Args:
            topic: Kafka topic name (e.g., "task-events")
            event_type: Type of event
            data: Event payload
            metadata: Optional Dapr metadata (for custom headers, etc.)

        Returns:
            True if published successfully, False otherwise

        Raises:
            httpx.HTTPStatusError: If Dapr returns non-2xx status
        """
        event = {
            "event_type": event_type.value,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }

        url = f"{self.dapr_url}/{self.pubsub_name}/{topic}"

        try:
            logger.info(f"Publishing event {event_type.value} to topic {topic}")

            response = await self.client.post(
                url,
                json=event,
                headers={"Content-Type": "application/json"}
            )

            response.raise_for_status()
            logger.info(f"Successfully published event {event_type.value}")
            return True

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to publish event: {e.response.status_code} - {e.response.text}")
            raise

        except httpx.RequestError as e:
            logger.error(f"Request error while publishing event: {str(e)}")
            raise

        except Exception as e:
            logger.error(f"Unexpected error publishing event: {str(e)}")
            raise

    # Convenience methods for specific event types

    async def publish_task_created(
        self,
        task_id: int,
        user_id: str,
        title: str,
        description: Optional[str],
        priority: str,
        tags: list[str],
        due_date: Optional[datetime],
        created_at: datetime
    ) -> bool:
        """Publish task.created event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_CREATED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "title": title,
                "description": description,
                "priority": priority,
                "tags": tags,
                "due_date": due_date.isoformat() if due_date else None,
                "created_at": created_at.isoformat()
            }
        )

    async def publish_task_updated(
        self,
        task_id: int,
        user_id: str,
        changes: Dict[str, Dict[str, Any]]
    ) -> bool:
        """Publish task.updated event with diff of changes.

        Args:
            task_id: Task ID
            user_id: User ID
            changes: Dict of field_name -> {"old": old_value, "new": new_value}
        """
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_UPDATED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "changes": changes,
                "updated_at": datetime.utcnow().isoformat()
            }
        )

    async def publish_task_completed(
        self,
        task_id: int,
        user_id: str,
        completed_at: datetime
    ) -> bool:
        """Publish task.completed event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_COMPLETED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "completed_at": completed_at.isoformat()
            }
        )

    async def publish_task_deleted(
        self,
        task_id: int,
        user_id: str,
        deleted_at: datetime
    ) -> bool:
        """Publish task.deleted event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_DELETED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "deleted_at": deleted_at.isoformat()
            }
        )

    async def publish_task_priority_changed(
        self,
        task_id: int,
        user_id: str,
        old_priority: str,
        new_priority: str
    ) -> bool:
        """Publish task.priority_changed event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_PRIORITY_CHANGED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "old_priority": old_priority,
                "new_priority": new_priority,
                "changed_at": datetime.utcnow().isoformat()
            }
        )

    async def publish_task_due_date_set(
        self,
        task_id: int,
        user_id: str,
        due_date: datetime,
        reminder_schedule: Optional[list[str]]
    ) -> bool:
        """Publish task.due_date_set event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_DUE_DATE_SET,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "due_date": due_date.isoformat(),
                "reminder_schedule": reminder_schedule,
                "set_at": datetime.utcnow().isoformat()
            }
        )

    async def publish_task_tagged(
        self,
        task_id: int,
        user_id: str,
        tags_added: list[str]
    ) -> bool:
        """Publish task.tagged event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_TAGGED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "tags_added": tags_added,
                "tagged_at": datetime.utcnow().isoformat()
            }
        )

    async def publish_task_untagged(
        self,
        task_id: int,
        user_id: str,
        tag_removed: str
    ) -> bool:
        """Publish task.untagged event."""
        return await self.publish_event(
            topic="task-events",
            event_type=EventType.TASK_UNTAGGED,
            data={
                "task_id": task_id,
                "user_id": user_id,
                "tag_removed": tag_removed,
                "untagged_at": datetime.utcnow().isoformat()
            }
        )


# Global instance (created at app startup)
_event_publisher: Optional[EventPublisher] = None


def get_event_publisher() -> EventPublisher:
    """Get the global EventPublisher instance.

    Returns:
        EventPublisher instance

    Raises:
        RuntimeError: If publisher not initialized
    """
    global _event_publisher
    if _event_publisher is None:
        raise RuntimeError("EventPublisher not initialized. Call init_event_publisher() at app startup.")
    return _event_publisher


def init_event_publisher(dapr_port: int = 3500, pubsub_name: str = "kafka-pubsub"):
    """Initialize the global EventPublisher instance.

    Should be called at application startup.
    """
    global _event_publisher
    _event_publisher = EventPublisher(dapr_port=dapr_port, pubsub_name=pubsub_name)
    logger.info(f"EventPublisher initialized with Dapr port {dapr_port}, pubsub {pubsub_name}")


async def close_event_publisher():
    """Close the global EventPublisher instance.

    Should be called at application shutdown.
    """
    global _event_publisher
    if _event_publisher:
        await _event_publisher.close()
        logger.info("EventPublisher closed")
