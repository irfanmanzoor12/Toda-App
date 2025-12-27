# Implementation Plan: Phase I – In-Memory Todo CLI

**Branch**: `001-in-memory-cli` | **Date**: 2025-12-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-in-memory-cli/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an in-memory command-line todo application that allows users to perform basic CRUD operations (add, list, update, delete, complete) on todo items. The system stores todos in memory for the session duration with no persistence. This is Phase I of a five-phase evolution toward a cloud-native, AI-powered todo system.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: Standard library only (no external packages for Phase I)
**Storage**: In-memory data structures (list/dict), no persistence
**Testing**: pytest with standard assertions
**Target Platform**: Cross-platform CLI (Linux, macOS, Windows)
**Project Type**: Single project (CLI application)
**Performance Goals**: < 1 second response for 100 todos, < 10 seconds for add/update operations
**Constraints**: In-memory only (no files, no database), single-session lifetime, no concurrency requirements
**Scale/Scope**: Support 100+ todos per session, 5 core commands (add, list, update, delete, complete), help command

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase I Compliance

- ✅ **Spec-First Rule**: Specification created and validated in `specs/001-in-memory-cli/spec.md`
- ✅ **No Manual Coding**: All code will be generated via Claude Code per constitution
- ✅ **Skills Before Agents**: N/A for Phase I (CLI only, no agents yet)
- ✅ **Skills as Unit of Reuse**: Business logic will be in reusable skills/modules for future phase compatibility
- ✅ **Agent Constraints**: N/A for Phase I (agents introduced in Phase III)
- ✅ **MCP Boundary Rule**: N/A for Phase I (MCP integration in Phase III)
- ✅ **Stateless Backend Rule**: N/A for Phase I (CLI application, no backend services)
- ✅ **Phase-Gated Evolution**: Strictly Phase I scope - in-memory CLI only, no persistence, no web, no agents
- ✅ **Technology Lock**: Python 3.13+ as mandated
- ✅ **Authority Hierarchy**: Constitution → Spec → Plan → Tasks → Implementation followed
- ✅ **Enforcement**: All ambiguities resolved in spec (no NEEDS CLARIFICATION markers)

### Gates Status

**PASS**: All applicable principles satisfied for Phase I scope.

**Key Constraints for Phase I**:
- MUST NOT add persistence (database, files) - deferred to Phase II
- MUST NOT add web interface - deferred to Phase II
- MUST NOT add MCP/agent features - deferred to Phase III
- MUST use Python 3.13+ only
- MUST structure code with skills-first pattern even though agents not yet present
- MUST maintain in-memory storage only

## Project Structure

### Documentation (this feature)

```text
specs/001-in-memory-cli/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── cli-interface.md # CLI command contracts
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/
├── __init__.py
├── models/
│   ├── __init__.py
│   └── todo.py          # Todo entity (data class)
├── skills/              # Business logic (reusable, stateless)
│   ├── __init__.py
│   ├── todo_manager.py  # Core todo operations (add, list, update, delete, complete)
│   └── validator.py     # Input validation logic
├── cli/
│   ├── __init__.py
│   ├── main.py          # CLI entry point
│   ├── commands.py      # Command parser and dispatcher
│   └── display.py       # Output formatting and display
└── storage/
    ├── __init__.py
    └── memory_store.py  # In-memory storage implementation

tests/
├── __init__.py
├── unit/
│   ├── __init__.py
│   ├── test_todo_model.py
│   ├── test_todo_manager.py
│   ├── test_validator.py
│   └── test_memory_store.py
└── integration/
    ├── __init__.py
    └── test_cli_workflows.py  # End-to-end user story tests

pyproject.toml           # UV package configuration
README.md                # Project overview and setup instructions
```

**Structure Decision**: Single project structure selected (Option 1). This is a CLI-only application with no web or mobile components. The skills-first pattern is implemented even in Phase I to ensure future compatibility:

- **models/**: Data entities (Todo)
- **skills/**: Reusable business logic, no CLI coupling (future MCP exposure in Phase III)
- **cli/**: User interface layer, delegates to skills
- **storage/**: Abstraction for data storage (in-memory now, database in Phase II)
- **tests/**: Unit tests for skills/models, integration tests for user stories

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - Phase I implementation fully complies with constitution principles.
