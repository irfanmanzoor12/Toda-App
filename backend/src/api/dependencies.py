"""API dependencies for user-scoped queries.

Task: T206 - Combine session and user_id for user-scoped task queries.
"""

from typing import Tuple
from fastapi import Depends
from sqlmodel import Session

from src.database import get_session
from src.auth.jwt import verify_token


def get_user_session(
    session: Session = Depends(get_session),
    user_id: str = Depends(verify_token)
) -> Tuple[Session, str]:
    """Get database session and user_id for user-scoped queries.

    Args:
        session: Database session from T204
        user_id: User ID from JWT via T205

    Returns:
        Tuple of (session, user_id) for filtering queries
    """
    return session, user_id
