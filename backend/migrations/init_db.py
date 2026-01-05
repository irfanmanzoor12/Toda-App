"""Database initialization script for Phase III.

Creates all required tables:
- todos (from Phase II)
- conversations (Phase III)
- messages (Phase III)

Usage:
    python migrations/init_db.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import SQLModel
from src.database import engine
from src.models import Todo, Conversation, Message


def init_database():
    """Initialize database with all tables."""
    print("🚀 Initializing database...")
    print(f"📍 Database URL: {engine.url}")

    try:
        # Create all tables
        SQLModel.metadata.create_all(engine)
        print("✅ Database tables created successfully!")
        print("   - todos")
        print("   - conversations")
        print("   - messages")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)


if __name__ == "__main__":
    init_database()
