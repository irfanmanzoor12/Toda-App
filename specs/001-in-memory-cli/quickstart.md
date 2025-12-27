# Quickstart Guide: Phase I – In-Memory Todo CLI

**Feature**: 001-in-memory-cli
**Version**: Phase I (In-Memory)
**Last Updated**: 2025-12-28

## Overview

This quickstart guide helps developers set up, test, and validate the Phase I in-memory Todo CLI application.

---

## Prerequisites

- **Python**: 3.13 or higher
- **UV**: Python package manager (as mandated by constitution)
- **Git**: For version control
- **Terminal**: Any modern terminal (bash, zsh, PowerShell, etc.)

### Install UV

If you don't have UV installed:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
```

---

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd todoapp
git checkout 001-in-memory-cli
```

### 2. Create Virtual Environment

```bash
uv venv
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows
```

### 3. Install Dependencies

For Phase I (minimal dependencies):

```bash
uv pip install -e .
uv pip install -e ".[dev]"  # Includes pytest for testing
```

This installs:
- The `todo` CLI command
- pytest (for running tests)
- No external dependencies (standard library only)

### 4. Verify Installation

```bash
todo --version
```

Expected output:
```
Todo CLI v1.0.0 (Phase I: In-Memory)
Python 3.13+
```

---

## Basic Usage

### Create Your First Todo

```bash
todo add "Buy groceries"
```

Output:
```
✓ Todo #1 created: "Buy groceries"
```

### Add a Todo with Description

```bash
todo add "Prepare presentation" --description "Include Q4 sales figures"
```

Output:
```
✓ Todo #2 created: "Prepare presentation"
```

### List All Todos

```bash
todo list
```

Output:
```
ID  Status    Title                      Created
--  --------  -------------------------  -------------------
1   ○ Pending  Buy groceries              2025-12-28 10:30:00
2   ○ Pending  Prepare presentation       2025-12-28 10:31:00

2 todo(s) found
```

### View Todo Details

```bash
todo show 2
```

Output:
```
Todo #2
---------
Title:       Prepare presentation
Description: Include Q4 sales figures
Status:      ○ Pending
Created:     2025-12-28 10:31:00
```

### Mark Todo as Complete

```bash
todo complete 1
```

Output:
```
✓ Todo #1 marked as complete
```

### Update a Todo

```bash
todo update 2 --title "Prepare Q4 presentation"
```

Output:
```
✓ Todo #2 updated
```

### Delete a Todo

```bash
todo delete 1
```

Output:
```
✓ Todo #1 deleted
```

### Get Help

```bash
todo help
```

---

## Testing

### Run All Tests

```bash
pytest
```

Expected output:
```
================================ test session starts ================================
platform linux -- Python 3.13.0, pytest-7.4.3, pluggy-1.3.0
rootdir: /path/to/todoapp
collected 25 items

tests/unit/test_todo_model.py ......                                        [ 24%]
tests/unit/test_todo_manager.py .......                                     [ 52%]
tests/unit/test_validator.py ......                                         [ 76%]
tests/unit/test_memory_store.py .....                                       [ 96%]
tests/integration/test_cli_workflows.py .                                   [100%]

================================ 25 passed in 0.45s =================================
```

### Run Tests with Coverage

```bash
pytest --cov=src --cov-report=term-missing
```

Expected coverage: **> 90%**

### Run Specific Test File

```bash
pytest tests/unit/test_todo_manager.py
```

### Run Tests with Verbose Output

```bash
pytest -v
```

---

## Validation Checklist

Use this checklist to verify Phase I implementation:

### ✅ Functional Requirements

- [ ] **FR-001**: Can add todos via CLI
- [ ] **FR-002**: Todos have ID, title, description, status, timestamp
- [ ] **FR-003**: Can display all todos
- [ ] **FR-004**: Can mark todos as complete
- [ ] **FR-005**: Can delete todos
- [ ] **FR-006**: Can update todo title and description
- [ ] **FR-007**: Title validation (non-empty) works
- [ ] **FR-008**: Clear error messages for invalid input
- [ ] **FR-009**: Data persists for session duration
- [ ] **FR-010**: Help command shows usage
- [ ] **FR-011**: Graceful shutdown (Ctrl+C)
- [ ] **FR-012**: Sequential IDs auto-assigned

### ✅ User Stories

- [ ] **US1 (P1)**: Can add new todos successfully
- [ ] **US2 (P1)**: Can list and view todos
- [ ] **US3 (P2)**: Can mark todos complete
- [ ] **US4 (P3)**: Can delete todos
- [ ] **US5 (P3)**: Can update todo details

### ✅ Success Criteria

- [ ] **SC-001**: Add todo completes in < 10 seconds
- [ ] **SC-002**: List todos responds in < 1 second for 100 todos
- [ ] **SC-003**: System handles 100+ todos without degradation
- [ ] **SC-004**: 95%+ of valid commands succeed
- [ ] **SC-005**: Primary workflow works without help (80%+ users)
- [ ] **SC-006**: All CRUD operations functional
- [ ] **SC-007**: Error messages clear (90%+ users self-correct)

