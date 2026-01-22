"""
TASK-067: Integration tests for Task Service with Kafka
Tests event publishing via Dapr Pub/Sub
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

# Test fixtures
@pytest.fixture
def mock_dapr_client():
    """Mock Dapr HTTP client for pub/sub."""
    with patch('httpx.AsyncClient') as mock:
        client = AsyncMock()
        client.post = AsyncMock(return_value=MagicMock(status_code=204))
        mock.return_value.__aenter__.return_value = client
        yield client


@pytest.fixture
def sample_task():
    """Sample task data for testing."""
    return {
        "id": 1,
        "title": "Test Task",
        "description": "Test description",
        "priority": "high",
        "status": "pending",
        "completed": False,
        "user_id": "user-123",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


class TestEventPublishing:
    """Test suite for Kafka event publishing via Dapr."""

    @pytest.mark.asyncio
    async def test_publish_task_created_event(self, mock_dapr_client, sample_task):
        """Test: create task → verify event published."""
        from src.events.publisher import EventPublisher

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events"
        )

        # Publish event
        await publisher.publish_task_created(sample_task)

        # Verify Dapr was called
        mock_dapr_client.post.assert_called_once()
        call_args = mock_dapr_client.post.call_args

        # Verify URL
        assert "v1.0/publish/kafka-pubsub/task-events" in call_args[0][0]

        # Verify payload
        payload = json.loads(call_args[1]["content"])
        assert payload["event_type"] == "task.created"
        assert payload["data"]["id"] == sample_task["id"]
        assert payload["data"]["title"] == sample_task["title"]

    @pytest.mark.asyncio
    async def test_publish_task_updated_event_with_diff(self, mock_dapr_client, sample_task):
        """Test: update task → verify event with diff."""
        from src.events.publisher import EventPublisher

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events"
        )

        old_values = {"title": "Old Title", "priority": "low"}
        new_values = {"title": "New Title", "priority": "high"}

        await publisher.publish_task_updated(
            task=sample_task,
            old_values=old_values,
            new_values=new_values
        )

        mock_dapr_client.post.assert_called_once()
        call_args = mock_dapr_client.post.call_args
        payload = json.loads(call_args[1]["content"])

        assert payload["event_type"] == "task.updated"
        assert "changes" in payload["data"]
        assert payload["data"]["changes"]["title"]["old"] == "Old Title"
        assert payload["data"]["changes"]["title"]["new"] == "New Title"

    @pytest.mark.asyncio
    async def test_publish_task_completed_event(self, mock_dapr_client, sample_task):
        """Test: complete task → verify event published."""
        from src.events.publisher import EventPublisher

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events"
        )

        sample_task["completed"] = True
        sample_task["status"] = "complete"

        await publisher.publish_task_completed(sample_task)

        mock_dapr_client.post.assert_called_once()
        call_args = mock_dapr_client.post.call_args
        payload = json.loads(call_args[1]["content"])

        assert payload["event_type"] == "task.completed"
        assert payload["data"]["completed"] is True

    @pytest.mark.asyncio
    async def test_publish_task_deleted_event(self, mock_dapr_client, sample_task):
        """Test: delete task → verify event published."""
        from src.events.publisher import EventPublisher

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events"
        )

        await publisher.publish_task_deleted(task_id=1, user_id="user-123")

        mock_dapr_client.post.assert_called_once()
        call_args = mock_dapr_client.post.call_args
        payload = json.loads(call_args[1]["content"])

        assert payload["event_type"] == "task.deleted"
        assert payload["data"]["task_id"] == 1

    @pytest.mark.asyncio
    async def test_publish_priority_changed_event(self, mock_dapr_client, sample_task):
        """Test: change priority → verify event published."""
        from src.events.publisher import EventPublisher

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events"
        )

        await publisher.publish_priority_changed(
            task=sample_task,
            old_priority="low",
            new_priority="critical"
        )

        mock_dapr_client.post.assert_called_once()
        call_args = mock_dapr_client.post.call_args
        payload = json.loads(call_args[1]["content"])

        assert payload["event_type"] == "task.priority_changed"
        assert payload["data"]["old_priority"] == "low"
        assert payload["data"]["new_priority"] == "critical"

    @pytest.mark.asyncio
    async def test_retry_on_failure(self, mock_dapr_client, sample_task):
        """Test: retry logic on publish failure."""
        from src.events.publisher import EventPublisher

        # First two calls fail, third succeeds
        mock_dapr_client.post.side_effect = [
            Exception("Connection refused"),
            Exception("Timeout"),
            MagicMock(status_code=204)
        ]

        publisher = EventPublisher(
            dapr_host="localhost",
            dapr_port=3500,
            pubsub_name="kafka-pubsub",
            topic_name="task-events",
            max_retries=3
        )

        # Should succeed after retries
        await publisher.publish_task_created(sample_task)

        assert mock_dapr_client.post.call_count == 3


class TestEventPublisherWithTestcontainers:
    """
    Integration tests using testcontainers for real Kafka.
    These tests require Docker and are slower.
    Run with: pytest -m integration
    """

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_kafka_publish(self):
        """Test publishing to real Kafka using testcontainers."""
        pytest.skip("Requires testcontainers setup - run manually")

        # This would use testcontainers-python to spin up Kafka
        # from testcontainers.kafka import KafkaContainer
        #
        # with KafkaContainer() as kafka:
        #     bootstrap_server = kafka.get_bootstrap_server()
        #     # ... test actual Kafka publishing
