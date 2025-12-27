"""Integration tests for authentication API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.api.main import app
from src.api.dependencies import get_db


# Test database setup
@pytest.fixture(name="db_session")
def db_session_fixture():
    """Create a test database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    """Create a test client with test database."""
    def get_db_override():
        return db_session

    app.dependency_overrides[get_db] = get_db_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_register_user_success(client: TestClient):
    """Test successful user registration."""
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "created_at" in data
    assert "password" not in data


def test_register_user_duplicate_email(client: TestClient):
    """Test registration with duplicate email."""
    # Register first user
    client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"}
    )

    # Try to register with same email
    response = client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password456"}
    )

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_user_invalid_email(client: TestClient):
    """Test registration with invalid email."""
    response = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "password123"}
    )

    assert response.status_code == 422  # Validation error


def test_register_user_short_password(client: TestClient):
    """Test registration with short password."""
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "short"}
    )

    assert response.status_code == 422  # Validation error


def test_login_success(client: TestClient):
    """Test successful login."""
    # Register user
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "password123"}
    )

    # Login
    response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_login_wrong_password(client: TestClient):
    """Test login with wrong password."""
    # Register user
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    # Login with wrong password
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"}
    )

    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_login_nonexistent_user(client: TestClient):
    """Test login with nonexistent user."""
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"}
    )

    assert response.status_code == 401


def test_get_me_success(client: TestClient):
    """Test getting current user info."""
    # Register and login
    client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "password123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"email": "me@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert "id" in data
    assert "created_at" in data


def test_get_me_no_token(client: TestClient):
    """Test getting current user without token."""
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_get_me_invalid_token(client: TestClient):
    """Test getting current user with invalid token."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_auth_flow_complete(client: TestClient):
    """Test complete authentication flow."""
    # 1. Register
    register_response = client.post(
        "/api/auth/register",
        json={"email": "flow@example.com", "password": "password123"}
    )
    assert register_response.status_code == 201
    user_id = register_response.json()["id"]

    # 2. Login
    login_response = client.post(
        "/api/auth/login",
        json={"email": "flow@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # 3. Access protected endpoint
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["id"] == user_id
