"""Unit tests for JWT token creation and validation."""

import os
import time
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
import jwt as pyjwt

from src.auth.jwt import create_access_token, decode_access_token, JWT_SECRET, JWT_ALGORITHM


def test_create_access_token_returns_string():
    """Test that create_access_token returns a non-empty string."""
    token = create_access_token(user_id=1, email="test@example.com")

    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_contains_user_data():
    """Test that created token contains user_id and email."""
    user_id = 123
    email = "user@example.com"

    token = create_access_token(user_id=user_id, email=email)
    payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    assert payload["user_id"] == user_id
    assert payload["email"] == email


def test_create_access_token_has_expiration():
    """Test that created token has expiration claim."""
    token = create_access_token(user_id=1, email="test@example.com")
    payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    assert "exp" in payload
    assert "iat" in payload

    # Verify expiration is in the future
    expiration = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    now = datetime.now(timezone.utc)
    assert expiration > now


def test_create_access_token_invalid_user_id():
    """Test that create_access_token raises ValueError for invalid user_id."""
    with pytest.raises(ValueError, match="user_id must be a positive integer"):
        create_access_token(user_id=0, email="test@example.com")

    with pytest.raises(ValueError, match="user_id must be a positive integer"):
        create_access_token(user_id=-1, email="test@example.com")


def test_create_access_token_empty_email():
    """Test that create_access_token raises ValueError for empty email."""
    with pytest.raises(ValueError, match="email cannot be empty"):
        create_access_token(user_id=1, email="")

    with pytest.raises(ValueError, match="email cannot be empty"):
        create_access_token(user_id=1, email="   ")


def test_create_access_token_trims_email():
    """Test that create_access_token trims whitespace from email."""
    token = create_access_token(user_id=1, email="  test@example.com  ")
    payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    assert payload["email"] == "test@example.com"


def test_decode_access_token_valid():
    """Test that decode_access_token decodes valid tokens."""
    user_id = 456
    email = "valid@example.com"

    token = create_access_token(user_id=user_id, email=email)
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["user_id"] == user_id
    assert payload["email"] == email


def test_decode_access_token_expired():
    """Test that decode_access_token returns None for expired tokens."""
    # Create a token with past expiration
    past_expiration = datetime.now(timezone.utc) - timedelta(hours=1)
    payload = {
        "user_id": 1,
        "email": "test@example.com",
        "exp": past_expiration,
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
    }
    expired_token = pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    result = decode_access_token(expired_token)
    assert result is None


def test_decode_access_token_invalid_signature():
    """Test that decode_access_token returns None for tokens with invalid signature."""
    # Create a token with wrong secret
    token = pyjwt.encode(
        {"user_id": 1, "email": "test@example.com"},
        "wrong_secret",
        algorithm=JWT_ALGORITHM
    )

    result = decode_access_token(token)
    assert result is None


def test_decode_access_token_malformed():
    """Test that decode_access_token returns None for malformed tokens."""
    assert decode_access_token("not.a.valid.jwt") is None
    assert decode_access_token("malformed") is None


def test_decode_access_token_empty():
    """Test that decode_access_token returns None for empty tokens."""
    assert decode_access_token("") is None
    assert decode_access_token("   ") is None


def test_decode_access_token_missing_fields():
    """Test that decode_access_token returns None for tokens missing required fields."""
    # Token without user_id
    token_no_user_id = pyjwt.encode(
        {"email": "test@example.com", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    assert decode_access_token(token_no_user_id) is None

    # Token without email
    token_no_email = pyjwt.encode(
        {"user_id": 1, "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    assert decode_access_token(token_no_email) is None


def test_decode_access_token_trims_whitespace():
    """Test that decode_access_token handles tokens with surrounding whitespace."""
    token = create_access_token(user_id=1, email="test@example.com")
    token_with_whitespace = f"  {token}  "

    payload = decode_access_token(token_with_whitespace)
    assert payload is not None
    assert payload["user_id"] == 1


def test_token_roundtrip():
    """Test creating and decoding a token (full roundtrip)."""
    user_id = 789
    email = "roundtrip@example.com"

    # Create token
    token = create_access_token(user_id=user_id, email=email)

    # Decode token
    payload = decode_access_token(token)

    # Verify payload
    assert payload is not None
    assert payload["user_id"] == user_id
    assert payload["email"] == email
    assert "exp" in payload
    assert "iat" in payload
