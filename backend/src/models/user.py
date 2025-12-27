"""User model for authentication and authorization."""

from datetime import datetime, timezone
from typing import Optional, List

from sqlmodel import Field, SQLModel, Relationship


class User(SQLModel, table=True):
    """
    Represents a user account with authentication credentials.

    Attributes:
        id: Unique identifier (auto-assigned by database)
        email: User's email address (unique, used for login)
        password_hash: Bcrypt hashed password
        created_at: Timestamp when user registered (UTC)
        todos: Relationship to user's todos
    """
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationship (will be populated by SQLModel)
    # todos: List["Todo"] = Relationship(back_populates="user")
