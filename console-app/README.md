# Todo Console App - Phase I

Hackathon II: In-Memory Python Console Application

## Features

- ✅ **Add Task** - Create new todo items with title and optional description
- ✅ **Delete Task** - Remove tasks from the list
- ✅ **Update Task** - Modify existing task details
- ✅ **View Tasks** - Display all tasks with status indicators
- ✅ **Mark Complete** - Toggle task completion status

## Requirements

- Python 3.10+
- No external dependencies (uses only standard library)

## Usage

```bash
# Run the console app
cd console-app
python main.py

# Or with UV
uv run main.py
```

## Menu Options

1. **Add Task** - Create a new task
2. **View All Tasks** - List all tasks (pending and completed)
3. **Update Task** - Modify task title or description
4. **Delete Task** - Remove a task permanently
5. **Mark Task Complete** - Mark a task as done
6. **Mark Task Incomplete** - Revert a completed task
7. **Exit** - Close the application

## Architecture

```
console-app/
├── main.py          # Main application entry point
├── README.md        # This file
└── pyproject.toml   # Python project configuration
```

## Spec-Driven Development

This console app was developed using:
- Claude Code
- Spec-Kit Plus
- Spec-Driven Development workflow

Reference: `.specifyplus/speckit.specify` for requirements specification.
