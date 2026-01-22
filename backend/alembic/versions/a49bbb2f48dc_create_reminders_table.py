"""create_reminders_table

Revision ID: a49bbb2f48dc
Revises: b839d0f42991
Create Date: 2026-01-06 16:11:33.041750

TASK-008: Create reminders table
REQ-002: Due Dates and Reminders
COMP-003: Reminder Service
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'a49bbb2f48dc'
down_revision: Union[str, Sequence[str], None] = 'b839d0f42991'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create reminders table for task reminders."""
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('trigger_at', TIMESTAMP(timezone=True), nullable=False),
        sa.Column('sent_at', TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('cancelled_at', TIMESTAMP(timezone=True), nullable=True),

        # Foreign key to todo table with CASCADE delete
        sa.ForeignKeyConstraint(['task_id'], ['todo.id'], ondelete='CASCADE')
    )

    # Create partial index for pending reminders
    # Only index reminders that haven't been sent or cancelled
    op.execute("""
        CREATE INDEX idx_reminders_trigger_at
        ON reminders (trigger_at)
        WHERE sent_at IS NULL AND cancelled_at IS NULL
    """)

    # Create index on task_id for faster task-based queries
    op.create_index('idx_reminders_task_id', 'reminders', ['task_id'])


def downgrade() -> None:
    """Drop reminders table."""
    op.drop_index('idx_reminders_task_id', table_name='reminders')
    op.drop_index('idx_reminders_trigger_at', table_name='reminders')
    op.drop_table('reminders')
