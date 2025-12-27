"""Command-line argument parsing and command structure."""

import argparse
import sys

from ..models.todo import TodoStatus
from ..skills.todo_manager import TodoManager
from ..skills.validator import TodoValidator
from .display import format_success, format_error, format_todo_list, format_todo_detail


def create_parser() -> argparse.ArgumentParser:
    """
    Create and configure the main argument parser with all subcommands.

    Returns:
        Configured ArgumentParser instance
    """
    parser = argparse.ArgumentParser(
        prog='todo',
        description='Todo CLI - In-Memory Todo Manager',
        epilog='For more details: todo <command> --help'
    )

    # Global options
    parser.add_argument(
        '--version',
        action='version',
        version='Todo CLI v1.0.0 (Phase I: In-Memory)\nPython 3.13+'
    )

    # Create subparsers for commands
    subparsers = parser.add_subparsers(
        dest='command',
        help='Available commands'
    )

    # Add command
    parser_add = subparsers.add_parser(
        'add',
        help='Create a new todo',
        description='Create a new todo item'
    )
    parser_add.add_argument(
        'title',
        help='Todo title (1-500 characters)'
    )
    parser_add.add_argument(
        '-d', '--description',
        default='',
        help='Optional description (0-2000 characters)'
    )

    # List command
    parser_list = subparsers.add_parser(
        'list',
        help='Display all todos',
        description='Display all todos'
    )

    # Show command
    parser_show = subparsers.add_parser(
        'show',
        help='Show todo details',
        description='Display detailed information for a specific todo'
    )
    parser_show.add_argument(
        'id',
        help='Todo ID (positive integer)'
    )

    # Update command
    parser_update = subparsers.add_parser(
        'update',
        help='Modify an existing todo',
        description="Modify an existing todo's title or description"
    )
    parser_update.add_argument(
        'id',
        help='Todo ID (positive integer)'
    )
    parser_update.add_argument(
        '-t', '--title',
        help='New title (1-500 characters)'
    )
    parser_update.add_argument(
        '-d', '--description',
        help='New description (0-2000 characters)'
    )

    # Complete command
    parser_complete = subparsers.add_parser(
        'complete',
        help='Mark a todo as complete',
        description='Mark a todo as complete'
    )
    parser_complete.add_argument(
        'id',
        help='Todo ID (positive integer)'
    )

    # Delete command
    parser_delete = subparsers.add_parser(
        'delete',
        help='Remove a todo',
        description='Remove a todo permanently'
    )
    parser_delete.add_argument(
        'id',
        help='Todo ID (positive integer)'
    )

    # Help command (in addition to --help)
    parser_help = subparsers.add_parser(
        'help',
        help='Show this help message',
        description='Show help message'
    )

    return parser


def parse_args(args=None):
    """
    Parse command-line arguments.

    Args:
        args: List of argument strings (default: sys.argv[1:])

    Returns:
        Parsed arguments namespace
    """
    parser = create_parser()

    # If no arguments provided, show help
    if args is None:
        args = sys.argv[1:]

    if len(args) == 0:
        parser.print_help()
        sys.exit(0)

    return parser.parse_args(args)


def handle_add(args, manager: TodoManager) -> int:
    """
    Handle the 'add' command.

    Args:
        args: Parsed arguments with 'title' and 'description'
        manager: TodoManager instance

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        # Add todo via TodoManager (validates input)
        todo = manager.add_todo(args.title, args.description)

        # Format and print success message
        message = f'Todo #{todo.id} created: "{todo.title}"'
        print(format_success(message))

        return 0

    except ValueError as e:
        # Handle validation errors
        print(format_error(str(e)), file=sys.stderr)
        return 1


def handle_list(args, manager: TodoManager) -> int:
    """
    Handle the 'list' command.

    Args:
        args: Parsed arguments (none for list command)
        manager: TodoManager instance

    Returns:
        Exit code (always 0)
    """
    # Get all todos from TodoManager
    todos = manager.list_todos()

    # Format and print (handles empty state automatically)
    output = format_todo_list(todos)
    print(output)

    return 0


def handle_show(args, manager: TodoManager) -> int:
    """
    Handle the 'show' command.

    Args:
        args: Parsed arguments with 'id'
        manager: TodoManager instance

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        # Validate ID
        todo_id = TodoValidator.validate_id(args.id)

        # Get todo from TodoManager
        todo = manager.get_todo(todo_id)

        # Check if todo exists
        if todo is None:
            print(format_error(f"Todo #{todo_id} not found"), file=sys.stderr)
            print("Tip: Use 'todo list' to see all available todos", file=sys.stderr)
            return 1

        # Format and print todo details
        output = format_todo_detail(todo)
        print(output)

        return 0

    except ValueError as e:
        # Handle validation errors (invalid ID format)
        print(format_error(str(e)), file=sys.stderr)
        return 1


