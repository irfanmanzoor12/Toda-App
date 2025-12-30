"""Database engine and session utility for Phase II.

Task: T204 - Set up SQLModel engine with Neon PostgreSQL.
"""

import os
from sqlmodel import create_engine, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Create SQLModel engine
engine = create_engine(DATABASE_URL, echo=True)


def get_session():
    """Create and return a new database session."""
    with Session(engine) as session:
        yield session