### ✅ Constitution Compliance

- [ ] No persistence (in-memory only)
- [ ] No web interface
- [ ] No MCP/agent features
- [ ] Python 3.13+ only
- [ ] Skills-first architecture (business logic separated)
- [ ] All code generated via Claude Code

---

## Common Workflows

### Workflow 1: Daily Task Management

```bash
# Morning: add tasks for the day
todo add "Review pull requests"
todo add "Team standup meeting" -d "10:00 AM daily sync"
todo add "Update documentation"

# View your tasks
todo list

# During day: mark as complete
todo complete 1
todo complete 2

# End of day: review
todo list
```

### Workflow 2: Quick Note Capture

```bash
# Rapid task entry
todo add "Call dentist"
todo add "Buy birthday gift for Sarah"
todo add "Fix bug in authentication module"

# Later: add details
todo update 3 --description "Users cannot reset password. Check email service integration."
```

### Workflow 3: Task Cleanup

```bash
# List all todos
todo list

# Delete completed or obsolete tasks
todo delete 5
todo delete 7

# Verify
todo list
```

---

## Troubleshooting

### Issue: "todo: command not found"

**Cause**: Package not installed or virtual environment not activated

**Solution**:
```bash
source .venv/bin/activate  # Activate venv
uv pip install -e .        # Reinstall package
```

### Issue: "Error: Title cannot be empty"

**Cause**: Attempting to add/update todo with empty title

**Solution**: Provide a non-empty title:
```bash
todo add "Valid title here"
```

### Issue: "Error: Todo #5 not found"

**Cause**: Referenced todo ID doesn't exist

**Solution**: Use `todo list` to see available IDs

### Issue: Data Lost After Closing Terminal

**Expected Behavior**: Phase I uses in-memory storage. Data is intentionally lost when session ends.

**Future**: Persistence will be added in Phase II.

---

## Performance Benchmarks

Expected performance on modern hardware:

| Operation | Target | Typical |
|-----------|--------|---------|
| Add todo | < 10s | < 0.1s |
| List 100 todos | < 1s | < 0.2s |
| Show todo | < 1s | < 0.05s |
| Update todo | < 10s | < 0.1s |
| Complete todo | < 10s | < 0.05s |
| Delete todo | < 10s | < 0.05s |

**Test with Many Todos**:
```bash
# Add 100 todos quickly
for i in {1..100}; do
  todo add "Test todo $i"
done

# Verify list performance
time todo list  # Should be < 1 second
```

---

## Development Workflow

### Making Changes

1. **Edit Code**: Modify files in `src/`
2. **Run Tests**: `pytest`
3. **Manual Test**: Try commands in terminal
4. **Verify**: Check against validation checklist

### Code Structure

```
src/
├── models/todo.py          # Todo entity, TodoStatus enum
├── skills/
│   ├── todo_manager.py     # Business logic (add, update, etc.)
│   └── validator.py        # Input validation
├── storage/memory_store.py # In-memory storage
└── cli/
    ├── main.py             # Entry point
    ├── commands.py         # Argument parsing
    └── display.py          # Output formatting
```

**Key Principle**: Business logic in `skills/`, UI in `cli/`. Skills have NO knowledge of CLI.

---

## Next Steps

After validating Phase I:

1. **Run all tests**: `pytest --cov=src`
2. **Complete validation checklist** above
3. **Test all user stories** manually
4. **Verify constitution compliance**
5. **Ready for Phase II**: Add persistence and web interface

---

## Support

### Documentation

- **Specification**: `specs/001-in-memory-cli/spec.md`
- **Data Model**: `specs/001-in-memory-cli/data-model.md`
- **CLI Contract**: `specs/001-in-memory-cli/contracts/cli-interface.md`
- **Implementation Plan**: `specs/001-in-memory-cli/plan.md`

### Common Commands Reference

```bash
# Help
todo help
todo <command> --help

# CRUD Operations
todo add "Title" [-d "Description"]
todo list
todo show <id>
todo update <id> [--title "New"] [--description "New"]
todo delete <id>
todo complete <id>

# Utility
todo --version
```

---

## Validation Script

Save this as `validate-phase1.sh`:

```bash
#!/bin/bash
set -e

echo "Phase I Validation Script"
echo "========================="

# Test basic operations
echo "✓ Testing add..."
todo add "Test todo 1"

echo "✓ Testing list..."
todo list

echo "✓ Testing show..."
todo show 1

echo "✓ Testing update..."
todo update 1 --title "Updated test todo"

echo "✓ Testing complete..."
todo complete 1

echo "✓ Testing delete..."
todo delete 1

echo "✓ Testing help..."
todo help > /dev/null

# Run automated tests
echo "✓ Running pytest..."
pytest

echo ""
echo "========================="
echo "✅ All validation checks passed!"
echo "Phase I implementation complete."
```

Run with:
```bash
chmod +x validate-phase1.sh
./validate-phase1.sh
```

---

**Remember**: Phase I is in-memory only. Data is lost when the session ends. This is intentional per the constitution's Phase-Gated Evolution principle.
