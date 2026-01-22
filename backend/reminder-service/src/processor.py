"""ReminderProcessor for handling due reminders.

TASK-035: Implement ReminderProcessor class
REQ-002: Due Dates & Time Reminders
COMP-003: Reminder Service
"""

import httpx
import logging
from datetime import datetime, timezone
from sqlmodel import Session, select

from src.models.reminder import Reminder

logger = logging.getLogger(__name__)


class ReminderProcessor:
    """Processes due reminders and publishes notifications to Kafka."""

    def __init__(self, dapr_port: int = 3500):
        self.dapr_url = f"http://localhost:{dapr_port}"
        self.client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        await self.client.aclose()

    async def process_due_reminders(self, session: Session) -> int:
        """Process all due reminders.

        Args:
            session: Database session

        Returns:
            Number of reminders sent
        """
        now = datetime.now(timezone.utc)

        # Find unsent, uncancelled reminders that are due
        reminders = session.exec(
            select(Reminder).where(
                Reminder.trigger_at <= now,
                Reminder.sent_at.is_(None),
                Reminder.cancelled_at.is_(None)
            )
        ).all()

        sent_count = 0

        for reminder in reminders:
            try:
                await self._send_reminder(reminder)
                reminder.sent_at = now
                session.add(reminder)
                sent_count += 1
                logger.info(f"Sent reminder {reminder.id} for task {reminder.task_id}")
            except Exception as e:
                logger.error(f"Failed to send reminder {reminder.id}: {e}")

        session.commit()
        return sent_count

    async def _send_reminder(self, reminder: Reminder):
        """Send a reminder notification via Kafka.

        Args:
            reminder: Reminder to send
        """
        # Get task details via Dapr service invocation
        task_title = "Task"
        try:
            response = await self.client.get(
                f"{self.dapr_url}/v1.0/invoke/task-service/method/api/todos/{reminder.task_id}",
                headers={"X-User-Id": reminder.user_id}
            )
            if response.status_code == 200:
                task_title = response.json().get("title", "Task")
        except Exception as e:
            logger.warning(f"Could not fetch task details: {e}")

        # Publish reminder event to Kafka
        event = {
            "event_type": "reminder.triggered",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "reminder_id": reminder.id,
                "task_id": reminder.task_id,
                "task_title": task_title,
                "user_id": reminder.user_id,
                "trigger_at": reminder.trigger_at.isoformat()
            }
        }

        response = await self.client.post(
            f"{self.dapr_url}/v1.0/publish/kafka-pubsub/reminders",
            json=event,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
