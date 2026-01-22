"""create_recurrence_pattern_table

Revision ID: b839d0f42991
Revises: 783781bef161
Create Date: 2026-01-06 16:11:30.519024

TASK-007: Create recurrence_pattern table
REQ-001: Recurring Tasks
COMP-002: Recurrence Service
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'b839d0f42991'
down_revision: Union[str, Sequence[str], None] = '783781bef161'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create recurrence_pattern table for recurring tasks."""
    op.create_table(
        'recurrence_pattern',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('interval', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('day_of_week', sa.Integer(), nullable=True),
        sa.Column('day_of_month', sa.Integer(), nullable=True),
        sa.Column('end_date', TIMESTAMP(timezone=True), nullable=True),
        sa.Column('max_occurrences', sa.Integer(), nullable=True),
        sa.Column('occurrences_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_spawned_at', TIMESTAMP(timezone=True), nullable=True),
        sa.Column('next_occurrence', TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', TIMESTAMP(timezone=True), nullable=True),

        # Foreign key to todo table
        sa.ForeignKeyConstraint(['task_id'], ['todo.id'], ondelete='CASCADE'),

        # Check constraints
        sa.CheckConstraint("frequency IN ('daily', 'weekly', 'monthly', 'custom')", name='check_frequency'),
        sa.CheckConstraint('interval > 0', name='check_interval'),
        sa.CheckConstraint('day_of_week IS NULL OR (day_of_week BETWEEN 0 AND 6)', name='check_day_of_week'),
        sa.CheckConstraint('day_of_month IS NULL OR (day_of_month BETWEEN 1 AND 31)', name='check_day_of_month'),

        # Unique constraint - one recurrence pattern per task
        sa.UniqueConstraint('task_id', name='uq_recurrence_task_id')
    )

    # Create indexes for faster queries
    op.create_index('idx_recurrence_next_occurrence', 'recurrence_pattern', ['next_occurrence'],
                    postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('idx_recurrence_user_id', 'recurrence_pattern', ['user_id'])


def downgrade() -> None:
    """Drop recurrence_pattern table."""
    op.drop_index('idx_recurrence_user_id', table_name='recurrence_pattern')
    op.drop_index('idx_recurrence_next_occurrence', table_name='recurrence_pattern')
    op.drop_table('recurrence_pattern')
