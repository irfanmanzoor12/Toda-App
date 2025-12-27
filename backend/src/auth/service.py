"""User authentication service for registration and login."""

from typing import Optional
from sqlmodel import Session, select

from src.models.user import User
from src.auth.password import hash_password, verify_password


def register_user(db: Session, email: str, password: str) -> User:
    """
    Register a new user with email and password.

    Args:
        db: Database session
        email: User's email address (must be unique)
        password: Plain-text password (will be hashed)

    Returns:
        Created User instance

    Raises:
        ValueError: If email is empty, invalid, or already exists
        ValueError: If password is empty or too short
    """
    # Validate email
    if not email or not email.strip():
        raise ValueError("Email cannot be empty")

    email = email.strip().lower()

    # Basic email format validation
    if "@" not in email:
        raise ValueError("Invalid email format")

    parts = email.split("@")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError("Invalid email format")

    if "." not in parts[1]:
        raise ValueError("Invalid email format")

    # Check if email already exists
    statement = select(User).where(User.email == email)
    existing_user = db.exec(statement).first()

    if existing_user:
        raise ValueError("Email already registered")

    # Validate password
    if not password:
        raise ValueError("Password cannot be empty")

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    # Hash password
    password_hash = hash_password(password)

    # Create user
    user = User(email=email, password_hash=password_hash)

    # Save to database
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password.

    Args:
        db: Database session
        email: User's email address
        password: Plain-text password to verify

    Returns:
        User instance if credentials are valid, None otherwise
    """
    if not email or not password:
        return None

    email = email.strip().lower()

    # Find user by email
    statement = select(User).where(User.email == email)
    user = db.exec(statement).first()

    if not user:
        return None

    # Verify password
    if not verify_password(password, user.password_hash):
        return None

    return user
