"""Core todo operations - business logic layer."""

from typing import List, Optional

from src.models.todo import Todo
from src.storage.todo_store import TodoStore
from src.skills.validator import TodoValidator


class TodoManager:
    """Manages todo operations with business logic."""

    def __init__(self, store: TodoStore):
        """
        Initialize TodoManager with storage backend.

        Args:
            store: TodoStore implementation
        """
        self.store = store

    def add_todo(self, title: str, description: str = "") -> Todo:
        """
        Add a new todo with validation.

        Args:
            title: Todo title
            description: Optional description

        Returns:
            Created Todo object

        Raises:
            ValueError: If validation fails
        """
        # Validate inputs
        validated_title = TodoValidator.validate_title(title)
        validated_description = TodoValidator.validate_description(description)

        # Create todo via storage
        todo = self.store.add(validated_title, validated_description)

        return todo

    def list_todos(self) -> List[Todo]:
        """
        Retrieve all todos from storage.

        Returns:
            List of all Todo objects
        """
        return self.store.get_all()

    def get_todo(self, todo_id: int) -> Optional[Todo]:
        """
        Retrieve a specific todo by ID.

        Args:
            todo_id: Todo ID

        Returns:
            Todo object if found, None otherwise
        """
        return self.store.get_by_id(todo_id)

    def mark_complete(self, todo_id: int) -> Todo:
        """
        Mark a todo as complete.

        Args:
            todo_id: Todo ID

        Returns:
            Updated Todo object

        Raises:
            KeyError: If todo not found
        """
        return self.store.mark_complete(todo_id)

    def delete_todo(self, todo_id: int) -> bool:
        """
        Delete a todo permanently.

        Args:
            todo_id: Todo ID

        Returns:
            True if deleted, False if not found

        Raises:
            KeyError: If todo not found
        """
        deleted = self.store.delete(todo_id)
        if not deleted:
            raise KeyError(f"Todo #{todo_id} not found")
        return deleted

    def update_todo(self, todo_id: int, title: Optional[str] = None,
                    description: Optional[str] = None) -> Todo:
        """
        Update an existing todo's title and/or description.

        Args:
            todo_id: Todo ID
            title: New title (optional, validated if provided)
            description: New description (optional, validated if provided)

        Returns:
            Updated Todo object

        Raises:
            ValueError: If validation fails
            KeyError: If todo not found
        """
        # Validate inputs if provided
        validated_title = None
        validated_description = None

        if title is not None:
            validated_title = TodoValidator.validate_title(title)

        if description is not None:
            validated_description = TodoValidator.validate_description(description)

        # Update via storage
        return self.store.update(todo_id, validated_title, validated_description)
