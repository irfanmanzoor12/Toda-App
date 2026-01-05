"""Conversation Service for Phase III.

Handles conversation persistence logic for stateless chat endpoint.
Implements the required flow:
1. Fetch conversation history from database
2. Build message array (history + new message)
3. Store user message
4. (Agent processes)
5. Store assistant response
6. Return response with conversation_id
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select

from src.models import Conversation, Message


class ConversationService:
    """Service for managing conversation persistence."""

    def __init__(self, session: Session):
        """Initialize service with database session.

        Args:
            session: SQLModel database session
        """
        self.session = session

    def get_or_create_conversation(
        self, user_id: str, conversation_id: Optional[int] = None
    ) -> Conversation:
        """Get existing conversation or create new one.

        Args:
            user_id: User identifier
            conversation_id: Optional existing conversation ID

        Returns:
            Conversation object

        Raises:
            ValueError: If conversation_id provided but not found or doesn't belong to user
        """
        if conversation_id:
            # Fetch existing conversation
            statement = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation = self.session.exec(statement).first()

            if not conversation:
                raise ValueError(
                    f"Conversation {conversation_id} not found or doesn't belong to user"
                )

            return conversation
        else:
            # Create new conversation
            conversation = Conversation(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.session.add(conversation)
            self.session.commit()
            self.session.refresh(conversation)
            return conversation

    def get_conversation_history(
        self, conversation_id: int, limit: int = 50
    ) -> List[Message]:
        """Retrieve conversation message history.

        Args:
            conversation_id: Conversation ID
            limit: Maximum messages to retrieve (default 50)

        Returns:
            List of Message objects ordered by creation time (oldest first)
        """
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .limit(limit)
        )
        messages = self.session.exec(statement).all()
        return list(messages)

    def build_message_context(self, messages: List[Message]) -> List[Dict[str, str]]:
        """Build message array for AI agent from database messages.

        Args:
            messages: List of Message objects from database

        Returns:
            List of message dicts in OpenAI format: [{"role": "user", "content": "..."}]
        """
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

    def store_user_message(
        self, user_id: str, conversation_id: int, content: str
    ) -> Message:
        """Store user message to database.

        Args:
            user_id: User identifier
            conversation_id: Conversation ID
            content: Message content

        Returns:
            Created Message object
        """
        message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=content,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)

        # Update conversation updated_at
        self._update_conversation_timestamp(conversation_id)

        return message

    def store_assistant_message(
        self, user_id: str, conversation_id: int, content: str
    ) -> Message:
        """Store assistant message to database.

        Args:
            user_id: User identifier
            conversation_id: Conversation ID
            content: Message content

        Returns:
            Created Message object
        """
        message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)

        # Update conversation updated_at
        self._update_conversation_timestamp(conversation_id)

        return message

    def _update_conversation_timestamp(self, conversation_id: int) -> None:
        """Update conversation's updated_at timestamp.

        Args:
            conversation_id: Conversation ID
        """
        statement = select(Conversation).where(Conversation.id == conversation_id)
        conversation = self.session.exec(statement).first()
        if conversation:
            conversation.updated_at = datetime.now(timezone.utc)
            self.session.add(conversation)
            self.session.commit()
