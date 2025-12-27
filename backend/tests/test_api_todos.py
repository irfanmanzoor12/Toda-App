"""Integration tests for todo API endpoints."""

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


@pytest.fixture(name="auth_token")
def auth_token_fixture(client: TestClient):
    """Create a user and return auth token."""
    client.post(
        "/api/auth/register",
        json={"email": "todouser@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "todouser@example.com", "password": "password123"}
    )
    return response.json()["access_token"]


def test_create_todo_success(client: TestClient, auth_token: str):
    """Test creating a new todo."""
    response = client.post(
        "/api/todos",
        json={"title": "Test Todo", "description": "Test description"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["description"] == "Test description"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data
    assert "user_id" in data


def test_create_todo_no_auth(client: TestClient):
    """Test creating todo without authentication."""
    response = client.post(
        "/api/todos",
        json={"title": "Test Todo"}
    )

    assert response.status_code == 401


def test_create_todo_empty_title(client: TestClient, auth_token: str):
    """Test creating todo with empty title."""
    response = client.post(
        "/api/todos",
        json={"title": "", "description": "Description"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 422  # Validation error


def test_create_todo_title_too_long(client: TestClient, auth_token: str):
    """Test creating todo with title exceeding max length."""
    long_title = "a" * 501
    response = client.post(
        "/api/todos",
        json={"title": long_title},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 422  # Validation error


def test_list_todos_empty(client: TestClient, auth_token: str):
    """Test listing todos when none exist."""
    response = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    assert response.json() == []


def test_list_todos_with_items(client: TestClient, auth_token: str):
    """Test listing todos with multiple items."""
    # Create todos
    client.post(
        "/api/todos",
        json={"title": "Todo 1"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    client.post(
        "/api/todos",
        json={"title": "Todo 2", "description": "Second todo"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    # List todos
    response = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "Todo 1"
    assert data[1]["title"] == "Todo 2"


def test_list_todos_user_isolation(client: TestClient):
    """Test that users can only see their own todos."""
    # Create user 1
    client.post(
        "/api/auth/register",
        json={"email": "user1@example.com", "password": "password123"}
    )
    login1 = client.post(
        "/api/auth/login",
        json={"email": "user1@example.com", "password": "password123"}
    )
    token1 = login1.json()["access_token"]

    # Create user 2
    client.post(
        "/api/auth/register",
        json={"email": "user2@example.com", "password": "password123"}
    )
    login2 = client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "password123"}
    )
    token2 = login2.json()["access_token"]

    # User 1 creates todos
    client.post(
        "/api/todos",
        json={"title": "User 1 Todo"},
        headers={"Authorization": f"Bearer {token1}"}
    )

    # User 2 creates todos
    client.post(
        "/api/todos",
        json={"title": "User 2 Todo"},
        headers={"Authorization": f"Bearer {token2}"}
    )

    # User 1 lists todos
    response1 = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert len(response1.json()) == 1
    assert response1.json()[0]["title"] == "User 1 Todo"

    # User 2 lists todos
    response2 = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert len(response2.json()) == 1
    assert response2.json()[0]["title"] == "User 2 Todo"


def test_get_todo_success(client: TestClient, auth_token: str):
    """Test getting a specific todo."""
    # Create todo
    create_response = client.post(
        "/api/todos",
        json={"title": "Specific Todo"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    todo_id = create_response.json()["id"]

    # Get todo
    response = client.get(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    assert response.json()["id"] == todo_id
    assert response.json()["title"] == "Specific Todo"


def test_get_todo_not_found(client: TestClient, auth_token: str):
    """Test getting nonexistent todo."""
    response = client.get(
        "/api/todos/99999",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 404


def test_update_todo_success(client: TestClient, auth_token: str):
    """Test updating a todo."""
    # Create todo
    create_response = client.post(
        "/api/todos",
        json={"title": "Original Title", "description": "Original"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    todo_id = create_response.json()["id"]

    # Update todo
    response = client.put(
        f"/api/todos/{todo_id}",
        json={"title": "Updated Title", "description": "Updated"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == todo_id
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated"


def test_update_todo_partial(client: TestClient, auth_token: str):
    """Test partial update (only title)."""
    # Create todo
    create_response = client.post(
        "/api/todos",
        json={"title": "Original", "description": "Keep this"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    todo_id = create_response.json()["id"]

    # Update only title
    response = client.put(
        f"/api/todos/{todo_id}",
        json={"title": "New Title"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    assert response.json()["title"] == "New Title"
    assert response.json()["description"] == "Keep this"


def test_complete_todo_success(client: TestClient, auth_token: str):
    """Test marking todo as complete."""
    # Create todo
    create_response = client.post(
        "/api/todos",
        json={"title": "To Complete"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    todo_id = create_response.json()["id"]
    assert create_response.json()["status"] == "pending"

    # Mark complete
    response = client.patch(
        f"/api/todos/{todo_id}/complete",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "complete"


def test_delete_todo_success(client: TestClient, auth_token: str):
    """Test deleting a todo."""
    # Create todo
    create_response = client.post(
        "/api/todos",
        json={"title": "To Delete"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    todo_id = create_response.json()["id"]

    # Delete todo
    response = client.delete(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert get_response.status_code == 404


def test_delete_todo_not_found(client: TestClient, auth_token: str):
    """Test deleting nonexistent todo."""
    response = client.delete(
        "/api/todos/99999",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 404


def test_todo_crud_flow(client: TestClient, auth_token: str):
    """Test complete CRUD flow for todos."""
    # Create
    create_response = client.post(
        "/api/todos",
        json={"title": "CRUD Todo", "description": "Test CRUD"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert create_response.status_code == 201
    todo_id = create_response.json()["id"]

    # Read (list)
    list_response = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert len(list_response.json()) == 1

    # Read (get)
    get_response = client.get(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert get_response.status_code == 200

    # Update
    update_response = client.put(
        f"/api/todos/{todo_id}",
        json={"title": "Updated CRUD Todo"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Updated CRUD Todo"

    # Complete
    complete_response = client.patch(
        f"/api/todos/{todo_id}/complete",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "complete"

    # Delete
    delete_response = client.delete(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert delete_response.status_code == 204
