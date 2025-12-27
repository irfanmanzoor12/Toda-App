"""Storage abstraction and in-memory implementation."""

from abc import ABC, abstractmethod
from typing import List, Optional

from ..models.todo import Todo, TodoStatus


class TodoStore(ABC):
    """Abstract interface for todo storage."""

    @abstractmethod
    def add(self, title: str, description: str = "") -> Todo:
        """
        Add a new todo.

        Args:
            title: Todo title
            description: Optional description

        Returns:
            Created Todo object
        """
        pass

    @abstractmethod
    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        """
        Retrieve todo by ID.

        Args:
            todo_id: Todo ID

        Returns:
            Todo object if found, None otherwise
        """
        pass

    @abstractmethod
    def get_all(self) -> List[Todo]:
        """
        Retrieve all todos.

        Returns:
            List of all Todo objects
        """
        pass

    @abstractmethod
    def update(self, todo_id: int, title: Optional[str] = None,
               description: Optional[str] = None) -> Todo:
        """
        Update existing todo.

        Args:
            todo_id: Todo ID
            title: New title (optional)
            description: New description (optional)

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found
        """
        pass

    @abstractmethod
    def delete(self, todo_id: int) -> bool:
        """
        Delete todo by ID.

        Args:
            todo_id: Todo ID

        Returns:
            True if deleted, False if not found
        """
        pass

    @abstractmethod
    def mark_complete(self, todo_id: int) -> Todo:
        """
        Mark todo as complete.

        Args:
            todo_id: Todo ID

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found
        """
        pass


class MemoryStore(TodoStore):
    """In-memory implementation of TodoStore."""

    def __init__(self):
        """Initialize empty in-memory storage."""
        self._todos: dict[int, Todo] = {}
        self._next_id: int = 1

    def add(self, title: str, description: str = "") -> Todo:
        """Add a new todo to memory."""
        todo = Todo(
            id=self._next_id,
            title=title,
            description=description
        )
        self._todos[todo.id] = todo
        self._next_id += 1
        return todo

    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        """Retrieve todo by ID from memory."""
        return self._todos.get(todo_id)

    def get_all(self) -> List[Todo]:
        """Retrieve all todos from memory."""
        return list(self._todos.values())

    def update(self, todo_id: int, title: Optional[str] = None,
               description: Optional[str] = None) -> Todo:
        """Update existing todo in memory."""
        if todo_id not in self._todos:
            raise KeyError(f"Todo #{todo_id} not found")

        todo = self._todos[todo_id]
        if title is not None:
            todo.title = title
        if description is not None:
            todo.description = description
        return todo

    def delete(self, todo_id: int) -> bool:
        """Delete todo from memory."""
        if todo_id in self._todos:
            del self._todos[todo_id]
            return True
        return False

    def mark_complete(self, todo_id: int) -> Todo:
        """Mark todo as complete in memory."""
        if todo_id not in self._todos:
            raise KeyError(f"Todo #{todo_id} not found")

        todo = self._todos[todo_id]
        todo.status = TodoStatus.COMPLETE
        return todo
