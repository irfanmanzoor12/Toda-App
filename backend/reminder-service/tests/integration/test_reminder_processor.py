"""
TASK-068 (extended): Integration tests for Reminder Service
Tests reminder processing and notification publishing

Refs: REQ-002, COMP-003
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

from src.models.reminder import Reminder
from src.processor import ReminderProcessor


@pytest.fixture
def processor():
    """ReminderProcessor with mocked HTTP client."""
    proc = ReminderProcessor(dapr_port=3500)
    proc.client = AsyncMock()
    return proc


@pytest.fixture
def mock_session():
    """Mock database session."""
    session = MagicMock()
    session.exec = MagicMock()
    session.add = MagicMock()
    session.commit = MagicMock()
    return session


@pytest.fixture
def due_reminder():
    """A reminder that is due (trigger_at in the past, not sent/cancelled)."""
    return Reminder(
        id=1,
        task_id=100,
        user_id="user-123",
        trigger_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        sent_at=None,
        cancelled_at=None,
    )


@pytest.fixture
def future_reminder():
    """A reminder that is not yet due."""
    return Reminder(
        id=2,
        task_id=101,
        user_id="user-123",
        trigger_at=datetime.now(timezone.utc) + timedelta(hours=1),
        sent_at=None,
        cancelled_at=None,
    )


@pytest.fixture
def sent_reminder():
    """A reminder that was already sent."""
    return Reminder(
        id=3,
        task_id=102,
        user_id="user-123",
        trigger_at=datetime.now(timezone.utc) - timedelta(hours=1),
        sent_at=datetime.now(timezone.utc) - timedelta(minutes=30),
        cancelled_at=None,
    )


@pytest.fixture
def cancelled_reminder():
    """A reminder that was cancelled."""
    return Reminder(
        id=4,
        task_id=103,
        user_id="user-123",
        trigger_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        sent_at=None,
        cancelled_at=datetime.now(timezone.utc) - timedelta(minutes=10),
    )


class TestProcessDueReminders:
    """Test process_due_reminders() end-to-end."""

    async def test_processes_due_reminders(self, processor, due_reminder, mock_session):
        """Test: finds and sends due reminders."""
        mock_session.exec.return_value.all.return_value = [due_reminder]

        # Mock task fetch
        task_response = MagicMock(status_code=200)
        task_response.json.return_value = {"title": "Buy groceries"}
        processor.client.get = AsyncMock(return_value=task_response)

        # Mock Kafka publish
        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        count = await processor.process_due_reminders(mock_session)

        assert count == 1
        assert due_reminder.sent_at is not None
        mock_session.add.assert_called_once_with(due_reminder)
        mock_session.commit.assert_called_once()

    async def test_no_due_reminders_returns_zero(self, processor, mock_session):
        """Test: no due reminders returns 0."""
        mock_session.exec.return_value.all.return_value = []

        count = await processor.process_due_reminders(mock_session)

        assert count == 0
        mock_session.commit.assert_called_once()

    async def test_multiple_due_reminders(self, processor, mock_session):
        """Test: processes multiple due reminders."""
        reminders = [
            Reminder(
                id=i,
                task_id=100 + i,
                user_id="user-123",
                trigger_at=datetime.now(timezone.utc) - timedelta(minutes=i),
                sent_at=None,
                cancelled_at=None,
            )
            for i in range(1, 4)
        ]
        mock_session.exec.return_value.all.return_value = reminders

        task_response = MagicMock(status_code=200)
        task_response.json.return_value = {"title": "Task"}
        processor.client.get = AsyncMock(return_value=task_response)

        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        count = await processor.process_due_reminders(mock_session)

        assert count == 3
        assert all(r.sent_at is not None for r in reminders)

    async def test_handles_send_failure_gracefully(self, processor, mock_session):
        """Test: continues processing after send failure."""
        reminder1 = Reminder(
            id=1, task_id=100, user_id="user-123",
            trigger_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            sent_at=None, cancelled_at=None,
        )
        reminder2 = Reminder(
            id=2, task_id=101, user_id="user-123",
            trigger_at=datetime.now(timezone.utc) - timedelta(minutes=3),
            sent_at=None, cancelled_at=None,
        )
        mock_session.exec.return_value.all.return_value = [reminder1, reminder2]

        # First task fetch fails, second succeeds
        call_count = 0

        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Service unavailable")
            response = MagicMock(status_code=200)
            response.json.return_value = {"title": "Task 2"}
            return response

        processor.client.get = mock_get

        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        count = await processor.process_due_reminders(mock_session)

        # Only second reminder sent successfully
        assert count == 1
        assert reminder1.sent_at is None
        assert reminder2.sent_at is not None


class TestSendReminder:
    """Test _send_reminder() event publishing."""

    async def test_publishes_reminder_triggered_event(self, processor, due_reminder):
        """Test: publishes reminder.triggered event to Kafka."""
        task_response = MagicMock(status_code=200)
        task_response.json.return_value = {"title": "Buy groceries"}
        processor.client.get = AsyncMock(return_value=task_response)

        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        await processor._send_reminder(due_reminder)

        processor.client.post.assert_called_once()
        call_args = processor.client.post.call_args

        # Verify targets reminders topic
        assert "kafka-pubsub/reminders" in call_args[0][0]

        # Verify event payload
        payload = call_args[1]["json"]
        assert payload["event_type"] == "reminder.triggered"
        assert payload["data"]["reminder_id"] == 1
        assert payload["data"]["task_id"] == 100
        assert payload["data"]["task_title"] == "Buy groceries"
        assert payload["data"]["user_id"] == "user-123"

    async def test_sends_with_fallback_title_on_task_fetch_failure(self, processor, due_reminder):
        """Test: uses fallback title 'Task' when task fetch fails."""
        processor.client.get = AsyncMock(side_effect=Exception("Service down"))

        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        await processor._send_reminder(due_reminder)

        payload = processor.client.post.call_args[1]["json"]
        assert payload["data"]["task_title"] == "Task"

    async def test_event_includes_trigger_at(self, processor, due_reminder):
        """Test: event payload includes trigger_at timestamp."""
        task_response = MagicMock(status_code=200)
        task_response.json.return_value = {"title": "Test"}
        processor.client.get = AsyncMock(return_value=task_response)

        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        await processor._send_reminder(due_reminder)

        payload = processor.client.post.call_args[1]["json"]
        assert payload["data"]["trigger_at"] == due_reminder.trigger_at.isoformat()

    async def test_publish_failure_raises(self, processor, due_reminder):
        """Test: Kafka publish failure raises exception."""
        task_response = MagicMock(status_code=200)
        task_response.json.return_value = {"title": "Test"}
        processor.client.get = AsyncMock(return_value=task_response)

        publish_response = MagicMock(status_code=500)
        publish_response.raise_for_status.side_effect = Exception("Kafka error")
        processor.client.post = AsyncMock(return_value=publish_response)

        with pytest.raises(Exception, match="Kafka error"):
            await processor._send_reminder(due_reminder)


class TestReminderProcessorLifecycle:
    """Test processor initialization and cleanup."""

    async def test_close_closes_client(self):
        """Test: close() properly closes the HTTP client."""
        proc = ReminderProcessor()
        proc.client = AsyncMock()
        await proc.close()
        proc.client.aclose.assert_called_once()

    def test_default_dapr_url(self):
        """Test: default config uses port 3500."""
        proc = ReminderProcessor()
        assert "3500" in proc.dapr_url

    def test_custom_dapr_port(self):
        """Test: custom port is applied."""
        proc = ReminderProcessor(dapr_port=3600)
        assert "3600" in proc.dapr_url
