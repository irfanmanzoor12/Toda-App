# Intent Detection Training Examples

Comprehensive training dataset for improving the Todo Chatbot agent's ability to recognize user intents from natural language.

## Overview

This module provides **60 training examples** covering:
- 5 core task management intents (10 examples each)
- 10 edge cases (clarification scenarios and refused intents)

## Coverage Summary

### Core Intents (50 examples)

| Intent | Examples | Min Required (AC) | Status |
|--------|----------|-------------------|--------|
| add_task | 10 | 5 (AC-1) | ✓ Pass |
| list_tasks | 10 | 5 (AC-2) | ✓ Pass |
| update_task | 10 | 5 (AC-3) | ✓ Pass |
| complete_task | 10 | 5 (AC-4) | ✓ Pass |
| delete_task | 10 | 5 (AC-5) | ✓ Pass |

### Edge Cases (10 examples)
- Clarification needed: 4 examples
- Refused intents: 6 examples

## Intent Categories

### 1. Add Task (10 examples)

**Purpose**: Create new tasks with title and optional description

**Variations Covered**:
- "Add task" / "Create task" / "New task"
- "Remind me to" (interpreted as task creation)
- "I need to" conversational form
- Explicit title and description with labels
- Minimal phrasings without prepositions

**Example Inputs**:
```
✓ "Add a task to buy groceries"
✓ "Create a new task: finish the quarterly report"
✓ "Remind me to call the dentist tomorrow"
✓ "Add task: review pull request #42, description: check for security issues"
✓ "New task buy milk"
✓ "I need to schedule a meeting with the team"
```

**Parameter Extraction**:
- Title extraction from various formats
- Description extraction from keywords ("description:", "note:")
- Handling quoted strings and colons

---

### 2. List Tasks (10 examples)

**Purpose**: Display all user's tasks

**Variations Covered**:
- "Show" / "List" / "Display" / "View"
- Question forms ("What's on my list?", "What do I need to do?")
- "My tasks" / "My todos" / "My todo list"

**Example Inputs**:
```
✓ "Show me my tasks"
✓ "What's on my todo list?"
✓ "List all my tasks"
✓ "What do I need to do?"
✓ "Display my todos"
```

**Notes**:
- No parameters required
- All phrasings mapped to same intent

---

### 3. Update Task (10 examples)

**Purpose**: Modify task title and/or description

**Variations Covered**:
- "Update" / "Change" / "Edit" / "Modify" / "Rename"
- Title-only updates
- Description-only updates
- Both title and description updates
- Possessive forms ("task 8's description")

**Example Inputs**:
```
✓ "Update task 5 to 'Buy organic groceries'"
✓ "Change the description of task 3 to 'Include unit tests'"
✓ "Edit task 12: new title 'Deploy to staging', new description 'After code review'"
✓ "Rename task 7 to 'Call dentist at 2pm'"
```

**Parameter Extraction**:
- Task ID from "task N" patterns
- Title from "to 'X'" or "title to X"
- Description from "description:" or "description to"

---

### 4. Complete Task (10 examples)

**Purpose**: Mark task as done

**Variations Covered**:
- "Complete" / "Finish" / "Done"
- "Mark as done" / "Mark as completed"
- Past tense ("I finished task X")
- Declarative ("Task X is complete")
- Minimal forms ("Task 5 completed")

**Example Inputs**:
```
✓ "Mark task 3 as done"
✓ "Complete task 8"
✓ "I finished task 15"
✓ "Task 2 is complete"
✓ "Done with task 10"
```

**Parameter Extraction**:
- Task ID from various numeric patterns

---

### 5. Delete Task (10 examples)

**Purpose**: Permanently remove task

**Variations Covered**:
- "Delete" / "Remove" / "Cancel" / "Discard" / "Drop"
- Informal: "Trash" / "Get rid of"
- Minimal forms ("Delete 3")
- Conversational forms ("I don't need task 5 anymore")

**Example Inputs**:
```
✓ "Delete task 6"
✓ "Remove task 9"
✓ "Get rid of task 4"
✓ "Cancel task 11"
✓ "Trash task 7"
```

**Parameter Extraction**:
- Task ID extraction from multiple formats

---

### 6. Edge Cases (10 examples)

**Clarification Needed** (4 examples):
- Missing task ID: "Delete it" → Ask for explicit ID
- Missing update fields: "Update task 5" → Ask what to update
- Relative references: "Mark the first task as done" → Reject, require explicit ID
- Missing title: "Add task" → Ask for title

**Refused Intents** (6 examples):
- Bulk operations: "Complete all my tasks" → Polite refusal
- Data export: "Export my tasks to CSV" → Redirect to web app
- Authentication: "Log me out" → Redirect to web app
- External knowledge: "What's the weather tomorrow?" → Decline
- Autonomous actions: "Remind me about task 5 tomorrow" → Decline
- Analytics: "How many tasks did I complete this week?" → Decline

---

## Usage

### Import Examples

```typescript
import {
  ADD_TASK_EXAMPLES,
  LIST_TASKS_EXAMPLES,
  UPDATE_TASK_EXAMPLES,
  COMPLETE_TASK_EXAMPLES,
  DELETE_TASK_EXAMPLES,
  EDGE_CASE_EXAMPLES,
  ALL_TRAINING_EXAMPLES
} from './agent/config';
```

### Get Examples by Intent

```typescript
import { getExamplesByIntent } from './agent/config';

const addExamples = getExamplesByIntent('add_task');
// Returns all add_task examples
```

### Validate Coverage

```typescript
import { validateExampleCoverage } from './agent/config';

const validation = validateExampleCoverage();
if (validation.valid) {
  console.log('All intents have sufficient examples');
} else {
  console.error(validation.message);
}
```

### Get Statistics

```typescript
import { getExampleStats } from './agent/config';

const stats = getExampleStats();
// Returns: { add_task: 10, list_tasks: 10, ... }
```

## Testing

Run validation tests:
```bash
npm test -- tests/agent/training-examples.test.ts
```

Tests verify:
- ✓ Minimum 5 examples per intent (AC compliance)
- ✓ All examples have required fields
- ✓ Diverse phrasings for each intent
- ✓ Edge cases cover all scenarios
- ✓ No duplicate inputs
- ✓ Parameter extraction examples are valid

## Acceptance Criteria Compliance

| AC | Requirement | Status |
|----|-------------|--------|
| AC-1 | Add task intent from 5+ variations | ✓ 10 examples |
| AC-2 | List tasks intent from 5+ variations | ✓ 10 examples |
| AC-3 | Update task intent from 5+ variations | ✓ 10 examples |
| AC-4 | Complete task intent from 5+ variations | ✓ 10 examples |
| AC-5 | Delete task intent from 5+ variations | ✓ 10 examples |

## Future Enhancements

Potential additions for even better coverage:
- Multi-language support
- Voice command variations
- Typo-tolerant examples
- Abbreviations and slang
- Domain-specific vocabulary

## Example Structure

Each training example has:
```typescript
{
  input: string;           // User's natural language input
  intent: string;          // Detected intent
  parameters?: {           // Optional extracted parameters
    task_id?: number;
    title?: string;
    description?: string;
  };
  description?: string;    // Human-readable explanation
}
```

## Statistics

- **Total Examples**: 60
- **Core Intents**: 50 (10 per intent)
- **Edge Cases**: 10
- **Unique Phrasings**: 60 (no duplicates)
- **Coverage**: 200% of minimum requirement (10 vs 5 required)
