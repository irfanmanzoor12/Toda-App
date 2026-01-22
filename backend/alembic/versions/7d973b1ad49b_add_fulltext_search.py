"""add_fulltext_search

Revision ID: 7d973b1ad49b
Revises: f37bf0be5993
Create Date: 2026-01-06 16:09:57.927705

TASK-004: Add full-text search with tsvector
REQ-005: Search and Filter
COMP-001: Task Service (Enhanced)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR


# revision identifiers, used by Alembic.
revision: str = '7d973b1ad49b'
down_revision: Union[str, Sequence[str], None] = 'f37bf0be5993'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add full-text search capability."""
    # Add search_vector column
    op.add_column(
        'todo',
        sa.Column('search_vector', TSVECTOR, nullable=True)
    )

    # Create GIN index for fast full-text search
    op.create_index(
        'idx_todo_search',
        'todo',
        ['search_vector'],
        postgresql_using='gin'
    )

    # Create trigger function to auto-update search_vector
    op.execute("""
        CREATE FUNCTION todo_search_trigger() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger to call the function on INSERT or UPDATE
    op.execute("""
        CREATE TRIGGER todo_search_update
        BEFORE INSERT OR UPDATE ON todo
        FOR EACH ROW
        EXECUTE FUNCTION todo_search_trigger();
    """)

    # Update existing rows with search_vector
    op.execute("""
        UPDATE todo SET search_vector =
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'B');
    """)


def downgrade() -> None:
    """Remove full-text search capability."""
    # Drop the trigger first
    op.execute("DROP TRIGGER IF EXISTS todo_search_update ON todo")

    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS todo_search_trigger()")

    # Drop the index
    op.drop_index('idx_todo_search', table_name='todo')

    # Drop the column
    op.drop_column('todo', 'search_vector')
