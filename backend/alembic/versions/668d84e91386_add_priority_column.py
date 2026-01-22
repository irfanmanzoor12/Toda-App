"""add_priority_column

Revision ID: 668d84e91386
Revises:
Create Date: 2026-01-06 15:29:57.174516

TASK-001: Add priority column to todo table
REQ-003: Task Priorities
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '668d84e91386'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add priority column with enum constraint."""
    # Add priority column with default value 'medium'
    op.add_column(
        'todo',
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium')
    )

    # Add check constraint for valid priority values
    op.create_check_constraint(
        'check_priority',
        'todo',
        sa.text("priority IN ('low', 'medium', 'high', 'critical')")
    )


def downgrade() -> None:
    """Remove priority column."""
    # Drop the check constraint first
    op.drop_constraint('check_priority', 'todo', type_='check')

    # Drop the column
    op.drop_column('todo', 'priority')
