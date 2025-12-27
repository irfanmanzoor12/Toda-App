"""Main entry point for the Todo CLI application."""

import sys

from ..storage.memory_store import MemoryStore
from ..skills.todo_manager import TodoManager
from .commands import (
    parse_args,
    handle_add,
    handle_list,
    handle_show,
    handle_update,
    handle_complete,
    handle_delete,
    handle_help
)


def main():
    """
    Main entry point for the Todo CLI.

    Initializes storage and TodoManager, parses arguments,
    and dispatches to appropriate command handler.

    Returns:
        Exit code (0 for success, 1 for error, 130 for Ctrl+C)
    """
    try:
        # Initialize storage and manager
        store = MemoryStore()
        manager = TodoManager(store)

        # Parse command-line arguments
        args = parse_args()

        # Dispatch to appropriate handler based on command
        if args.command == 'add':
            return handle_add(args, manager)
        elif args.command == 'list':
            return handle_list(args, manager)
        elif args.command == 'show':
            return handle_show(args, manager)
        elif args.command == 'update':
            return handle_update(args, manager)
        elif args.command == 'complete':
            return handle_complete(args, manager)
        elif args.command == 'delete':
            return handle_delete(args, manager)
        elif args.command == 'help':
            return handle_help(args, manager)
        else:
            # No command specified (should be handled by parse_args, but for safety)
            print("No command specified. Use 'todo --help' for usage information.", file=sys.stderr)
            return 1

    except KeyboardInterrupt:
        # Graceful Ctrl+C handling
        print("\nExiting...", file=sys.stderr)
        return 130


if __name__ == '__main__':
    sys.exit(main())
