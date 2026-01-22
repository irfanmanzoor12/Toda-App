"""Reminder API endpoints.

TASK-034, 036, 037: Reminder Service endpoints
REQ-002: Due Dates & Time Reminders
COMP-003: Reminder Service
"""

import re
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select

from src.db import get_session
from src.models.reminder import Reminder
from src.schemas.reminder import ReminderScheduleRequest, ReminderResponse
from src.processor import ReminderProcessor

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


def get_user_id(request: Request) -> str:
    """Extract user ID from request headers."""
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not provided"
        )
    return user_id


def parse_reminder_time(time_str: str) -> timedelta:
    """Parse reminder time string to timedelta.

    Args:
        time_str: Time string like '1h', '1d', '1w'

    Returns:
        timedelta representing the duration
    """
    match = re.match(r'^(\d+)([hdwm])$', time_str.lower())
    if not match:
        raise ValueError(f"Invalid reminder time format: {time_str}")

    value = int(match.group(1))
    unit = match.group(2)

    if unit == 'h':
        return timedelta(hours=value)
    elif unit == 'd':
        return timedelta(days=value)
    elif unit == 'w':
        return timedelta(weeks=value)
    elif unit == 'm':
        return timedelta(days=value * 30)  # Approximate month

    raise ValueError(f"Unknown time unit: {unit}")


@router.post("/schedule", response_model=List[ReminderResponse], status_code=status.HTTP_201_CREATED)
def schedule_reminders(
    schedule_data: ReminderScheduleRequest,
    request: Request,
    session: Session = Depends(get_session)
):
    """Schedule reminders for a task.

    TASK-034: POST /api/reminders/schedule
    - Parses reminder_times (1h, 1d, 1w = before due date)
    - Creates multiple reminder records
    - Returns array of created reminders
    """
    user_id = get_user_id(request)

    created_reminders = []

    for time_str in schedule_data.reminder_times:
        try:
            offset = parse_reminder_time(time_str)
            trigger_at = schedule_data.due_date - offset

            # Skip if trigger time is in the past
            if trigger_at <= datetime.now(timezone.utc):
                continue

            reminder = Reminder(
                task_id=schedule_data.task_id,
                user_id=user_id,
                trigger_at=trigger_at
            )

            session.add(reminder)
            session.flush()
            created_reminders.append(reminder)

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    session.commit()

    for r in created_reminders:
        session.refresh(r)

    return created_reminders


@router.get("/{task_id}", response_model=List[ReminderResponse])
def get_task_reminders(
    task_id: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """Get all reminders for a task."""
    user_id = get_user_id(request)

    reminders = session.exec(
        select(Reminder).where(
            Reminder.task_id == task_id,
            Reminder.user_id == user_id,
            Reminder.cancelled_at.is_(None)
        ).order_by(Reminder.trigger_at)
    ).all()

    return reminders


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_task_reminders(
    task_id: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """Cancel all reminders for a task.

    TASK-037: DELETE /api/reminders/{task_id}
    - Sets cancelled_at on all unsent reminders for the task
    """
    user_id = get_user_id(request)

    reminders = session.exec(
        select(Reminder).where(
            Reminder.task_id == task_id,
            Reminder.user_id == user_id,
            Reminder.sent_at.is_(None),
            Reminder.cancelled_at.is_(None)
        )
    ).all()

    now = datetime.now(timezone.utc)
    for reminder in reminders:
        reminder.cancelled_at = now
        session.add(reminder)

    session.commit()


@router.post("/process")
async def process_due_reminders(
    request: Request,
    session: Session = Depends(get_session)
):
    """Process all due reminders (Dapr Cron endpoint).

    TASK-036: POST /api/reminders/process
    - Called by Dapr Cron binding
    - Finds and sends all due reminders
    - Returns count of sent reminders
    """
    processor = ReminderProcessor()
    try:
        sent_count = await processor.process_due_reminders(session)
        return {"sent_count": sent_count, "status": "completed"}
    finally:
        await processor.close()
