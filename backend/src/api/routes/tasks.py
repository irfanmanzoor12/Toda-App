"""Task CRUD API endpoints with user ownership enforcement.

Task: T207 - Implement Task CRUD API endpoints filtered by user_id.
"""

from typing import List, Tuple
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.models import Todo
from src.api.dependencies import get_user_session

router = APIRouter(prefix="/api", tags=["tasks"])


@router.post("/{user_id}/tasks", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_task(
    user_id: str,
    todo: Todo,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Create a new task for the authenticated user."""
    session, jwt_user_id = deps

    todo.user_id = jwt_user_id
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.get("/{user_id}/tasks", response_model=List[Todo])
def list_tasks(
    user_id: str,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """List all tasks for the authenticated user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.user_id == jwt_user_id)
    tasks = session.exec(statement).all()
    return tasks


@router.get("/{user_id}/tasks/{task_id}", response_model=Todo)
def get_task(
    user_id: str,
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Get a specific task by ID. Returns 404 if not found or not owned by user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.id == task_id, Todo.user_id == jwt_user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.put("/{user_id}/tasks/{task_id}", response_model=Todo)
def update_task(
    user_id: str,
    task_id: int,
    updated_task: Todo,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Update a task. Returns 404 if not found or not owned by user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.id == task_id, Todo.user_id == jwt_user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=Todo)
def complete_task(
    user_id: str,
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Mark a task as complete. Returns 404 if not found or not owned by user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.id == task_id, Todo.user_id == jwt_user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.completed = True

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    user_id: str,
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Delete a task. Returns 404 if not found or not owned by user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.id == task_id, Todo.user_id == jwt_user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    session.delete(task)
    session.commit()
