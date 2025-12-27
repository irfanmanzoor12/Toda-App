# CLI Interface Contract: Phase I – In-Memory Todo CLI

**Feature**: 001-in-memory-cli
**Date**: 2025-12-28
**Phase**: 1 (Design)

## Command Overview

All commands follow the pattern: `todo <command> [arguments] [options]`

**Exit Codes**:
- `0`: Success
- `1`: User error (invalid input, validation failure)
- `2`: System error (unexpected failure)

**Output Streams**:
- **stdout**: Normal output (list results, success messages)
- **stderr**: Error messages and warnings

---

## Commands

### 1. Add Todo

**Command**: `todo add <title> [--description TEXT]`

**Purpose**: Create a new todo item

**Arguments**:
- `<title>` (required): Todo title (1-500 chars)

**Options**:
- `--description TEXT` or `-d TEXT`: Optional description (0-2000 chars)

**Examples**:
```bash
todo add "Buy groceries"
todo add "Prepare presentation" --description "Include Q4 figures"
todo add "Call dentist" -d "Schedule checkup for next month"
```

**Success Output**:
```
✓ Todo #1 created: "Buy groceries"
```

**Error Cases**:

| Error | Condition | Exit Code | Message |
|-------|-----------|-----------|---------|
| Empty title | Title is empty or whitespace | 1 | `Error: Title cannot be empty` |
| Title too long | Title > 500 chars | 1 | `Error: Title cannot exceed 500 characters` |
| Description too long | Description > 2000 chars | 1 | `Error: Description cannot exceed 2000 characters` |

---

### 2. List Todos

**Command**: `todo list`

**Purpose**: Display all todos

**Arguments**: None

**Options**: None

**Examples**:
```bash
todo list
```

**Success Output** (when todos exist):
```
ID  Status    Title                      Created
--  --------  -------------------------  -------------------
1   ○ Pending  Buy groceries              2025-12-28 10:30:00
2   ✓ Complete Prepare presentation       2025-12-27 14:15:00
3   ○ Pending  Call dentist               2025-12-28 09:00:00

3 todo(s) found
```

**Success Output** (when no todos):
```
No todos found. Use 'todo add <title>' to create one.
```

**Error Cases**: None (always succeeds)

---

### 3. Show Todo

**Command**: `todo show <id>`

**Purpose**: Display detailed information for a specific todo

**Arguments**:
- `<id>` (required): Todo ID (positive integer)

**Options**: None

**Examples**:
```bash
todo show 2
```

**Success Output**:
```
Todo #2
---------
Title:       Prepare presentation
Description: Include Q4 sales figures and 2026 projections.
             Add charts from analytics dashboard.
Status:      ✓ Complete
Created:     2025-12-27 14:15:00
```

**Error Cases**:

| Error | Condition | Exit Code | Message |
|-------|-----------|-----------|---------|
| Invalid ID | ID is not a number | 1 | `Error: Invalid todo ID: 'abc'. Must be a positive integer.` |
| Not found | Todo ID doesn't exist | 1 | `Error: Todo #5 not found`<br>`Tip: Use 'todo list' to see all available todos` |

---

### 4. Update Todo

**Command**: `todo update <id> [--title TEXT] [--description TEXT]`

**Purpose**: Modify an existing todo's title or description

**Arguments**:
- `<id>` (required): Todo ID (positive integer)

**Options**:
- `--title TEXT` or `-t TEXT`: New title (1-500 chars)
- `--description TEXT` or `-d TEXT`: New description (0-2000 chars)
- At least one option must be provided

**Examples**:
```bash
todo update 3 --title "Call dentist ASAP"
todo update 3 -t "Call dentist" -d "Schedule annual cleaning"
todo update 3 --description "Rescheduled to next week"
```

**Success Output**:
```
✓ Todo #3 updated
```

**Error Cases**:

| Error | Condition | Exit Code | Message |
|-------|-----------|-----------|---------|
| Invalid ID | ID is not a number | 1 | `Error: Invalid todo ID: 'abc'. Must be a positive integer.` |
| Not found | Todo ID doesn't exist | 1 | `Error: Todo #5 not found` |
| No options | Neither --title nor --description provided | 1 | `Error: At least one of --title or --description must be provided` |
| Empty title | New title is empty/whitespace | 1 | `Error: Title cannot be empty` |
| Title too long | New title > 500 chars | 1 | `Error: Title cannot exceed 500 characters` |
| Description too long | New description > 2000 chars | 1 | `Error: Description cannot exceed 2000 characters` |

---

### 5. Complete Todo

**Command**: `todo complete <id>`

**Purpose**: Mark a todo as complete

**Arguments**:
- `<id>` (required): Todo ID (positive integer)

**Options**: None

**Examples**:
```bash
todo complete 1
```

