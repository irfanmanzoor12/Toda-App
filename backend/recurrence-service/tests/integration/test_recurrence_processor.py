"""
TASK-068: Integration tests for Recurrence Service
Tests recurrence pattern processing and task spawning
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.fixture
def sample_daily_pattern():
    """Daily recurrence pattern."""
    return {
        "id": 1,
        "task_id": 100,
        "user_id": "user-123",
        "frequency": "daily",
        "interval": 1,
        "day_of_week": None,
        "day_of_month": None,
        "start_date": datetime.utcnow() - timedelta(days=1),
        "end_date": None,
        "max_occurrences": None,
        "occurrences_count": 0,
        "next_occurrence": datetime.utcnow() - timedelta(minutes=5),
        "last_spawned_at": None,
        "created_at": datetime.utcnow() - timedelta(days=1),
    }


@pytest.fixture
def sample_weekly_pattern():
    """Weekly recurrence pattern (every Monday)."""
    return {
        "id": 2,
        "task_id": 101,
        "user_id": "user-123",
        "frequency": "weekly",
        "interval": 1,
        "day_of_week": 0,  # Monday
        "day_of_month": None,
        "start_date": datetime.utcnow() - timedelta(weeks=1),
        "end_date": None,
        "max_occurrences": 10,
        "occurrences_count": 2,
        "next_occurrence": datetime.utcnow() - timedelta(minutes=5),
        "last_spawned_at": datetime.utcnow() - timedelta(weeks=1),
        "created_at": datetime.utcnow() - timedelta(weeks=2),
    }


class TestRecurrenceProcessor:
    """Test suite for RecurrenceProcessor."""

    @pytest.mark.asyncio
    async def test_daily_recurrence_spawns_task(self, sample_daily_pattern):
        """Test: daily recurrence spawns task after due."""
        from src.processor import RecurrenceProcessor

        with patch('src.processor.RecurrenceProcessor._spawn_task_instance') as mock_spawn:
            with patch('src.processor.RecurrenceProcessor._get_due_patterns') as mock_get:
                mock_get.return_value = [sample_daily_pattern]
                mock_spawn.return_value = {"id": 200, "title": "Spawned Task"}

                processor = RecurrenceProcessor(db_session=MagicMock())
                result = await processor.process_due_recurrences()

                assert result["spawned_count"] == 1
                mock_spawn.assert_called_once()

    @pytest.mark.asyncio
    async def test_weekly_recurrence_correct_day(self, sample_weekly_pattern):
        """Test: weekly recurrence spawns on correct day."""
        from src.processor import RecurrenceProcessor

        with patch('src.processor.RecurrenceProcessor._spawn_task_instance') as mock_spawn:
            with patch('src.processor.RecurrenceProcessor._get_due_patterns') as mock_get:
                mock_get.return_value = [sample_weekly_pattern]
                mock_spawn.return_value = {"id": 201, "title": "Weekly Task"}

                processor = RecurrenceProcessor(db_session=MagicMock())
                result = await processor.process_due_recurrences()

                assert result["spawned_count"] == 1

    @pytest.mark.asyncio
    async def test_max_occurrences_stops_spawning(self, sample_weekly_pattern):
        """Test: max_occurrences stops spawning."""
        from src.processor import RecurrenceProcessor

        # Set occurrences to max
        sample_weekly_pattern["occurrences_count"] = 10
        sample_weekly_pattern["max_occurrences"] = 10

        processor = RecurrenceProcessor(db_session=MagicMock())
        should_spawn = processor._should_spawn(sample_weekly_pattern)

        assert should_spawn is False

    @pytest.mark.asyncio
    async def test_end_date_stops_spawning(self, sample_daily_pattern):
        """Test: end_date stops spawning."""
        from src.processor import RecurrenceProcessor

        # Set end_date in the past
        sample_daily_pattern["end_date"] = datetime.utcnow() - timedelta(days=1)

        processor = RecurrenceProcessor(db_session=MagicMock())
        should_spawn = processor._should_spawn(sample_daily_pattern)

        assert should_spawn is False

    @pytest.mark.asyncio
    async def test_calculate_next_occurrence_daily(self):
        """Test: calculate next occurrence for daily pattern."""
        from src.processor import RecurrenceProcessor

        processor = RecurrenceProcessor(db_session=MagicMock())

        current = datetime(2026, 1, 15, 10, 0, 0)
        next_occ = processor._calculate_next_occurrence(
            frequency="daily",
            interval=1,
            current_occurrence=current
        )

        expected = datetime(2026, 1, 16, 10, 0, 0)
        assert next_occ == expected

    @pytest.mark.asyncio
    async def test_calculate_next_occurrence_weekly(self):
        """Test: calculate next occurrence for weekly pattern."""
        from src.processor import RecurrenceProcessor

        processor = RecurrenceProcessor(db_session=MagicMock())

        current = datetime(2026, 1, 15, 10, 0, 0)  # Wednesday
        next_occ = processor._calculate_next_occurrence(
            frequency="weekly",
            interval=1,
            current_occurrence=current,
            day_of_week=0  # Monday
        )

        # Next Monday is Jan 20
        expected = datetime(2026, 1, 20, 10, 0, 0)
        assert next_occ == expected

    @pytest.mark.asyncio
    async def test_calculate_next_occurrence_monthly(self):
        """Test: calculate next occurrence for monthly pattern."""
        from src.processor import RecurrenceProcessor

        processor = RecurrenceProcessor(db_session=MagicMock())

        current = datetime(2026, 1, 15, 10, 0, 0)
        next_occ = processor._calculate_next_occurrence(
            frequency="monthly",
            interval=1,
            current_occurrence=current,
            day_of_month=15
        )

        expected = datetime(2026, 2, 15, 10, 0, 0)
        assert next_occ == expected

    @pytest.mark.asyncio
    async def test_spawn_task_via_dapr(self, sample_daily_pattern):
        """Test: spawn task via Dapr service invocation."""
        from src.processor import RecurrenceProcessor

        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {"id": 200, "title": "Spawned Task"}

            client = AsyncMock()
            client.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = client

            processor = RecurrenceProcessor(db_session=MagicMock())
            processor.dapr_host = "localhost"
            processor.dapr_port = 3500
            processor.task_service_app_id = "task-service"

            result = await processor._spawn_task_instance(
                pattern=sample_daily_pattern,
                original_task={"title": "Original Task", "description": "Test"}
            )

            assert result["id"] == 200
            client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_publish_task_spawned_event(self, sample_daily_pattern):
        """Test: publishes task.spawned event to Kafka."""
        from src.processor import RecurrenceProcessor

        with patch('src.processor.RecurrenceProcessor._publish_event') as mock_publish:
            processor = RecurrenceProcessor(db_session=MagicMock())

            spawned_task = {"id": 200, "title": "Spawned Task"}
            await processor._publish_task_spawned_event(
                pattern=sample_daily_pattern,
                spawned_task=spawned_task
            )

            mock_publish.assert_called_once()
            call_args = mock_publish.call_args[0]
            assert call_args[0] == "task.spawned"
