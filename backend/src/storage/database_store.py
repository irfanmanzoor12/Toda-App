"""Database implementation of TodoStore using SQLModel."""

from typing import List, Optional

from sqlmodel import Session, select

from src.models.todo import Todo, TodoStatus
from src.storage.todo_store import TodoStore


class DatabaseStore(TodoStore):
    """SQLModel database implementation of TodoStore."""

    def __init__(self, db: Session):
        """
        Initialize DatabaseStore with SQLModel session.

        Args:
            db: SQLModel Session
        """
        self.db = db

    def add(self, title: str, description: str = "", user_id: int = None) -> Todo:
        """
        Add a new todo to the database.

        Args:
            title: Todo title
            description: Optional description
            user_id: User ID (required for database)

        Returns:
            Created Todo object

        Raises:
            ValueError: If user_id is not provided
        """
        if user_id is None:
            raise ValueError("user_id is required")

        # Create todo
        todo = Todo(
            title=title,
            description=description,
            status=TodoStatus.PENDING.value,
            user_id=user_id
        )

        # Save to database
        self.db.add(todo)
        self.db.commit()
        self.db.refresh(todo)

        return todo

    def get_by_id(self, todo_id: int, user_id: int = None) -> Optional[Todo]:
        """
        Retrieve todo by ID from database.

        Args:
            todo_id: Todo ID
            user_id: User ID (for ownership filtering)

        Returns:
            Todo object if found and owned by user, None otherwise
        """
        statement = select(Todo).where(Todo.id == todo_id)

        if user_id is not None:
            statement = statement.where(Todo.user_id == user_id)

        todo = self.db.exec(statement).first()
        return todo

    def get_all(self, user_id: int = None) -> List[Todo]:
        """
        Retrieve all todos from database.

        Args:
            user_id: User ID (for filtering by owner)

        Returns:
            List of all Todo objects owned by user
        """
        statement = select(Todo)

        if user_id is not None:
            statement = statement.where(Todo.user_id == user_id)

        todos = self.db.exec(statement).all()
        return list(todos)

    def update(self, todo_id: int, title: Optional[str] = None,
               description: Optional[str] = None, user_id: int = None) -> Todo:
        """
        Update existing todo in database.

        Args:
            todo_id: Todo ID
            title: New title (optional)
            description: New description (optional)
            user_id: User ID (for ownership check)

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found or not owned by user
        """
        # Fetch todo with ownership check
        todo = self.get_by_id(todo_id, user_id)

        if not todo:
            raise KeyError(f"Todo #{todo_id} not found")

        # Update fields
        if title is not None:
            todo.title = title
        if description is not None:
            todo.description = description

        # Save changes
        self.db.add(todo)
        self.db.commit()
        self.db.refresh(todo)

        return todo

    def delete(self, todo_id: int, user_id: int = None) -> bool:
        """
        Delete todo from database.

        Args:
            todo_id: Todo ID
            user_id: User ID (for ownership check)

        Returns:
            True if deleted, False if not found
        """
        # Fetch todo with ownership check
        todo = self.get_by_id(todo_id, user_id)

        if not todo:
            return False

        # Delete from database
        self.db.delete(todo)
        self.db.commit()

        return True

    def mark_complete(self, todo_id: int, user_id: int = None) -> Todo:
        """
        Mark todo as complete in database.

        Args:
            todo_id: Todo ID
            user_id: User ID (for ownership check)

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found or not owned by user
        """
        # Fetch todo with ownership check
        todo = self.get_by_id(todo_id, user_id)

        if not todo:
            raise KeyError(f"Todo #{todo_id} not found")

        # Update status
        todo.status = TodoStatus.COMPLETE.value

        # Save changes
        self.db.add(todo)
        self.db.commit()
        self.db.refresh(todo)

        return todo
