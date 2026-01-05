"""Database configuration for Phase II and Phase III.

Phase II: SQLite support with SQLModel
Phase III: PostgreSQL (Neon) support for production

The database connection is configured via DATABASE_URL environment variable:
- SQLite (dev): sqlite:///path/to/db.db
- PostgreSQL (prod): postgresql://user:pass@host/db
"""

import os
from sqlmodel import create_engine, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment, fallback to SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to SQLite for local development
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(BASE_DIR, "todoapp.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    print(f"⚠️  DATABASE_URL not set, using SQLite: {DATABASE_URL}")
else:
    print(f"✅ Using database: {DATABASE_URL[:50]}...")

# Create engine with appropriate settings
if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific settings
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL settings (for Neon and other PostgreSQL databases)
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,         # Connection pool size
        max_overflow=10,     # Max overflow connections
    )


def get_session():
    """Get database session.

    Used as FastAPI dependency for request-scoped sessions.
    """
    with Session(engine) as session:
        yield session

