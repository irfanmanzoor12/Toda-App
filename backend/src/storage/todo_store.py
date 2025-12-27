"""Storage abstraction for todo operations."""

from abc import ABC, abstractmethod
from typing import List, Optional

from src.models.todo import Todo


class TodoStore(ABC):
    """Abstract interface for todo storage."""

    @abstractmethod
    def add(self, title: str, description: str = "", user_id: int = None) -> Todo:
        """
        Add a new todo.

        Args:
            title: Todo title
            description: Optional description
            user_id: User ID (for multi-user filtering)

        Returns:
            Created Todo object
        """
        pass

    @abstractmethod
    def get_by_id(self, todo_id: int, user_id: int = None) -> Optional[Todo]:
        """
        Retrieve todo by ID.

        Args:
            todo_id: Todo ID
            user_id: User ID (for multi-user filtering)

        Returns:
            Todo object if found, None otherwise
        """
        pass

    @abstractmethod
    def get_all(self, user_id: int = None) -> List[Todo]:
        """
        Retrieve all todos.

        Args:
            user_id: User ID (for multi-user filtering)

        Returns:
            List of all Todo objects
        """
        pass

    @abstractmethod
    def update(self, todo_id: int, title: Optional[str] = None,
               description: Optional[str] = None, user_id: int = None) -> Todo:
        """
        Update existing todo.

        Args:
            todo_id: Todo ID
            title: New title (optional)
            description: New description (optional)
            user_id: User ID (for multi-user filtering)

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found
        """
        pass

    @abstractmethod
    def delete(self, todo_id: int, user_id: int = None) -> bool:
        """
        Delete todo by ID.

        Args:
            todo_id: Todo ID
            user_id: User ID (for multi-user filtering)

        Returns:
            True if deleted, False if not found
        """
        pass

    @abstractmethod
    def mark_complete(self, todo_id: int, user_id: int = None) -> Todo:
        """
        Mark todo as complete.

        Args:
            todo_id: Todo ID
            user_id: User ID (for multi-user filtering)

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found
        """
        pass
