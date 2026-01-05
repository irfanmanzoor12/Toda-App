"""Chat API endpoint for Phase III.

Implements stateless chat with conversation persistence.

Phase III Flow:
1. Receive user message (with optional conversation_id)
2. Fetch conversation history from database
3. Build message array (history + new message)
4. Store user message in database
5. Run agent with MCP tools
6. Store assistant response in database
7. Return response with conversation_id

Endpoint: POST /api/{user_id}/chat
Request: {"conversation_id": int (optional), "message": str}
Response: {"conversation_id": int, "response": str, "tool_calls": list}
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Tuple

from src.database import get_session
from src.api.dependencies import get_user_session
from src.services.conversation_service import ConversationService
from src.services.agent_service import AgentService, MCPToolError


router = APIRouter(prefix="/api", tags=["chat"])


# Request/Response models
class ChatRequest(BaseModel):
    """Chat request body schema."""
    conversation_id: Optional[int] = Field(
        None,
        description="Existing conversation ID (creates new if not provided)"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="User's natural language message"
    )


class ChatResponse(BaseModel):
    """Chat response schema."""
    conversation_id: int = Field(..., description="The conversation ID")
    response: str = Field(..., description="AI assistant's response")
    tool_calls: List[str] = Field(
        default=[],
        description="List of MCP tools invoked"
    )


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    deps: Tuple[Session, str] = Depends(get_user_session),
) -> ChatResponse:
    """Chat endpoint with stateless conversation persistence.

    Phase III Requirements:
    - Accepts conversation_id (optional) and message
    - Fetches conversation history from database
    - Processes message with AI agent and MCP tools
    - Stores both user and assistant messages
    - Returns conversation_id, response, and tool_calls

    Args:
        user_id: User identifier from path (ignored - actual ID from JWT)
        request: Chat request with message and optional conversation_id
        deps: Database session and authenticated user_id from JWT

    Returns:
        ChatResponse with conversation_id, response, and tool_calls

    Raises:
        HTTPException 400: Invalid request (empty message, etc.)
        HTTPException 404: Conversation not found
        HTTPException 500: Server error
    """
    try:
        # Extract authenticated user_id from JWT (not from path parameter)
        session, jwt_user_id = deps

        # Step 1: Initialize services
        conversation_service = ConversationService(session)
        agent_service = AgentService()

        # Step 2: Get or create conversation
        try:
            conversation = conversation_service.get_or_create_conversation(
                user_id=jwt_user_id,  # Use JWT user_id, not path parameter
                conversation_id=request.conversation_id
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

        # Step 3: Fetch conversation history
        history_messages = conversation_service.get_conversation_history(
            conversation_id=conversation.id,
            limit=50  # Keep last 50 messages for context
        )

        # Step 4: Build message context for agent
        message_context = conversation_service.build_message_context(history_messages)

        # Step 5: Store user message (before processing)
        conversation_service.store_user_message(
            user_id=jwt_user_id,
            conversation_id=conversation.id,
            content=request.message
        )

        # Step 6: Process with AI agent
        try:
            agent_result = await agent_service.process_message(
                user_id=jwt_user_id,
                message=request.message,
                conversation_history=message_context
            )
        except MCPToolError as e:
            # Tool execution failed, but we should still respond
            agent_result = {
                "response": f"I encountered an error while processing your request: {str(e)}",
                "tool_calls": []
            }
        except Exception as e:
            print(f"Agent processing error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process message with AI agent"
            )

        # Step 7: Store assistant response
        conversation_service.store_assistant_message(
            user_id=jwt_user_id,
            conversation_id=conversation.id,
            content=agent_result["response"]
        )

        # Step 8: Return response (server remains stateless)
        return ChatResponse(
            conversation_id=conversation.id,
            response=agent_result["response"],
            tool_calls=agent_result.get("tool_calls", [])
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get("/{user_id}/conversations")
async def list_conversations(
    user_id: str,
    session: Session = Depends(get_session),
):
    """List all conversations for a user.

    Args:
        user_id: User identifier
        session: Database session

    Returns:
        List of conversations with metadata
    """
    from sqlmodel import select
    from src.models import Conversation

    statement = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )

    conversations = session.exec(statement).all()

    return {
        "conversations": [
            {
                "id": conv.id,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat(),
            }
            for conv in conversations
        ]
    }


@router.get("/{user_id}/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    user_id: str,
    conversation_id: int,
    session: Session = Depends(get_session),
):
    """Get all messages for a conversation.

    Args:
        user_id: User identifier
        conversation_id: Conversation ID
        session: Database session

    Returns:
        List of messages in the conversation
    """
    conversation_service = ConversationService(session)

    # Verify conversation belongs to user
    try:
        conversation = conversation_service.get_or_create_conversation(
            user_id=user_id,
            conversation_id=conversation_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    # Get messages
    messages = conversation_service.get_conversation_history(
        conversation_id=conversation_id
    )

    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]
    }
