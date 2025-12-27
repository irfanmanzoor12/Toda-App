"""Unit tests for user authentication service."""

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.models.user import User
from src.auth.service import register_user, authenticate_user


@pytest.fixture
def db_session():
    """Create a test database session with in-memory SQLite."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


def test_register_user_success(db_session):
    """Test successful user registration."""
    email = "test@example.com"
    password = "secure_password_123"

    user = register_user(db_session, email, password)

    assert user.id is not None
    assert user.email == email.lower()
    assert user.password_hash != password  # Password should be hashed
    assert len(user.password_hash) > 0
    assert user.created_at is not None


def test_register_user_email_normalized(db_session):
    """Test that email is normalized to lowercase."""
    user = register_user(db_session, "TEST@EXAMPLE.COM", "password123")

    assert user.email == "test@example.com"


def test_register_user_email_trimmed(db_session):
    """Test that email whitespace is trimmed."""
    user = register_user(db_session, "  test@example.com  ", "password123")

    assert user.email == "test@example.com"


def test_register_user_empty_email(db_session):
    """Test that empty email raises ValueError."""
    with pytest.raises(ValueError, match="Email cannot be empty"):
        register_user(db_session, "", "password123")

    with pytest.raises(ValueError, match="Email cannot be empty"):
        register_user(db_session, "   ", "password123")


def test_register_user_invalid_email_format(db_session):
    """Test that invalid email format raises ValueError."""
    with pytest.raises(ValueError, match="Invalid email format"):
        register_user(db_session, "not-an-email", "password123")

    with pytest.raises(ValueError, match="Invalid email format"):
        register_user(db_session, "missing-domain@", "password123")

    with pytest.raises(ValueError, match="Invalid email format"):
        register_user(db_session, "@missing-local.com", "password123")


def test_register_user_duplicate_email(db_session):
    """Test that duplicate email raises ValueError."""
    email = "duplicate@example.com"
    password = "password123"

    # Register first user
    register_user(db_session, email, password)

    # Try to register with same email
    with pytest.raises(ValueError, match="Email already registered"):
        register_user(db_session, email, password)


def test_register_user_duplicate_email_case_insensitive(db_session):
    """Test that duplicate email check is case-insensitive."""
    register_user(db_session, "test@example.com", "password123")

    with pytest.raises(ValueError, match="Email already registered"):
        register_user(db_session, "TEST@EXAMPLE.COM", "password123")


def test_register_user_empty_password(db_session):
    """Test that empty password raises ValueError."""
    with pytest.raises(ValueError, match="Password cannot be empty"):
        register_user(db_session, "test@example.com", "")


def test_register_user_short_password(db_session):
    """Test that password shorter than 8 characters raises ValueError."""
    with pytest.raises(ValueError, match="Password must be at least 8 characters"):
        register_user(db_session, "test@example.com", "short")

    with pytest.raises(ValueError, match="Password must be at least 8 characters"):
        register_user(db_session, "test@example.com", "1234567")


def test_register_user_minimum_password_length(db_session):
    """Test that 8-character password is accepted."""
    user = register_user(db_session, "test@example.com", "12345678")

    assert user is not None
    assert user.email == "test@example.com"


def test_authenticate_user_success(db_session):
    """Test successful user authentication."""
    email = "auth@example.com"
    password = "correct_password_123"

    # Register user
    registered_user = register_user(db_session, email, password)

    # Authenticate with correct credentials
    authenticated_user = authenticate_user(db_session, email, password)

    assert authenticated_user is not None
    assert authenticated_user.id == registered_user.id
    assert authenticated_user.email == registered_user.email


def test_authenticate_user_wrong_password(db_session):
    """Test that wrong password returns None."""
    email = "auth@example.com"
    correct_password = "correct_password_123"
    wrong_password = "wrong_password_456"

    # Register user
    register_user(db_session, email, correct_password)

    # Authenticate with wrong password
    result = authenticate_user(db_session, email, wrong_password)

    assert result is None


def test_authenticate_user_nonexistent_email(db_session):
    """Test that nonexistent email returns None."""
    result = authenticate_user(db_session, "nonexistent@example.com", "password123")

    assert result is None


def test_authenticate_user_empty_email(db_session):
    """Test that empty email returns None."""
    assert authenticate_user(db_session, "", "password123") is None


def test_authenticate_user_empty_password(db_session):
    """Test that empty password returns None."""
    email = "test@example.com"
    register_user(db_session, email, "password123")

    assert authenticate_user(db_session, email, "") is None


def test_authenticate_user_email_normalized(db_session):
    """Test that authentication normalizes email to lowercase."""
    email = "test@example.com"
    password = "password123"

    # Register user
    register_user(db_session, email, password)

    # Authenticate with uppercase email
    user = authenticate_user(db_session, "TEST@EXAMPLE.COM", password)

    assert user is not None
    assert user.email == email.lower()


def test_authenticate_user_email_trimmed(db_session):
    """Test that authentication trims email whitespace."""
    email = "test@example.com"
    password = "password123"

    # Register user
    register_user(db_session, email, password)

    # Authenticate with whitespace
    user = authenticate_user(db_session, "  test@example.com  ", password)

    assert user is not None
    assert user.email == email


def test_authenticate_user_case_sensitive_password(db_session):
    """Test that password authentication is case-sensitive."""
    email = "test@example.com"
    password = "CaseSensitive123"

    # Register user
    register_user(db_session, email, password)

    # Correct password
    assert authenticate_user(db_session, email, password) is not None

    # Wrong case
    assert authenticate_user(db_session, email, "casesensitive123") is None
    assert authenticate_user(db_session, email, "CASESENSITIVE123") is None


def test_register_multiple_users(db_session):
    """Test registering multiple users with different emails."""
    user1 = register_user(db_session, "user1@example.com", "password123")
    user2 = register_user(db_session, "user2@example.com", "password456")
    user3 = register_user(db_session, "user3@example.com", "password789")

    assert user1.id != user2.id != user3.id
    assert user1.email != user2.email != user3.email


def test_authenticate_correct_user_among_multiple(db_session):
    """Test authenticating the correct user when multiple users exist."""
    # Register multiple users
    register_user(db_session, "user1@example.com", "password1")
    user2 = register_user(db_session, "user2@example.com", "password2")
    register_user(db_session, "user3@example.com", "password3")

    # Authenticate user2
    authenticated = authenticate_user(db_session, "user2@example.com", "password2")

    assert authenticated is not None
    assert authenticated.id == user2.id
    assert authenticated.email == "user2@example.com"

    # Wrong password for user2
    assert authenticate_user(db_session, "user2@example.com", "password1") is None
