"""Conversation and Message models for Phase III chatbot.

Phase III Requirement: Stateless chat endpoint that persists conversation state to database.
Models support conversation history retrieval for context in each request.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """Conversation model for tracking chat sessions.

    Phase III: Each conversation belongs to a user and contains multiple messages.
    Used to maintain context across stateless API requests.
    """

    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Indexed for fast user lookup
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Message(SQLModel, table=True):
    """Message model for storing conversation history.

    Phase III: Stores both user and assistant messages.
    Retrieved on each request to provide context to the AI agent.
    """

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Indexed for fast user lookup
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(description="'user' or 'assistant'")
    content: str = Field(description="Message text content")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
