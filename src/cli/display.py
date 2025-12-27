"""Output formatting and display utilities."""

from typing import List
from datetime import datetime

from ..models.todo import Todo, TodoStatus


def format_status(status: TodoStatus) -> str:
    """
    Format todo status with symbol.

    Args:
        status: TodoStatus enum value

    Returns:
        Formatted status string with symbol
    """
    if status == TodoStatus.COMPLETE:
        return "✓ Complete"
    else:
        return "○ Pending"


def format_datetime(dt: datetime) -> str:
    """
    Format datetime for display.

    Args:
        dt: Datetime object

    Returns:
        Formatted datetime string (YYYY-MM-DD HH:MM:SS)
    """
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def format_todo_list(todos: List[Todo]) -> str:
    """
    Format list of todos as a table.

    Args:
        todos: List of Todo objects

    Returns:
        Formatted table string
    """
    if not todos:
        return "No todos found. Use 'todo add <title>' to create one."

    # Header
    lines = [
        "ID  Status      Title                      Created",
        "--  ----------  -------------------------  -------------------"
    ]

    # Rows
    for todo in todos:
        # Truncate title if too long for display
        title_display = todo.title[:25] if len(todo.title) > 25 else todo.title

        line = f"{todo.id:<3} {format_status(todo.status):<11} {title_display:<26} {format_datetime(todo.created_at)}"
        lines.append(line)

    # Footer
    count = len(todos)
    lines.append("")
    lines.append(f"{count} todo(s) found")

    return "\n".join(lines)


def format_todo_detail(todo: Todo) -> str:
    """
    Format single todo with detailed information.

    Args:
        todo: Todo object

    Returns:
        Formatted detail string
    """
    lines = [
        f"Todo #{todo.id}",
        "-" * 9,
        f"Title:       {todo.title}",
    ]

    # Only show description if non-empty
    if todo.description:
        # Handle multi-line descriptions
        desc_lines = todo.description.split('\n')
        lines.append(f"Description: {desc_lines[0]}")
        for desc_line in desc_lines[1:]:
            lines.append(f"             {desc_line}")

    lines.extend([
        f"Status:      {format_status(todo.status)}",
        f"Created:     {format_datetime(todo.created_at)}"
    ])

    return "\n".join(lines)


def format_success(message: str) -> str:
    """
    Format success message.

    Args:
        message: Success message text

    Returns:
        Formatted success message
    """
    return f"✓ {message}"


def format_error(message: str) -> str:
    """
    Format error message.

    Args:
        message: Error message text

    Returns:
        Formatted error message
    """
    return f"Error: {message}"