def handle_complete(args, manager: TodoManager) -> int:
    """
    Handle the 'complete' command.

    Args:
        args: Parsed arguments with 'id'
        manager: TodoManager instance

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        # Validate ID
        todo_id = TodoValidator.validate_id(args.id)

        # Get todo to check current status (for idempotent behavior)
        todo = manager.get_todo(todo_id)

        # Check if todo exists
        if todo is None:
            print(format_error(f"Todo #{todo_id} not found"), file=sys.stderr)
            print("Tip: Use 'todo list' to see all available todos", file=sys.stderr)
            return 1

        # Check if already complete (idempotent handling)
        was_already_complete = (todo.status == TodoStatus.COMPLETE)

        # Mark as complete (idempotent operation)
        manager.mark_complete(todo_id)

        # Show appropriate message based on previous status
        if was_already_complete:
            message = f'Todo #{todo_id} was already complete'
        else:
            message = f'Todo #{todo_id} marked as complete: "{todo.title}"'

        print(format_success(message))
        return 0

    except ValueError as e:
        # Handle validation errors (invalid ID format)
        print(format_error(str(e)), file=sys.stderr)
        return 1
    except KeyError as e:
        # Handle storage errors (should not occur due to pre-check, but for completeness)
        print(format_error(str(e)), file=sys.stderr)
        return 1


def handle_delete(args, manager: TodoManager) -> int:
    """
    Handle the 'delete' command.

    Args:
        args: Parsed arguments with 'id'
        manager: TodoManager instance

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        # Validate ID
        todo_id = TodoValidator.validate_id(args.id)

        # Get todo before deletion to capture title for success message
        todo = manager.get_todo(todo_id)

        # Check if todo exists
        if todo is None:
            print(format_error(f"Todo #{todo_id} not found"), file=sys.stderr)
            print("Tip: Use 'todo list' to see all available todos", file=sys.stderr)
            return 1

        # Delete the todo
        manager.delete_todo(todo_id)

        # Show success message with the deleted todo's title
        message = f'Todo #{todo_id} deleted: "{todo.title}"'
        print(format_success(message))

        return 0

    except ValueError as e:
        # Handle validation errors (invalid ID format)
        print(format_error(str(e)), file=sys.stderr)
        return 1
    except KeyError as e:
        # Handle deletion errors (should not occur due to pre-check, but for completeness)
        print(format_error(str(e)), file=sys.stderr)
        return 1


def handle_update(args, manager: TodoManager) -> int:
    """
    Handle the 'update' command.

    Args:
        args: Parsed arguments with 'id', 'title', and 'description'
        manager: TodoManager instance

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        # Validate ID
        todo_id = TodoValidator.validate_id(args.id)

        # Check that at least one field is provided
        if args.title is None and args.description is None:
            print(format_error("At least one field (--title or --description) must be provided"), file=sys.stderr)
            print("Tip: Use 'todo update <id> --title \"New Title\"' or '--description \"New Description\"'", file=sys.stderr)
            return 1

        # Get todo to verify it exists
        todo = manager.get_todo(todo_id)

        if todo is None:
            print(format_error(f"Todo #{todo_id} not found"), file=sys.stderr)
            print("Tip: Use 'todo list' to see all available todos", file=sys.stderr)
            return 1

        # Update the todo
        updated_todo = manager.update_todo(todo_id, args.title, args.description)

        # Build success message showing what was updated
        updated_fields = []
        if args.title is not None:
            updated_fields.append("title")
        if args.description is not None:
            updated_fields.append("description")

        fields_text = " and ".join(updated_fields)
        message = f'Todo #{todo_id} updated ({fields_text})'
        print(format_success(message))

        return 0

    except ValueError as e:
        # Handle validation errors (invalid ID format or field validation)
        print(format_error(str(e)), file=sys.stderr)
        return 1
    except KeyError as e:
        # Handle storage errors (todo not found)
        print(format_error(str(e)), file=sys.stderr)
        return 1


def handle_help(args, manager: TodoManager) -> int:
    """
    Handle the 'help' command.

    Args:
        args: Parsed arguments (none for help command)
        manager: TodoManager instance (unused)

    Returns:
        Exit code (always 0)
    """
    # Create parser and display help
    parser = create_parser()
    parser.print_help()
    return 0
