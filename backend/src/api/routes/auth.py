"""Authentication API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.api.dependencies import get_db, get_current_user
from src.api.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from src.auth.service import register_user, authenticate_user
from src.auth.jwt import create_access_token
from src.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserRegister,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a new user account.

    Args:
        user_data: User registration data (email, password)
        db: Database session

    Returns:
        Created user information (without password)

    Raises:
        HTTPException 400: If email already registered or validation fails
    """
    try:
        user = register_user(db, user_data.email, user_data.password)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Login with email and password to receive JWT token.

    Args:
        credentials: Login credentials (email, password)
        db: Database session

    Returns:
        JWT access token

    Raises:
        HTTPException 401: If credentials are invalid
    """
    user = authenticate_user(db, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token
    access_token = create_access_token(user.id, user.email)

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get current authenticated user information.

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        Current user information
    """
    return UserResponse.model_validate(current_user)
