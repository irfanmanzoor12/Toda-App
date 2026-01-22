"""create_task_tags_junction

Revision ID: 783781bef161
Revises: 2a03fd256604
Create Date: 2026-01-06 16:11:27.320182

TASK-006: Create task_tags junction table
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = '783781bef161'
down_revision: Union[str, Sequence[str], None] = '2a03fd256604'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create task_tags junction table for many-to-many relationship."""
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),

        # Foreign keys with CASCADE delete
        sa.ForeignKeyConstraint(['task_id'], ['todo.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),

        # Composite primary key
        sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    # Create indexes for faster queries
    op.create_index('idx_task_tags_task_id', 'task_tags', ['task_id'])
    op.create_index('idx_task_tags_tag_id', 'task_tags', ['tag_id'])


def downgrade() -> None:
    """Drop task_tags junction table."""
    op.drop_index('idx_task_tags_tag_id', table_name='task_tags')
    op.drop_index('idx_task_tags_task_id', table_name='task_tags')
    op.drop_table('task_tags')
