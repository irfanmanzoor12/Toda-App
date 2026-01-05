"""Migration script from SQLite to PostgreSQL.

This script:
1. Reads data from existing SQLite database
2. Connects to PostgreSQL database
3. Migrates all todos data
4. Preserves user_id, timestamps, and all fields

Usage:
    python migrations/migrate_sqlite_to_postgres.py
"""

import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select
from src.models import Todo


def migrate_data(sqlite_db_path: str, postgres_url: str):
    """Migrate todos from SQLite to PostgreSQL.

    Args:
        sqlite_db_path: Path to SQLite database file
        postgres_url: PostgreSQL connection string
    """
    print("🔄 Starting migration from SQLite to PostgreSQL...")

    # Create engines
    sqlite_engine = create_engine(f"sqlite:///{sqlite_db_path}")
    postgres_engine = create_engine(postgres_url)

    # Read from SQLite
    print("📖 Reading data from SQLite...")
    todos_to_migrate = []

    with Session(sqlite_engine) as sqlite_session:
        statement = select(Todo)
        todos = sqlite_session.exec(statement).all()
        print(f"   Found {len(todos)} todos to migrate")

        for todo in todos:
            todos_to_migrate.append({
                "user_id": todo.user_id,
                "title": todo.title,
                "description": todo.description,
                "completed": todo.completed,
                "created_at": todo.created_at,
                "updated_at": todo.updated_at,
            })

    # Write to PostgreSQL
    print("✍️  Writing data to PostgreSQL...")
    migrated_count = 0

    with Session(postgres_engine) as postgres_session:
        for todo_data in todos_to_migrate:
            new_todo = Todo(**todo_data)
            postgres_session.add(new_todo)
            migrated_count += 1

        postgres_session.commit()
        print(f"✅ Migrated {migrated_count} todos successfully!")


def main():
    """Main migration function."""
    # Get paths from environment or use defaults
    sqlite_path = os.getenv("SQLITE_DB_PATH", "todoapp.db")
    postgres_url = os.getenv("DATABASE_URL")

    if not postgres_url:
        print("❌ Error: DATABASE_URL environment variable not set")
        print("   Please set your Neon PostgreSQL connection string:")
        print('   export DATABASE_URL="postgresql://user:pass@host/db"')
        sys.exit(1)

    if not os.path.exists(sqlite_path):
        print(f"❌ Error: SQLite database not found at {sqlite_path}")
        sys.exit(1)

    print(f"📂 SQLite database: {sqlite_path}")
    print(f"🔗 PostgreSQL URL: {postgres_url[:50]}...")
    print()

    confirm = input("⚠️  This will migrate all data. Continue? (yes/no): ")
    if confirm.lower() != "yes":
        print("❌ Migration cancelled")
        sys.exit(0)

    try:
        migrate_data(sqlite_path, postgres_url)
        print()
        print("🎉 Migration completed successfully!")
        print("   You can now update your .env file to use PostgreSQL")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
