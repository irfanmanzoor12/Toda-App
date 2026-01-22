"""add_due_date_and_reminder_schedule

Revision ID: f79e4aacdcf4
Revises: 668d84e91386
Create Date: 2026-01-06 16:07:18.137831

TASK-002: Add due_date and reminder_schedule to todo
REQ-002: Due Dates and Reminders
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'f79e4aacdcf4'
down_revision: Union[str, Sequence[str], None] = '668d84e91386'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add due_date and reminder_schedule columns."""
    # Add due_date column (nullable timestamp with timezone)
    op.add_column(
        'todo',
        sa.Column('due_date', TIMESTAMP(timezone=True), nullable=True)
    )

    # Add reminder_schedule column (JSONB for flexible reminder configuration)
    op.add_column(
        'todo',
        sa.Column('reminder_schedule', JSONB, nullable=True)
    )

    # Create index on due_date for faster queries on upcoming/overdue tasks
    op.create_index('idx_todo_due_date', 'todo', ['due_date'])


def downgrade() -> None:
    """Remove due_date and reminder_schedule columns."""
    # Drop the index first
    op.drop_index('idx_todo_due_date', table_name='todo')

    # Drop the columns
    op.drop_column('todo', 'reminder_schedule')
    op.drop_column('todo', 'due_date')
