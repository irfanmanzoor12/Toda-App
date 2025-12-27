"""Custom exceptions for API error handling."""


class TodoNotFoundError(Exception):
    """Raised when a todo is not found."""
    def __init__(self, todo_id: int):
        self.todo_id = todo_id
        super().__init__(f"Todo with id {todo_id} not found")


class UnauthorizedError(Exception):
    """Raised when user is not authenticated."""
    def __init__(self, message: str = "Not authenticated"):
        self.message = message
        super().__init__(message)


class ForbiddenError(Exception):
    """Raised when user is not authorized to access a resource."""
    def __init__(self, message: str = "Not authorized to access this resource"):
        self.message = message
        super().__init__(message)
