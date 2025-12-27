"""JWT token creation and validation."""

import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))


def create_access_token(user_id: int, email: str) -> str:
    """
    Create a JWT access token for a user.

    Args:
        user_id: The user's database ID
        email: The user's email address

    Returns:
        JWT token as a string

    Raises:
        ValueError: If user_id or email is invalid
    """
    if not user_id or user_id <= 0:
        raise ValueError("user_id must be a positive integer")
    if not email or not email.strip():
        raise ValueError("email cannot be empty")

    # Calculate expiration time
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)

    # Create payload
    payload = {
        "user_id": user_id,
        "email": email.strip(),
        "exp": expiration,
        "iat": datetime.now(timezone.utc),
    }

    # Encode and return token
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def decode_access_token(token: str) -> Optional[Dict]:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict containing user_id and email, or None if invalid

    Note:
        Returns None for expired, invalid, or malformed tokens
    """
    if not token or not token.strip():
        return None

    try:
        # Decode and verify token
        payload = jwt.decode(
            token.strip(),
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        # Validate required fields
        if "user_id" not in payload or "email" not in payload:
            return None

        return payload

    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Invalid token (malformed, wrong signature, etc.)
        return None
    except Exception:
        # Any other error
        return None
