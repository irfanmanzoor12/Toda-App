"""
TASK-067: Integration tests for Task Service with Kafka
Tests event publishing via Dapr Pub/Sub

Refs: REQ-006, COMP-001
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from src.events.publisher import EventPublisher, EventType


@pytest.fixture
def publisher(mock_httpx_client):
    """EventPublisher with mocked HTTP client."""
    pub = EventPublisher(dapr_port=3500, pubsub_name="kafka-pubsub")
    pub.client = mock_httpx_client
    mock_httpx_client.post.return_value = MagicMock(status_code=204)
    return pub


@pytest.fixture
def sample_task_data():
    """Sample task data for testing."""
    return {
        "task_id": 1,
        "user_id": "user-123",
        "title": "Test Task",
        "description": "Test description",
        "priority": "high",
        "tags": ["work", "urgent"],
        "due_date": datetime(2026, 2, 15, 10, 0, 0, tzinfo=timezone.utc),
        "created_at": datetime(2026, 2, 1, 10, 0, 0, tzinfo=timezone.utc),
    }


class TestEventPublishing:
    """Test suite for Kafka event publishing via Dapr."""

    async def test_publish_task_created_event(self, publisher, sample_task_data, mock_httpx_client):
        """Test: create task -> verify event published to Kafka."""
        await publisher.publish_task_created(
            task_id=sample_task_data["task_id"],
            user_id=sample_task_data["user_id"],
            title=sample_task_data["title"],
            description=sample_task_data["description"],
            priority=sample_task_data["priority"],
            tags=sample_task_data["tags"],
            due_date=sample_task_data["due_date"],
            created_at=sample_task_data["created_at"],
        )

        mock_httpx_client.post.assert_called_once()
        call_args = mock_httpx_client.post.call_args

        # Verify URL targets correct pubsub and topic
        assert "kafka-pubsub/task-events" in call_args[1].get("url", call_args[0][0])

        # Verify payload
        payload = call_args[1]["json"]
        assert payload["event_type"] == "task.created"
        assert payload["data"]["task_id"] == 1
        assert payload["data"]["title"] == "Test Task"
        assert payload["data"]["priority"] == "high"
        assert payload["data"]["tags"] == ["work", "urgent"]

    async def test_publish_task_updated_event_with_diff(self, publisher, mock_httpx_client):
        """Test: update task -> verify event with change diff."""
        changes = {
            "title": {"old": "Old Title", "new": "New Title"},
            "priority": {"old": "low", "new": "high"},
        }

        await publisher.publish_task_updated(
            task_id=1,
            user_id="user-123",
            changes=changes,
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.updated"
        assert payload["data"]["changes"]["title"]["old"] == "Old Title"
        assert payload["data"]["changes"]["title"]["new"] == "New Title"
        assert payload["data"]["changes"]["priority"]["old"] == "low"
        assert payload["data"]["changes"]["priority"]["new"] == "high"

    async def test_publish_task_completed_event(self, publisher, mock_httpx_client):
        """Test: complete task -> verify event published."""
        completed_at = datetime(2026, 2, 7, 12, 0, 0, tzinfo=timezone.utc)

        await publisher.publish_task_completed(
            task_id=1,
            user_id="user-123",
            completed_at=completed_at,
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.completed"
        assert payload["data"]["task_id"] == 1
        assert payload["data"]["completed_at"] == completed_at.isoformat()

    async def test_publish_task_deleted_event(self, publisher, mock_httpx_client):
        """Test: delete task -> verify event published."""
        deleted_at = datetime(2026, 2, 7, 12, 0, 0, tzinfo=timezone.utc)

        await publisher.publish_task_deleted(
            task_id=1,
            user_id="user-123",
            deleted_at=deleted_at,
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.deleted"
        assert payload["data"]["task_id"] == 1

    async def test_publish_priority_changed_event(self, publisher, mock_httpx_client):
        """Test: change priority -> verify event published."""
        await publisher.publish_task_priority_changed(
            task_id=1,
            user_id="user-123",
            old_priority="low",
            new_priority="critical",
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.priority_changed"
        assert payload["data"]["old_priority"] == "low"
        assert payload["data"]["new_priority"] == "critical"

    async def test_publish_due_date_set_event(self, publisher, mock_httpx_client):
        """Test: set due date -> verify event published."""
        due_date = datetime(2026, 3, 1, 10, 0, 0, tzinfo=timezone.utc)

        await publisher.publish_task_due_date_set(
            task_id=1,
            user_id="user-123",
            due_date=due_date,
            reminder_schedule=["1h", "1d"],
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.due_date_set"
        assert payload["data"]["due_date"] == due_date.isoformat()
        assert payload["data"]["reminder_schedule"] == ["1h", "1d"]

    async def test_publish_task_tagged_event(self, publisher, mock_httpx_client):
        """Test: add tags -> verify event published."""
        await publisher.publish_task_tagged(
            task_id=1,
            user_id="user-123",
            tags_added=["work", "urgent"],
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.tagged"
        assert payload["data"]["tags_added"] == ["work", "urgent"]

    async def test_publish_task_untagged_event(self, publisher, mock_httpx_client):
        """Test: remove tag -> verify event published."""
        await publisher.publish_task_untagged(
            task_id=1,
            user_id="user-123",
            tag_removed="urgent",
        )

        mock_httpx_client.post.assert_called_once()
        payload = mock_httpx_client.post.call_args[1]["json"]

        assert payload["event_type"] == "task.untagged"
        assert payload["data"]["tag_removed"] == "urgent"

    async def test_publish_event_includes_timestamp(self, publisher, mock_httpx_client):
        """Test: all events include a timestamp field."""
        await publisher.publish_task_deleted(
            task_id=1,
            user_id="user-123",
            deleted_at=datetime.now(timezone.utc),
        )

        payload = mock_httpx_client.post.call_args[1]["json"]
        assert "timestamp" in payload

    async def test_publish_event_http_error_raises(self, publisher, mock_httpx_client):
        """Test: HTTP error from Dapr raises exception."""
        import httpx

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server Error", request=MagicMock(), response=mock_response
        )
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(httpx.HTTPStatusError):
            await publisher.publish_task_created(
                task_id=1,
                user_id="user-123",
                title="Test",
                description=None,
                priority="medium",
                tags=[],
                due_date=None,
                created_at=datetime.now(timezone.utc),
            )

    async def test_publish_event_request_error_raises(self, publisher, mock_httpx_client):
        """Test: connection error raises exception."""
        import httpx

        mock_httpx_client.post.side_effect = httpx.RequestError("Connection refused")

        with pytest.raises(httpx.RequestError):
            await publisher.publish_task_created(
                task_id=1,
                user_id="user-123",
                title="Test",
                description=None,
                priority="medium",
                tags=[],
                due_date=None,
                created_at=datetime.now(timezone.utc),
            )


class TestEventPublisherLifecycle:
    """Test EventPublisher initialization and cleanup."""

    async def test_close_closes_client(self):
        """Test: close() properly closes the httpx client."""
        publisher = EventPublisher()
        publisher.client = AsyncMock()
        await publisher.close()
        publisher.client.aclose.assert_called_once()

    def test_default_configuration(self):
        """Test: default config uses port 3500 and kafka-pubsub."""
        publisher = EventPublisher()
        assert "3500" in publisher.dapr_url
        assert publisher.pubsub_name == "kafka-pubsub"

    def test_custom_configuration(self):
        """Test: custom config is applied."""
        publisher = EventPublisher(dapr_port=3600, pubsub_name="custom-pubsub")
        assert "3600" in publisher.dapr_url
        assert publisher.pubsub_name == "custom-pubsub"
