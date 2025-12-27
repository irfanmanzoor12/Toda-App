"""Input validation logic for todo operations."""


class TodoValidator:
    """Validates todo-related inputs."""

    MAX_TITLE_LENGTH = 500
    MAX_DESCRIPTION_LENGTH = 2000

    @staticmethod
    def validate_title(title: str) -> str:
        """
        Validate and normalize title.

        Args:
            title: The title to validate

        Returns:
            Normalized title (trimmed)

        Raises:
            ValueError: If title is invalid
        """
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")

        normalized = title.strip()
        if len(normalized) > TodoValidator.MAX_TITLE_LENGTH:
            raise ValueError(f"Title cannot exceed {TodoValidator.MAX_TITLE_LENGTH} characters")

        return normalized

    @staticmethod
    def validate_description(description: str) -> str:
        """
        Validate description.

        Args:
            description: The description to validate

        Returns:
            The description (unchanged)

        Raises:
            ValueError: If description is invalid
        """
        if len(description) > TodoValidator.MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description cannot exceed {TodoValidator.MAX_DESCRIPTION_LENGTH} characters")

        return description

    @staticmethod
    def validate_id(todo_id: str) -> int:
        """
        Validate and parse todo ID.

        Args:
            todo_id: The ID string to validate

        Returns:
            Parsed integer ID

        Raises:
            ValueError: If ID is invalid
        """
        try:
            id_int = int(todo_id)
            if id_int <= 0:
                raise ValueError("Todo ID must be a positive integer")
            return id_int
        except ValueError:
            raise ValueError(f"Invalid todo ID: '{todo_id}'. Must be a positive integer.")
