"""Todo CRUD API routes."""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.api.dependencies import get_db, get_current_user
from src.api.schemas import TodoCreate, TodoUpdate, TodoResponse
from src.api.exceptions import TodoNotFoundError, ForbiddenError
from src.models.user import User
from src.storage.database_store import DatabaseStore
from src.skills.todo_manager import TodoManager

router = APIRouter(prefix="/api/todos", tags=["Todos"])


def get_todo_manager(db: Annotated[Session, Depends(get_db)]) -> TodoManager:
    """Dependency to get TodoManager with DatabaseStore."""
    store = DatabaseStore(db)
    return TodoManager(store)


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo_data: TodoCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new todo for the authenticated user.

    Args:
        todo_data: Todo creation data (title, description)
        current_user: Authenticated user
        db: Database session

    Returns:
        Created todo

    Raises:
        HTTPException 400: If validation fails
    """
    try:
        store = DatabaseStore(db)
        store.db = db  # Ensure session is set

        # Create todo with user_id
        todo = store.add(
            title=todo_data.title,
            description=todo_data.description,
            user_id=current_user.id
        )

        return TodoResponse.model_validate(todo)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[TodoResponse])
def list_todos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    List all todos for the authenticated user.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        List of user's todos
    """
    store = DatabaseStore(db)

    # Get todos filtered by user_id
    todos = store.get_all(user_id=current_user.id)

    return [TodoResponse.model_validate(todo) for todo in todos]


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
    todo_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get a specific todo by ID.

    Args:
        todo_id: Todo ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Todo details

    Raises:
        HTTPException 404: If todo not found
        HTTPException 403: If todo doesn't belong to user
    """
    store = DatabaseStore(db)

    # Get todo with ownership check
    todo = store.get_by_id(todo_id, user_id=current_user.id)

    if not todo:
        raise TodoNotFoundError(todo_id)

    return TodoResponse.model_validate(todo)


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update a todo's title and/or description.

    Args:
        todo_id: Todo ID
        todo_data: Update data (title, description)
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated todo

    Raises:
        HTTPException 404: If todo not found
        HTTPException 403: If todo doesn't belong to user
        HTTPException 400: If validation fails
    """
    try:
        store = DatabaseStore(db)

        # Update with ownership check
        todo = store.update(
            todo_id,
            title=todo_data.title,
            description=todo_data.description,
            user_id=current_user.id
        )

        return TodoResponse.model_validate(todo)
    except KeyError:
        raise TodoNotFoundError(todo_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{todo_id}/complete", response_model=TodoResponse)
def complete_todo(
    todo_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Mark a todo as complete.

    Args:
        todo_id: Todo ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated todo

    Raises:
        HTTPException 404: If todo not found
        HTTPException 403: If todo doesn't belong to user
    """
    try:
        store = DatabaseStore(db)

        # Mark complete with ownership check
        todo = store.mark_complete(todo_id, user_id=current_user.id)

        return TodoResponse.model_validate(todo)
    except KeyError:
        raise TodoNotFoundError(todo_id)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete a todo permanently.

    Args:
        todo_id: Todo ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException 404: If todo not found
        HTTPException 403: If todo doesn't belong to user
    """
    store = DatabaseStore(db)

    # Delete with ownership check
    deleted = store.delete(todo_id, user_id=current_user.id)

    if not deleted:
        raise TodoNotFoundError(todo_id)

    return None
