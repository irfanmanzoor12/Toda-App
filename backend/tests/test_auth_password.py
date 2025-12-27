"""Unit tests for password hashing and verification."""

import pytest
from src.auth.password import hash_password, verify_password


def test_hash_password_returns_string():
    """Test that hash_password returns a non-empty string."""
    password = "test_password_123"
    hashed = hash_password(password)

    assert isinstance(hashed, str)
    assert len(hashed) > 0
    assert hashed != password  # Hash should not equal plain text


def test_hash_password_different_for_same_input():
    """Test that hash_password generates different salts (different hashes for same input)."""
    password = "same_password"
    hash1 = hash_password(password)
    hash2 = hash_password(password)

    # Different salts should produce different hashes
    assert hash1 != hash2


def test_hash_password_empty_raises_error():
    """Test that hash_password raises ValueError for empty password."""
    with pytest.raises(ValueError, match="Password cannot be empty"):
        hash_password("")


def test_verify_password_correct():
    """Test that verify_password returns True for correct password."""
    password = "correct_password_456"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """Test that verify_password returns False for incorrect password."""
    password = "correct_password"
    wrong_password = "wrong_password"
    hashed = hash_password(password)

    assert verify_password(wrong_password, hashed) is False


def test_verify_password_empty_password():
    """Test that verify_password returns False for empty password."""
    hashed = hash_password("some_password")

    assert verify_password("", hashed) is False


def test_verify_password_empty_hash():
    """Test that verify_password returns False for empty hash."""
    assert verify_password("some_password", "") is False


def test_verify_password_invalid_hash():
    """Test that verify_password returns False for invalid hash format."""
    assert verify_password("password", "not_a_valid_bcrypt_hash") is False


def test_verify_password_case_sensitive():
    """Test that password verification is case-sensitive."""
    password = "CaseSensitive"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("casesensitive", hashed) is False
    assert verify_password("CASESENSITIVE", hashed) is False


def test_hash_password_unicode():
    """Test that hash_password works with Unicode characters."""
    password = "pässwörd_emoji🔒"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("password_emoji🔒", hashed) is False