**Success Output** (first time):
```
✓ Todo #1 marked as complete
```

**Success Output** (already complete):
```
✓ Todo #1 was already complete
```

**Error Cases**:

| Error | Condition | Exit Code | Message |
|-------|-----------|-----------|---------|
| Invalid ID | ID is not a number | 1 | `Error: Invalid todo ID: 'abc'. Must be a positive integer.` |
| Not found | Todo ID doesn't exist | 1 | `Error: Todo #5 not found` |

**Note**: This operation is idempotent - marking an already-complete todo as complete succeeds without error.

---

### 6. Delete Todo

**Command**: `todo delete <id>`

**Purpose**: Remove a todo permanently

**Arguments**:
- `<id>` (required): Todo ID (positive integer)

**Options**: None

**Examples**:
```bash
todo delete 2
```

**Success Output**:
```
✓ Todo #2 deleted
```

**Error Cases**:

| Error | Condition | Exit Code | Message |
|-------|-----------|-----------|---------|
| Invalid ID | ID is not a number | 1 | `Error: Invalid todo ID: 'abc'. Must be a positive integer.` |
| Not found | Todo ID doesn't exist | 1 | `Error: Todo #2 not found` |

---

### 7. Help

**Command**: `todo help` or `todo --help` or `todo`

**Purpose**: Display usage information

**Arguments**: None

**Options**: None

**Examples**:
```bash
todo
todo help
todo --help
```

**Output**:
```
Todo CLI - In-Memory Todo Manager

Usage: todo <command> [arguments] [options]

Commands:
  add <title> [--description TEXT]     Create a new todo
  list                                  Display all todos
  show <id>                             Show todo details
  update <id> [--title|--description]   Modify an existing todo
  complete <id>                         Mark a todo as complete
  delete <id>                           Remove a todo
  help                                  Show this help message

Examples:
  todo add "Buy groceries"
  todo add "Prepare report" -d "Include Q4 figures"
  todo list
  todo show 3
  todo update 3 --title "New title"
  todo complete 3
  todo delete 3

For more details: todo <command> --help
```

**Subcommand Help**:
Each command also supports `--help` flag:
```bash
todo add --help
```

Output:
```
Usage: todo add <title> [--description TEXT]

Create a new todo item

Arguments:
  title                Todo title (1-500 characters)

Options:
  -d, --description    Optional description (0-2000 characters)
  -h, --help           Show this help message

Example:
  todo add "Buy groceries" --description "Milk, eggs, bread"
```

---

## Global Options

These options work with any command:

| Option | Short | Description |
|--------|-------|-------------|
| --help | -h | Show help for command |
| --version | -v | Show version information |

**Version Output**:
```bash
todo --version
```
```
Todo CLI v1.0.0 (Phase I: In-Memory)
Python 3.13+
```

---

## Input/Output Formats

### Text Output (Default)

Human-readable formatted output as shown in examples above.

**Features**:
- Tabular layout for list command
- Status symbols: ✓ (complete), ○ (pending)
- Clear section headers
- Contextual tips and examples in error messages

### Exit on Ctrl+C

Graceful shutdown when user presses Ctrl+C:
```
^C
Exiting...
```

Exit code: 130 (standard for SIGINT)

---

## Validation Summary

All commands validate inputs before processing:

1. **ID Validation**:
   - Must be parseable as integer
   - Must be positive (> 0)
   - Must exist in storage (except for add)

2. **Title Validation**:
   - Must not be empty or whitespace-only
   - Must be ≤ 500 characters after trimming
   - Automatically trimmed of leading/trailing whitespace

3. **Description Validation**:
   - May be empty
   - Must be ≤ 2000 characters
   - Preserved as-is (no trimming)

4. **Command Validation**:
   - Unknown commands show error and help hint
   - Missing required arguments show usage
   - Invalid options show error and suggest --help

---

## User Experience Guidelines

### Clarity
- Every error message explains what went wrong
- Error messages include hints for correction
- Success messages confirm the action taken

### Consistency
- All commands use same argument pattern
- Options use both long (--option) and short (-o) forms
- Status symbols consistent across all output

### Discoverability
- Help command always available
- Examples provided in help text
- Command-specific help via --help flag

### Performance
- All commands respond in < 1 second for 100 todos
- No loading indicators needed for Phase I

---

## Future Extensions (Out of Scope for Phase I)

The following are NOT implemented in Phase I:

- **Filtering**: `todo list --status pending`
- **Searching**: `todo search "groceries"`
- **Sorting**: `todo list --sort created`
- **Bulk Operations**: `todo complete 1 2 3`
- **JSON Output**: `todo list --format json`
- **Undo**: `todo undo`
- **Export/Import**: `todo export todos.json`

These may be added in future phases per constitution's Phase-Gated Evolution.
