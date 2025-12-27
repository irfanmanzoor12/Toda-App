"""Password hashing and verification using bcrypt."""

import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt with cost factor 12.

    Args:
        password: Plain-text password to hash

    Returns:
        Bcrypt hashed password as a string

    Raises:
        ValueError: If password is empty
    """
    if not password:
        raise ValueError("Password cannot be empty")

    # Generate salt and hash password with cost factor 12
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)

    # Return as string (decode from bytes)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.

    Args:
        password: Plain-text password to verify
        hashed: Bcrypt hashed password

    Returns:
        True if password matches hash, False otherwise
    """
    if not password or not hashed:
        return False

    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        # Invalid hash format or other bcrypt errors
        return False
