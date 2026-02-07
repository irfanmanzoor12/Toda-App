"""
TASK-068: Integration tests for Recurrence Service
Tests recurrence pattern processing and task spawning

Refs: REQ-001, COMP-002
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from src.models.recurrence_pattern import RecurrencePattern
from src.processor import RecurrenceProcessor


@pytest.fixture
def processor():
    """RecurrenceProcessor with mocked HTTP client."""
    proc = RecurrenceProcessor(dapr_port=3500)
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
def daily_pattern():
    """Daily recurrence pattern (due for spawning)."""
    pattern = RecurrencePattern(
        id=1,
        task_id=100,
        user_id="user-123",
        frequency="daily",
        interval=1,
        day_of_week=None,
        day_of_month=None,
        end_date=None,
        max_occurrences=None,
        occurrences_count=0,
        next_occurrence=datetime.now(timezone.utc) - timedelta(minutes=5),
        last_spawned_at=None,
        deleted_at=None,
    )
    return pattern


@pytest.fixture
def weekly_pattern():
    """Weekly recurrence pattern (every Monday)."""
    pattern = RecurrencePattern(
        id=2,
        task_id=101,
        user_id="user-123",
        frequency="weekly",
        interval=1,
        day_of_week=0,  # Monday
        day_of_month=None,
        end_date=None,
        max_occurrences=10,
        occurrences_count=2,
        next_occurrence=datetime.now(timezone.utc) - timedelta(minutes=5),
        last_spawned_at=datetime.now(timezone.utc) - timedelta(weeks=1),
        deleted_at=None,
    )
    return pattern


@pytest.fixture
def monthly_pattern():
    """Monthly recurrence pattern (15th of each month)."""
    pattern = RecurrencePattern(
        id=3,
        task_id=102,
        user_id="user-123",
        frequency="monthly",
        interval=1,
        day_of_week=None,
        day_of_month=15,
        end_date=None,
        max_occurrences=None,
        occurrences_count=3,
        next_occurrence=datetime.now(timezone.utc) - timedelta(minutes=5),
        last_spawned_at=datetime.now(timezone.utc) - timedelta(days=30),
        deleted_at=None,
    )
    return pattern


class TestShouldSpawn:
    """Test _should_spawn() logic."""

    def test_should_spawn_basic_pattern(self, processor, daily_pattern):
        """Test: basic pattern with no constraints should spawn."""
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(daily_pattern, now) is True

    def test_should_not_spawn_past_end_date(self, processor, daily_pattern):
        """Test: end_date in the past stops spawning."""
        daily_pattern.end_date = datetime.now(timezone.utc) - timedelta(days=1)
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(daily_pattern, now) is False

    def test_should_spawn_future_end_date(self, processor, daily_pattern):
        """Test: end_date in the future allows spawning."""
        daily_pattern.end_date = datetime.now(timezone.utc) + timedelta(days=30)
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(daily_pattern, now) is True

    def test_should_not_spawn_max_occurrences_reached(self, processor, weekly_pattern):
        """Test: max_occurrences reached stops spawning."""
        weekly_pattern.occurrences_count = 10
        weekly_pattern.max_occurrences = 10
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(weekly_pattern, now) is False

    def test_should_spawn_below_max_occurrences(self, processor, weekly_pattern):
        """Test: below max_occurrences allows spawning."""
        weekly_pattern.occurrences_count = 5
        weekly_pattern.max_occurrences = 10
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(weekly_pattern, now) is True

    def test_should_spawn_no_max_occurrences(self, processor, daily_pattern):
        """Test: no max_occurrences means unlimited spawning."""
        daily_pattern.occurrences_count = 1000
        daily_pattern.max_occurrences = None
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(daily_pattern, now) is True

    def test_should_not_spawn_both_constraints_hit(self, processor, weekly_pattern):
        """Test: both end_date and max_occurrences expired."""
        weekly_pattern.end_date = datetime.now(timezone.utc) - timedelta(hours=1)
        weekly_pattern.occurrences_count = 10
        weekly_pattern.max_occurrences = 10
        now = datetime.now(timezone.utc)
        assert processor._should_spawn(weekly_pattern, now) is False


class TestCalculateNextOccurrence:
    """Test _calculate_next_occurrence() for different frequencies."""

    def test_daily_next_occurrence(self, processor, daily_pattern):
        """Test: daily pattern advances by 1 day."""
        daily_pattern.next_occurrence = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        daily_pattern.interval = 1

        next_occ = processor._calculate_next_occurrence(daily_pattern)

        expected = datetime(2026, 1, 16, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_daily_interval_2(self, processor, daily_pattern):
        """Test: every 2 days pattern."""
        daily_pattern.next_occurrence = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        daily_pattern.interval = 2

        next_occ = processor._calculate_next_occurrence(daily_pattern)

        expected = datetime(2026, 1, 17, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_weekly_next_occurrence(self, processor, weekly_pattern):
        """Test: weekly pattern advances by 1 week."""
        weekly_pattern.next_occurrence = datetime(2026, 1, 13, 10, 0, 0, tzinfo=timezone.utc)  # Monday
        weekly_pattern.interval = 1
        weekly_pattern.day_of_week = None  # No specific day constraint

        next_occ = processor._calculate_next_occurrence(weekly_pattern)

        expected = datetime(2026, 1, 20, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_monthly_next_occurrence(self, processor, monthly_pattern):
        """Test: monthly pattern advances by 1 month."""
        monthly_pattern.next_occurrence = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        monthly_pattern.interval = 1

        next_occ = processor._calculate_next_occurrence(monthly_pattern)

        expected = datetime(2026, 2, 15, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_monthly_end_of_month_clamp(self, processor, monthly_pattern):
        """Test: monthly pattern clamps to max day (e.g., Jan 31 -> Feb 28)."""
        monthly_pattern.next_occurrence = datetime(2026, 1, 31, 10, 0, 0, tzinfo=timezone.utc)
        monthly_pattern.interval = 1
        monthly_pattern.day_of_month = 31

        next_occ = processor._calculate_next_occurrence(monthly_pattern)

        # February 2026 has 28 days
        expected = datetime(2026, 2, 28, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_monthly_december_to_january(self, processor, monthly_pattern):
        """Test: monthly pattern wraps from December to January."""
        monthly_pattern.next_occurrence = datetime(2025, 12, 15, 10, 0, 0, tzinfo=timezone.utc)
        monthly_pattern.interval = 1

        next_occ = processor._calculate_next_occurrence(monthly_pattern)

        expected = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        assert next_occ == expected

    def test_next_occurrence_past_end_date_returns_none(self, processor, daily_pattern):
        """Test: returns None if next occurrence would be past end_date."""
        daily_pattern.next_occurrence = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        daily_pattern.end_date = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        daily_pattern.interval = 1

        next_occ = processor._calculate_next_occurrence(daily_pattern)
        assert next_occ is None

    def test_unknown_frequency_returns_none(self, processor, daily_pattern):
        """Test: unknown frequency returns None."""
        daily_pattern.frequency = "yearly"
        next_occ = processor._calculate_next_occurrence(daily_pattern)
        assert next_occ is None


class TestSpawnTaskInstance:
    """Test _spawn_task_instance() via Dapr service invocation."""

    async def test_spawn_creates_task_via_dapr(self, processor, daily_pattern, mock_session):
        """Test: spawns new task via Dapr service invocation."""
        # Mock GET original task
        get_response = MagicMock()
        get_response.status_code = 200
        get_response.json.return_value = {
            "id": 100,
            "title": "Original Task",
            "description": "Test description",
            "priority": "high",
            "tags": ["work"],
        }

        # Mock POST create task
        create_response = MagicMock()
        create_response.status_code = 201
        create_response.json.return_value = {
            "id": 200,
            "title": "Original Task (Recurring)",
        }

        # Mock publish event
        publish_response = MagicMock()
        publish_response.status_code = 204
        publish_response.raise_for_status = MagicMock()

        processor.client.get = AsyncMock(return_value=get_response)
        processor.client.post = AsyncMock(side_effect=[create_response, publish_response])

        result = await processor._spawn_task_instance(daily_pattern, mock_session)

        assert result["id"] == 200
        assert processor.client.get.call_count == 1
        # post called twice: once for create, once for publish event
        assert processor.client.post.call_count == 2

    async def test_spawn_fails_on_task_fetch_error(self, processor, daily_pattern, mock_session):
        """Test: raises exception when original task fetch fails."""
        get_response = MagicMock()
        get_response.status_code = 404
        get_response.text = "Not Found"

        processor.client.get = AsyncMock(return_value=get_response)

        with pytest.raises(Exception, match="Failed to get original task"):
            await processor._spawn_task_instance(daily_pattern, mock_session)

    async def test_spawn_fails_on_create_error(self, processor, daily_pattern, mock_session):
        """Test: raises exception when task creation fails."""
        get_response = MagicMock()
        get_response.status_code = 200
        get_response.json.return_value = {
            "id": 100,
            "title": "Original Task",
            "priority": "medium",
            "tags": [],
        }

        create_response = MagicMock()
        create_response.status_code = 500
        create_response.text = "Internal Server Error"

        processor.client.get = AsyncMock(return_value=get_response)
        processor.client.post = AsyncMock(return_value=create_response)

        with pytest.raises(Exception, match="Failed to create task"):
            await processor._spawn_task_instance(daily_pattern, mock_session)


class TestProcessDueRecurrences:
    """Test process_due_recurrences() end-to-end."""

    async def test_processes_due_patterns(self, processor, daily_pattern, mock_session):
        """Test: finds and processes due patterns."""
        mock_session.exec.return_value.all.return_value = [daily_pattern]

        # Mock spawn
        get_response = MagicMock(status_code=200)
        get_response.json.return_value = {
            "id": 100, "title": "Task", "priority": "medium", "tags": []
        }
        create_response = MagicMock(status_code=201)
        create_response.json.return_value = {"id": 200, "title": "Task (Recurring)"}
        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()

        processor.client.get = AsyncMock(return_value=get_response)
        processor.client.post = AsyncMock(side_effect=[create_response, publish_response])

        count = await processor.process_due_recurrences(mock_session)

        assert count == 1
        assert daily_pattern.occurrences_count == 1
        assert daily_pattern.last_spawned_at is not None
        mock_session.commit.assert_called_once()

    async def test_skips_patterns_past_max_occurrences(self, processor, weekly_pattern, mock_session):
        """Test: skips patterns that have reached max_occurrences."""
        weekly_pattern.occurrences_count = 10
        weekly_pattern.max_occurrences = 10
        mock_session.exec.return_value.all.return_value = [weekly_pattern]

        count = await processor.process_due_recurrences(mock_session)

        assert count == 0
        mock_session.commit.assert_called_once()

    async def test_no_due_patterns_returns_zero(self, processor, mock_session):
        """Test: no due patterns returns 0."""
        mock_session.exec.return_value.all.return_value = []

        count = await processor.process_due_recurrences(mock_session)

        assert count == 0
        mock_session.commit.assert_called_once()

    async def test_handles_spawn_failure_gracefully(self, processor, daily_pattern, mock_session):
        """Test: continues processing after spawn failure."""
        second_pattern = RecurrencePattern(
            id=10,
            task_id=110,
            user_id="user-123",
            frequency="daily",
            interval=1,
            occurrences_count=0,
            next_occurrence=datetime.now(timezone.utc) - timedelta(minutes=1),
            deleted_at=None,
        )
        mock_session.exec.return_value.all.return_value = [daily_pattern, second_pattern]

        # First spawn fails, second succeeds
        get_response = MagicMock(status_code=200)
        get_response.json.return_value = {
            "id": 100, "title": "Task", "priority": "medium", "tags": []
        }
        create_response = MagicMock(status_code=201)
        create_response.json.return_value = {"id": 200, "title": "Task (Recurring)"}
        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()

        call_count = 0

        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Connection refused")
            return get_response

        processor.client.get = mock_get
        processor.client.post = AsyncMock(side_effect=[create_response, publish_response])

        count = await processor.process_due_recurrences(mock_session)

        # Only second pattern spawned successfully
        assert count == 1
        mock_session.commit.assert_called_once()


class TestPublishTaskSpawnedEvent:
    """Test _publish_task_spawned_event() publishes to Kafka."""

    async def test_publishes_event(self, processor):
        """Test: publishes task.spawned event with correct payload."""
        publish_response = MagicMock(status_code=204)
        publish_response.raise_for_status = MagicMock()
        processor.client.post = AsyncMock(return_value=publish_response)

        await processor._publish_task_spawned_event(
            pattern_id=1,
            parent_task_id=100,
            spawned_task_id=200,
            user_id="user-123",
        )

        processor.client.post.assert_called_once()
        call_args = processor.client.post.call_args

        # Verify URL targets Kafka pubsub
        assert "kafka-pubsub/task-events" in call_args[0][0]

        # Verify payload
        payload = call_args[1]["json"]
        assert payload["event_type"] == "task.spawned"
        assert payload["data"]["pattern_id"] == 1
        assert payload["data"]["parent_task_id"] == 100
        assert payload["data"]["spawned_task_id"] == 200
        assert payload["data"]["user_id"] == "user-123"

    async def test_handles_publish_failure(self, processor):
        """Test: logs error on publish failure (does not raise)."""
        processor.client.post = AsyncMock(side_effect=Exception("Kafka down"))

        # Should not raise
        await processor._publish_task_spawned_event(
            pattern_id=1,
            parent_task_id=100,
            spawned_task_id=200,
            user_id="user-123",
        )
