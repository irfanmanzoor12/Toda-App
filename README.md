# Todo CLI - Phase I: In-Memory Todo Manager

A simple, in-memory command-line todo manager built with Python 3.13+.

## Features

- Add new todos with optional descriptions
- List all todos with status indicators
- View detailed todo information
- Mark todos as complete
- Update todo title and description
- Delete todos permanently
- In-memory storage (data does not persist between sessions)

## Requirements

- Python 3.13 or higher
- UV package manager (recommended)

## Installation

### Using UV (Recommended)

```bash
# Install UV if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install the package in development mode
uv pip install -e .
```

### Using pip

```bash
pip install -e .
```

## Usage

### Add a New Todo

Create a new todo with a title:

```bash
todo add "Buy groceries"
```

Create a todo with a title and description:

```bash
todo add "Buy groceries" -d "Milk, eggs, bread"
todo add "Buy groceries" --description "Milk, eggs, bread"
```

### List All Todos

Display all todos in a table format:

```bash
todo list
```

Example output:
```
ID  Status      Title                      Created
--  ----------  -------------------------  -------------------
1   ○ Pending   Buy groceries              2025-01-15 10:30:00
2   ✓ Complete  Finish project report      2025-01-15 11:00:00

2 todo(s) found
```

### View Todo Details

Show detailed information for a specific todo:

```bash
todo show 1
```

Example output:
```
Todo #1
---------
Title:       Buy groceries
Description: Milk, eggs, bread
Status:      ○ Pending
Created:     2025-01-15 10:30:00
```

### Mark Todo as Complete

Mark a todo as complete:

```bash
todo complete 1
```

The command is idempotent - marking an already complete todo shows a different message:
```
✓ Todo #1 was already complete
```

### Update Todo

Update the title of a todo:

```bash
todo update 1 --title "Buy groceries and supplies"
todo update 1 -t "Buy groceries and supplies"
```

Update the description:

```bash
todo update 1 --description "Milk, eggs, bread, coffee"
todo update 1 -d "Milk, eggs, bread, coffee"
```

Update both title and description:

```bash
todo update 1 -t "Weekly shopping" -d "Groceries and household items"
```

**Note:** At least one field (--title or --description) must be provided.

### Delete Todo

Delete a todo permanently:

```bash
todo delete 1
```

### Help

Show help information:

```bash
todo --help
todo help
```

Show help for a specific command:

```bash
todo add --help
todo update --help
```

### Version

Show version information:

```bash
todo --version
```

## Error Handling

The CLI provides helpful error messages and tips:

- **Invalid ID**: Shows format requirements
- **Todo not found**: Suggests using `todo list` to see available todos
- **Empty title**: Reminds you that title cannot be empty
- **No update fields**: Tells you to provide at least one field
- **Validation errors**: Shows character limits for title (500) and description (2000)

## Exit Codes

- `0`: Success
- `1`: User error (invalid input, todo not found, etc.)
- `130`: Interrupted by user (Ctrl+C)

## Architecture

This Phase I implementation follows a skills-first architecture:

- **Models** (`src/models/`): Data structures (Todo, TodoStatus)
- **Skills** (`src/skills/`): Business logic (TodoManager, TodoValidator)
- **Storage** (`src/storage/`): Abstract storage interface with in-memory implementation
- **CLI** (`src/cli/`): Command-line interface, argument parsing, and display utilities

## Limitations (Phase I)

- **No persistence**: Data is stored in memory and lost when the program exits
- **Single user**: No multi-user support or authentication
- **Local only**: No network or API access

Future phases will add:
- Phase II: Web interface with database persistence
- Phase III: AI chatbot integration
- Phase IV: Kubernetes deployment
- Phase V: Event-driven cloud architecture

## Development

### Project Structure

```
todoapp/
├── src/
│   ├── models/          # Data models
│   ├── skills/          # Business logic
│   ├── storage/         # Storage abstraction
│   └── cli/             # CLI interface
├── specs/               # Feature specifications
├── pyproject.toml       # Project configuration
└── README.md
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src
```

## License

Copyright © 2025. All rights reserved.
