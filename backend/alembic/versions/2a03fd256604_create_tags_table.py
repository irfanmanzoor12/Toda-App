"""create_tags_table

Revision ID: 2a03fd256604
Revises: 7d973b1ad49b
Create Date: 2026-01-06 16:11:23.681298

TASK-005: Create tags table
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = '2a03fd256604'
down_revision: Union[str, Sequence[str], None] = '7d973b1ad49b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tags table."""
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('created_at', TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),

        # Unique constraint on (name, user_id) - user can't have duplicate tag names
        sa.UniqueConstraint('name', 'user_id', name='uq_tags_name_user_id')
    )

    # Create index on user_id for faster queries
    op.create_index('idx_tags_user_id', 'tags', ['user_id'])


def downgrade() -> None:
    """Drop tags table."""
    op.drop_index('idx_tags_user_id', table_name='tags')
    op.drop_table('tags')
