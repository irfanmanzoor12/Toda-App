"""add_soft_delete

Revision ID: f37bf0be5993
Revises: f79e4aacdcf4
Create Date: 2026-01-06 16:08:42.032112

TASK-003: Add soft delete (deleted_at)
REQ-006: Event-Driven Architecture with Kafka
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'f37bf0be5993'
down_revision: Union[str, Sequence[str], None] = 'f79e4aacdcf4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add deleted_at column for soft delete."""
    # Add deleted_at column (nullable timestamp with timezone)
    op.add_column(
        'todo',
        sa.Column('deleted_at', TIMESTAMP(timezone=True), nullable=True)
    )

    # Create partial index for active (non-deleted) tasks
    # This speeds up queries that filter deleted_at IS NULL
    op.execute(
        "CREATE INDEX idx_todo_active ON todo (id) WHERE deleted_at IS NULL"
    )


def downgrade() -> None:
    """Remove deleted_at column."""
    # Drop the index first
    op.drop_index('idx_todo_active', table_name='todo')

    # Drop the column
    op.drop_column('todo', 'deleted_at')
