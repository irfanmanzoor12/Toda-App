"""Recurrence pattern API endpoints.

TASK-025, 027, 028, 029, 030: Recurrence Service endpoints
REQ-001: Recurring Tasks
COMP-002: Recurrence Service
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlmodel import Session, select

from src.db import get_session
from src.models.recurrence_pattern import RecurrencePattern
from src.schemas.recurrence import (
    RecurrencePatternCreate,
    RecurrencePatternUpdate,
    RecurrencePatternResponse
)
from src.processor import RecurrenceProcessor

router = APIRouter(prefix="/api/recurrence", tags=["recurrence"])


def get_user_id(request: Request) -> str:
    """Extract user ID from request headers (set by Dapr/JWT middleware)."""
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not provided"
        )
    return user_id


@router.post("/patterns", response_model=RecurrencePatternResponse, status_code=status.HTTP_201_CREATED)
def create_recurrence_pattern(
    pattern_data: RecurrencePatternCreate,
    request: Request,
    session: Session = Depends(get_session)
):
    """Create a new recurrence pattern for a task.

    TASK-025: POST /api/recurrence/patterns
    - Creates recurrence_pattern in database
    - Calculates initial next_occurrence
    - Returns RecurrencePatternResponse
    """
    user_id = get_user_id(request)

    # Check if pattern already exists for this task
    existing = session.exec(
        select(RecurrencePattern).where(
            RecurrencePattern.task_id == pattern_data.task_id,
            RecurrencePattern.deleted_at.is_(None)
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recurrence pattern already exists for this task"
        )

    # Create pattern
    pattern = RecurrencePattern(
        task_id=pattern_data.task_id,
        user_id=user_id,
        frequency=pattern_data.frequency,
        interval=pattern_data.interval,
        day_of_week=pattern_data.day_of_week,
        day_of_month=pattern_data.day_of_month,
        end_date=pattern_data.end_date,
        max_occurrences=pattern_data.max_occurrences
    )

    # Calculate initial next_occurrence
    pattern.next_occurrence = _calculate_initial_occurrence(pattern)

    session.add(pattern)
    session.commit()
    session.refresh(pattern)

    return pattern


@router.get("/patterns/{pattern_id}", response_model=RecurrencePatternResponse)
def get_recurrence_pattern(
    pattern_id: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """Get a recurrence pattern by ID.

    TASK-028: GET /api/recurrence/patterns/{id}
    - Returns pattern with spawned tasks count
    - User can only access their own patterns
    """
    user_id = get_user_id(request)

    pattern = session.exec(
        select(RecurrencePattern).where(
            RecurrencePattern.id == pattern_id,
            RecurrencePattern.user_id == user_id,
            RecurrencePattern.deleted_at.is_(None)
        )
    ).first()

    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurrence pattern not found"
        )

    return pattern


@router.get("/patterns", response_model=List[RecurrencePatternResponse])
def list_recurrence_patterns(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """List all recurrence patterns for the user.

    Returns user's recurrence patterns with pagination.
    """
    user_id = get_user_id(request)

    patterns = session.exec(
        select(RecurrencePattern)
        .where(
            RecurrencePattern.user_id == user_id,
            RecurrencePattern.deleted_at.is_(None)
        )
        .offset(offset)
        .limit(limit)
    ).all()

    return patterns


@router.put("/patterns/{pattern_id}", response_model=RecurrencePatternResponse)
def update_recurrence_pattern(
    pattern_id: int,
    pattern_data: RecurrencePatternUpdate,
    request: Request,
    session: Session = Depends(get_session)
):
    """Update a recurrence pattern.

    TASK-029: PUT /api/recurrence/patterns/{id}
    - Allows updating frequency, interval, end_date
    - Recalculates next_occurrence if frequency changes
    - Applies to future instances only
    """
    user_id = get_user_id(request)

    pattern = session.exec(
        select(RecurrencePattern).where(
            RecurrencePattern.id == pattern_id,
            RecurrencePattern.user_id == user_id,
            RecurrencePattern.deleted_at.is_(None)
        )
    ).first()

    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurrence pattern not found"
        )

    # Track if we need to recalculate next_occurrence
    recalculate = False

    if pattern_data.frequency is not None and pattern_data.frequency != pattern.frequency:
        pattern.frequency = pattern_data.frequency
        recalculate = True

    if pattern_data.interval is not None and pattern_data.interval != pattern.interval:
        pattern.interval = pattern_data.interval
        recalculate = True

    if pattern_data.day_of_week is not None:
        pattern.day_of_week = pattern_data.day_of_week
        if pattern.frequency == "weekly":
            recalculate = True

    if pattern_data.day_of_month is not None:
        pattern.day_of_month = pattern_data.day_of_month
        if pattern.frequency == "monthly":
            recalculate = True

    if pattern_data.end_date is not None:
        pattern.end_date = pattern_data.end_date

    if pattern_data.max_occurrences is not None:
        pattern.max_occurrences = pattern_data.max_occurrences

    if recalculate:
        pattern.next_occurrence = _calculate_initial_occurrence(pattern)

    pattern.updated_at = datetime.now(timezone.utc)

    session.add(pattern)
    session.commit()
    session.refresh(pattern)

    return pattern


@router.delete("/patterns/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurrence_pattern(
    pattern_id: int,
    request: Request,
    delete_future: bool = Query(True, description="Also soft-delete future task instances"),
    session: Session = Depends(get_session)
):
    """Delete a recurrence pattern (soft delete).

    TASK-030: DELETE /api/recurrence/patterns/{id}
    - Sets deleted_at on recurrence_pattern
    - Optionally soft-deletes future task instances
    """
    user_id = get_user_id(request)

    pattern = session.exec(
        select(RecurrencePattern).where(
            RecurrencePattern.id == pattern_id,
            RecurrencePattern.user_id == user_id,
            RecurrencePattern.deleted_at.is_(None)
        )
    ).first()

    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurrence pattern not found"
        )

    # Soft delete
    pattern.deleted_at = datetime.now(timezone.utc)
    pattern.updated_at = pattern.deleted_at

    session.add(pattern)
    session.commit()

    # Note: delete_future would require calling Task Service to delete spawned tasks
    # This would be done via Dapr service invocation in a production implementation


@router.post("/process")
async def process_due_recurrences(
    request: Request,
    session: Session = Depends(get_session)
):
    """Process all due recurrence patterns (Dapr Cron endpoint).

    TASK-027: POST /api/recurrence/process
    - Called by Dapr Cron binding
    - Processes all patterns where next_occurrence <= now
    - Spawns new task instances
    - Returns count of spawned tasks
    """
    processor = RecurrenceProcessor()
    try:
        spawned_count = await processor.process_due_recurrences(session)
        return {"spawned_count": spawned_count, "status": "completed"}
    finally:
        await processor.close()


def _calculate_initial_occurrence(pattern: RecurrencePattern) -> datetime:
    """Calculate the initial next_occurrence for a new pattern.

    Args:
        pattern: Recurrence pattern

    Returns:
        Initial next occurrence datetime
    """
    from datetime import timedelta

    now = datetime.now(timezone.utc)

    if pattern.frequency == "daily":
        return now + timedelta(days=pattern.interval)

    elif pattern.frequency == "weekly":
        next_dt = now + timedelta(weeks=pattern.interval)
        if pattern.day_of_week is not None:
            days_ahead = pattern.day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_dt = now + timedelta(days=days_ahead)
        return next_dt

    elif pattern.frequency == "monthly":
        import calendar
        month = now.month + pattern.interval
        year = now.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1

        day = pattern.day_of_month or now.day
        max_day = calendar.monthrange(year, month)[1]
        day = min(day, max_day)

        return now.replace(year=year, month=month, day=day, hour=now.hour, minute=now.minute)

    return now + timedelta(days=1)
