"""RecurrenceProcessor for handling recurring task spawning.

TASK-026: Implement RecurrenceProcessor class
REQ-001: Recurring Tasks
COMP-002: Recurrence Service
"""

import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlmodel import Session, select

from src.models.recurrence_pattern import RecurrencePattern

logger = logging.getLogger(__name__)


class RecurrenceProcessor:
    """Processes due recurrence patterns and spawns new task instances.

    Uses Dapr service invocation to create new tasks in the Task Service.
    Publishes task.spawned events to Kafka via Dapr Pub/Sub.
    """

    def __init__(self, dapr_port: int = 3500):
        """Initialize processor.

        Args:
            dapr_port: Dapr sidecar HTTP port (default: 3500)
        """
        self.dapr_url = f"http://localhost:{dapr_port}"
        self.client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def process_due_recurrences(self, session: Session) -> int:
        """Process all due recurrence patterns and spawn task instances.

        Args:
            session: Database session

        Returns:
            Number of tasks spawned
        """
        now = datetime.now(timezone.utc)

        # Find all patterns with next_occurrence <= now
        patterns = session.exec(
            select(RecurrencePattern).where(
                RecurrencePattern.next_occurrence <= now,
                RecurrencePattern.deleted_at.is_(None)
            )
        ).all()

        spawned_count = 0

        for pattern in patterns:
            if self._should_spawn(pattern, now):
                try:
                    await self._spawn_task_instance(pattern, session)
                    spawned_count += 1

                    # Update pattern state
                    pattern.occurrences_count += 1
                    pattern.last_spawned_at = now
                    pattern.next_occurrence = self._calculate_next_occurrence(pattern)
                    pattern.updated_at = now

                    session.add(pattern)
                    logger.info(f"Spawned task instance for pattern {pattern.id}")

                except Exception as e:
                    logger.error(f"Failed to spawn task for pattern {pattern.id}: {e}")

        session.commit()
        return spawned_count

    def _should_spawn(self, pattern: RecurrencePattern, now: datetime) -> bool:
        """Check if a pattern should spawn a new task instance.

        Args:
            pattern: Recurrence pattern
            now: Current timestamp

        Returns:
            True if should spawn, False otherwise
        """
        # Check end date
        if pattern.end_date and now >= pattern.end_date:
            return False

        # Check max occurrences
        if pattern.max_occurrences and pattern.occurrences_count >= pattern.max_occurrences:
            return False

        return True

    async def _spawn_task_instance(self, pattern: RecurrencePattern, session: Session):
        """Spawn a new task instance from the recurrence pattern.

        Calls Task Service via Dapr service invocation.

        Args:
            pattern: Recurrence pattern
            session: Database session
        """
        # Get original task details via Dapr service invocation
        task_response = await self.client.get(
            f"{self.dapr_url}/v1.0/invoke/task-service/method/api/todos/{pattern.task_id}",
            headers={"X-User-Id": pattern.user_id}
        )

        if task_response.status_code != 200:
            raise Exception(f"Failed to get original task: {task_response.text}")

        original_task = task_response.json()

        # Create new task instance
        new_task_data = {
            "title": f"{original_task['title']} (Recurring)",
            "description": original_task.get("description"),
            "priority": original_task.get("priority", "medium"),
            "tags": original_task.get("tags", [])
        }

        # Calculate new due date if original had one
        if original_task.get("due_date"):
            new_due = self._calculate_next_occurrence(pattern)
            if new_due:
                new_task_data["due_date"] = new_due.isoformat()

        # Create task via Dapr service invocation
        create_response = await self.client.post(
            f"{self.dapr_url}/v1.0/invoke/task-service/method/api/todos",
            json=new_task_data,
            headers={
                "Content-Type": "application/json",
                "X-User-Id": pattern.user_id
            }
        )

        if create_response.status_code not in (200, 201):
            raise Exception(f"Failed to create task: {create_response.text}")

        created_task = create_response.json()

        # Publish task.spawned event via Dapr Pub/Sub
        await self._publish_task_spawned_event(
            pattern_id=pattern.id,
            parent_task_id=pattern.task_id,
            spawned_task_id=created_task["id"],
            user_id=pattern.user_id
        )

        return created_task

    def _calculate_next_occurrence(self, pattern: RecurrencePattern) -> Optional[datetime]:
        """Calculate the next occurrence datetime.

        Args:
            pattern: Recurrence pattern

        Returns:
            Next occurrence datetime, or None if no more occurrences
        """
        base = pattern.next_occurrence or datetime.now(timezone.utc)

        if pattern.frequency == "daily":
            next_dt = base + timedelta(days=pattern.interval)

        elif pattern.frequency == "weekly":
            next_dt = base + timedelta(weeks=pattern.interval)
            if pattern.day_of_week is not None:
                # Adjust to the specified day of week
                days_ahead = pattern.day_of_week - next_dt.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                next_dt = next_dt + timedelta(days=days_ahead)

        elif pattern.frequency == "monthly":
            # Add months
            month = base.month + pattern.interval
            year = base.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1

            day = pattern.day_of_month or base.day
            # Handle months with fewer days
            import calendar
            max_day = calendar.monthrange(year, month)[1]
            day = min(day, max_day)

            next_dt = base.replace(year=year, month=month, day=day)

        else:
            return None

        # Check if next occurrence is past end date
        if pattern.end_date and next_dt >= pattern.end_date:
            return None

        return next_dt

    async def _publish_task_spawned_event(
        self,
        pattern_id: int,
        parent_task_id: int,
        spawned_task_id: int,
        user_id: str
    ):
        """Publish task.spawned event to Kafka via Dapr Pub/Sub.

        Args:
            pattern_id: Recurrence pattern ID
            parent_task_id: Original task ID
            spawned_task_id: Newly created task ID
            user_id: User ID
        """
        event = {
            "event_type": "task.spawned",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "pattern_id": pattern_id,
                "parent_task_id": parent_task_id,
                "spawned_task_id": spawned_task_id,
                "user_id": user_id
            }
        }

        try:
            response = await self.client.post(
                f"{self.dapr_url}/v1.0/publish/kafka-pubsub/task-events",
                json=event,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            logger.info(f"Published task.spawned event for task {spawned_task_id}")
        except Exception as e:
            logger.error(f"Failed to publish task.spawned event: {e}")
