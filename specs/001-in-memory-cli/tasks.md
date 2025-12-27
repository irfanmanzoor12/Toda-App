# Tasks: Phase I – In-Memory Todo CLI

**Input**: Design documents from `/specs/001-in-memory-cli/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Optional - Not explicitly requested in specification. Focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below use single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directory structure (src/, tests/, specs/)
- [ ] T002 Initialize pyproject.toml with UV package configuration for Python 3.13+
- [ ] T003 Create README.md with project overview and setup instructions
- [ ] T004 [P] Create src/__init__.py as package marker
- [ ] T005 [P] Create tests/__init__.py as package marker
- [ ] T006 [P] Create src/models/__init__.py directory
- [ ] T007 [P] Create src/skills/__init__.py directory
- [ ] T008 [P] Create src/storage/__init__.py directory
- [ ] T009 [P] Create src/cli/__init__.py directory
- [ ] T010 [P] Create tests/unit/__init__.py directory
- [ ] T011 [P] Create tests/integration/__init__.py directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 [P] Create TodoStatus enum in src/models/todo.py with PENDING and COMPLETE values
- [ ] T013 Create Todo dataclass in src/models/todo.py with fields (id, title, description, status, created_at) and validation in __post_init__
- [ ] T014 [P] Create TodoValidator class in src/skills/validator.py with validate_title, validate_description, and validate_id methods
- [ ] T015 Create abstract TodoStore interface in src/storage/memory_store.py with add, get_by_id, get_all, update, delete, mark_complete methods
- [ ] T016 Implement MemoryStore class in src/storage/memory_store.py with in-memory dict storage and auto-increment ID logic
- [ ] T017 Create base argument parser in src/cli/commands.py using argparse with subcommands structure
- [ ] T018 [P] Create display utility functions in src/cli/display.py for formatting todo output (table, single todo, status symbols)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add New Todo Items (Priority: P1) 🎯 MVP

**Goal**: Users can add todos via CLI and see confirmation

**Independent Test**: Launch CLI, add multiple todos with various titles/descriptions, verify creation confirmation and storage

### Implementation for User Story 1

- [ ] T019 [US1] Implement add_todo method in TodoManager skill (src/skills/todo_manager.py) that validates input, calls storage, returns Todo
- [ ] T020 [US1] Add 'add' subcommand parser in src/cli/commands.py with title argument and --description option
- [ ] T021 [US1] Implement handle_add function in src/cli/commands.py that calls TodoManager.add_todo and formats success message
- [ ] T022 [US1] Add error handling in src/cli/commands.py for validation errors (empty title, title too long, description too long)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (can add todos)

---

## Phase 4: User Story 2 - List and View Todos (Priority: P1) 🎯 MVP

**Goal**: Users can view all todos and see individual todo details

**Independent Test**: Pre-populate todos, run list command, verify all displayed; run show command, verify details

### Implementation for User Story 2

- [ ] T023 [P] [US2] Implement list_todos method in TodoManager skill (src/skills/todo_manager.py) that retrieves all todos from storage
- [ ] T024 [P] [US2] Implement get_todo method in TodoManager skill (src/skills/todo_manager.py) that retrieves todo by ID from storage
- [ ] T025 [US2] Add 'list' subcommand parser in src/cli/commands.py (no arguments)
- [ ] T026 [US2] Implement handle_list function in src/cli/commands.py that calls TodoManager.list_todos and formats table output using display utilities
- [ ] T027 [US2] Add 'show' subcommand parser in src/cli/commands.py with ID argument
- [ ] T028 [US2] Implement handle_show function in src/cli/commands.py that validates ID, calls TodoManager.get_todo, formats detailed output
- [ ] T029 [US2] Add error handling for show command (invalid ID, todo not found)
- [ ] T030 [US2] Add empty state message in list command when no todos exist

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (add + list + show)

---

## Phase 5: User Story 3 - Mark Todos as Complete (Priority: P2)

**Goal**: Users can mark todos complete and see status change in list

**Independent Test**: Add todos, mark specific ones complete, verify status changes while others remain pending

### Implementation for User Story 3

- [ ] T031 [US3] Implement mark_complete method in TodoManager skill (src/skills/todo_manager.py) that calls storage.mark_complete
- [ ] T032 [US3] Add 'complete' subcommand parser in src/cli/commands.py with ID argument
- [ ] T033 [US3] Implement handle_complete function in src/cli/commands.py that validates ID, calls TodoManager.mark_complete, shows success message
- [ ] T034 [US3] Add idempotent handling in handle_complete (different message if already complete)
- [ ] T035 [US3] Add error handling for complete command (invalid ID, todo not found)
- [ ] T036 [US3] Update display utilities in src/cli/display.py to show status symbols (✓ for complete, ○ for pending)

**Checkpoint**: All user stories should now be independently functional (add, list, show, complete)

---

## Phase 6: User Story 4 - Delete Todo Items (Priority: P3)

**Goal**: Users can delete todos permanently

**Independent Test**: Add todos, delete specific ones, verify removal from list while others remain

### Implementation for User Story 4

- [ ] T037 [US4] Implement delete_todo method in TodoManager skill (src/skills/todo_manager.py) that calls storage.delete
- [ ] T038 [US4] Add 'delete' subcommand parser in src/cli/commands.py with ID argument
- [ ] T039 [US4] Implement handle_delete function in src/cli/commands.py that validates ID, calls TodoManager.delete_todo, shows success message
- [ ] T040 [US4] Add error handling for delete command (invalid ID, todo not found, empty list)

**Checkpoint**: User Stories 1-4 complete and independently testable

---

## Phase 7: User Story 5 - Update Todo Details (Priority: P3)

**Goal**: Users can update todo title and/or description

**Independent Test**: Add todo, update title/description, verify changes reflected when viewing

### Implementation for User Story 5

- [ ] T041 [US5] Implement update_todo method in TodoManager skill (src/skills/todo_manager.py) that validates inputs, calls storage.update
- [ ] T042 [US5] Add 'update' subcommand parser in src/cli/commands.py with ID argument, --title and --description options
- [ ] T043 [US5] Implement handle_update function in src/cli/commands.py that validates at least one option provided, calls TodoManager.update_todo
- [ ] T044 [US5] Add error handling for update command (no options, invalid ID, todo not found, validation errors)

**Checkpoint**: All user stories (1-5) complete and independently testable

---

## Phase 8: Help and Polish

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 Add 'help' subcommand in src/cli/commands.py that displays usage information with all commands
- [ ] T046 Add --help flag support for each subcommand showing command-specific usage
- [ ] T047 Add --version flag in src/cli/commands.py showing "Todo CLI v1.0.0 (Phase I: In-Memory)"
- [ ] T048 Create main entry point in src/cli/main.py that initializes TodoManager with MemoryStore and dispatches commands
- [ ] T049 Add graceful Ctrl+C handling in src/cli/main.py (catch KeyboardInterrupt, show "Exiting...", exit code 130)
- [ ] T050 Update README.md with usage examples for all commands and installation instructions
- [ ] T051 Add pyproject.toml entry point for 'todo' command mapping to src.cli.main:main

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 (but logically follows for testing)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Uses US2 list display (minimal integration)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent implementation
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent implementation

### Within Each Phase

**Foundational Phase**:
- T012 (TodoStatus) before T013 (Todo dataclass)
- T013 (Todo) before T015/T016 (Storage interfaces)
- T014 (Validator) can run parallel to T012/T013
- T017 (argparse setup) and T018 (display utils) can run parallel to models/storage

**User Story Phases**:
- TodoManager methods before CLI command handlers
- Command parser before command handler implementation
- Error handling after basic implementation

### Parallel Opportunities

- All Setup tasks (T004-T011) marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational completes, all user stories can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch parallel tasks for User Story 2:
Task: "Implement list_todos method in TodoManager skill (src/skills/todo_manager.py)"
Task: "Implement get_todo method in TodoManager skill (src/skills/todo_manager.py)"

# After both complete, proceed sequentially:
Task: "Add 'list' subcommand parser in src/cli/commands.py"
Task: "Implement handle_list function..."
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T011)
2. Complete Phase 2: Foundational (T012-T018) - CRITICAL
3. Complete Phase 3: User Story 1 (T019-T022)
4. Complete Phase 4: User Story 2 (T023-T030)
5. Complete Phase 8: Help/Polish (T045-T051) for basic usability
6. **STOP and VALIDATE**: Test add + list + show workflows
7. Deploy/demo if ready

This gives you a working MVP with core functionality (add and view todos).

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Milestone: Can add todos
3. Add User Story 2 → Test independently → Milestone: MVP complete (add + list)
4. Add User Story 3 → Test independently → Milestone: Status tracking
5. Add User Story 4 → Test independently → Milestone: Cleanup capability
6. Add User Story 5 → Test independently → Milestone: Full CRUD
7. Add Help/Polish → Complete Phase I

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - Developer A: User Story 1 (T019-T022)
   - Developer B: User Story 2 (T023-T030)
   - Developer C: User Story 3 (T031-T036)
3. Stories complete and integrate independently
4. Team collaboration on Help/Polish (T045-T051)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests included (not requested in spec, can be added later if desired)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 51 tasks across 8 phases
- MVP scope: 29 tasks (Setup + Foundational + US1 + US2 + minimal Help)
- Full feature: All 51 tasks

---

## Task Count Summary

- **Phase 1 (Setup)**: 11 tasks
- **Phase 2 (Foundational)**: 7 tasks (BLOCKING)
- **Phase 3 (US1 - Add Todos)**: 4 tasks
- **Phase 4 (US2 - List/View)**: 8 tasks
- **Phase 5 (US3 - Complete)**: 6 tasks
- **Phase 6 (US4 - Delete)**: 4 tasks
- **Phase 7 (US5 - Update)**: 4 tasks
- **Phase 8 (Help/Polish)**: 7 tasks

**Total**: 51 tasks

**Parallel Opportunities**: 17 tasks can run in parallel (marked with [P])

**MVP Scope** (US1 + US2): 29 tasks
- Setup (11) + Foundational (7) + US1 (4) + US2 (8) = 30 tasks
- Subtract polish tasks not critical for MVP = ~29 tasks

**Independent Test Criteria**:
- US1: Can add todos and see confirmation
- US2: Can list all todos and view details
- US3: Can mark todos complete, status visible in list
- US4: Can delete todos, removed from list
- US5: Can update title/description, changes persist
