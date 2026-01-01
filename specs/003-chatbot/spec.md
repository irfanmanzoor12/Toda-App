# Phase III Specification: AI-Powered Todo Chatbot

**Version:** 1.0
**Status:** Normative
**Date:** 2025-12-31

---

## 1. Purpose & Non-Goals

### Purpose
Provide a conversational interface to the existing Phase II Todo Web Application, allowing authenticated users to manage their tasks through natural language interactions. The chatbot translates user intent into structured API calls using the Model Context Protocol (MCP).

### Goals
- Enable natural language task management (add, list, update, complete, delete)
- Maintain strict statelessness per message interaction
- Leverage existing Phase II Todo REST API without modification
- Provide clear, actionable responses to user requests
- Handle ambiguity through explicit clarification

### Non-Goals
- **Authentication management**: No login, logout, registration, or session handling
- **Memory/personalization**: No conversation history retention across sessions
- **Autonomous behavior**: No proactive suggestions, reminders, or scheduled actions
- **Data analytics**: No reporting, insights, or trend analysis
- **Bulk operations**: No batch processing (e.g., "complete all overdue tasks")
- **External knowledge**: No web search, calendar integration, or third-party services
- **Data export/import**: No CSV, JSON, or file-based operations
- **Task relationships**: No subtasks, dependencies, or hierarchies
- **Modification of Phase II code**: Backend and frontend remain unchanged

---

## 2. Supported User Intents

The chatbot recognizes and processes the following five core intents, each mapped to a dedicated MCP skill.

### 2.1 Add Task

**Intent:** Create a new task with a title and optional description.

**Natural Language Examples:**
- "Add a task to buy groceries"
- "Create a new task: finish the quarterly report"
- "Remind me to call the dentist tomorrow"
- "Add task: review pull request #42, description: check for security issues"
- "New task buy milk"

**Required Information:**
- Task title (mandatory)
- Task description (optional)

**Expected Behavior:**
- Extract title and description from user input
- Call `add_task` skill with extracted parameters
- Confirm task creation with task ID and details

---

### 2.2 List Tasks

**Intent:** Retrieve and display all tasks for the authenticated user.

**Natural Language Examples:**
- "Show me my tasks"
- "What's on my todo list?"
- "List all my tasks"
- "What do I need to do?"
- "Display my todos"

**Required Information:** None

**Expected Behavior:**
- Call `list_tasks` skill
- Present tasks in readable format with ID, title, completion status
- Indicate if no tasks exist

---

### 2.3 Update Task

**Intent:** Modify the title and/or description of an existing task.

**Natural Language Examples:**
- "Update task 5 to 'Buy organic groceries'"
- "Change the description of task 3 to 'Include unit tests'"
- "Edit task 12: new title 'Deploy to staging', new description 'After code review'"
- "Rename task 7 to 'Call dentist at 2pm'"
- "Update task 4 description: add security review step"

**Required Information:**
- Task ID (mandatory)
- New title (optional if description provided)
- New description (optional if title provided)
- At least one field (title or description) must be updated

**Expected Behavior:**
- Extract task ID and fields to update
- Call `update_task` skill with partial or full updates
- Confirm update with modified task details

---

### 2.4 Complete Task

**Intent:** Mark an existing task as completed.

**Natural Language Examples:**
- "Mark task 3 as done"
- "Complete task 8"
- "I finished task 15"
- "Task 2 is complete"
- "Done with task 10"

**Required Information:**
- Task ID (mandatory)

**Expected Behavior:**
- Extract task ID
- Call `complete_task` skill
- Confirm completion with task details

---

### 2.5 Delete Task

**Intent:** Permanently remove a task.

**Natural Language Examples:**
- "Delete task 6"
- "Remove task 9"
- "Get rid of task 4"
- "Cancel task 11"
- "Trash task 7"

**Required Information:**
- Task ID (mandatory)

**Expected Behavior:**
- Extract task ID
- Call `delete_task` skill
- Confirm deletion (task no longer exists)

---

## 3. Unsupported / Refused Intents

The chatbot MUST explicitly refuse the following requests with clear explanations:

### 3.1 Authentication Operations
**Examples:**
- "Log me in"
- "Create a new account"
- "Change my password"
- "Log out"

**Response Pattern:**
"I cannot manage authentication. Please use the web application to log in, register, or manage your account."

---

### 3.2 Data Export/Import
**Examples:**
- "Export my tasks to CSV"
- "Send me my todo list via email"
- "Import tasks from this file"

**Response Pattern:**
"I cannot export or import data. Use the web application for data management features."

---

### 3.3 Bulk/Batch Operations
**Examples:**
- "Complete all my tasks"
- "Delete everything"
- "Mark all overdue tasks as urgent"

**Response Pattern:**
"I can only process one task at a time. Please specify individual task IDs for updates, completions, or deletions."

---

### 3.4 External Knowledge Requests
**Examples:**
- "What's the weather tomorrow?"
- "Search the web for todo app best practices"
- "What's on my calendar?"

**Response Pattern:**
"I can only help with managing tasks in your todo list. I don't have access to external information."

---

### 3.5 Autonomous/Proactive Behavior
**Examples:**
- "Remind me about this task tomorrow"
- "Suggest tasks based on my history"
- "Automatically prioritize my tasks"

**Response Pattern:**
"I operate only in response to your direct requests. I cannot schedule reminders, make suggestions, or take autonomous actions."

---

### 3.6 Analytics/Reporting
**Examples:**
- "How many tasks did I complete this week?"
- "Show me productivity trends"
- "What's my completion rate?"

**Response Pattern:**
"I cannot provide analytics or reports. I can only list your current tasks."

---

## 4. Agent Responsibilities

The conversational agent is responsible for three core functions:

### 4.1 Intent Detection
- Analyze user input to identify one of the five supported intents
- Distinguish between actionable requests and unsupported operations
- Handle ambiguous phrasing by matching semantic meaning

**Example Mappings:**
- "Remind me to X" → `add_task` (not a reminder system)
- "What's left to do?" → `list_tasks`
- "Task 5 is finished" → `complete_task`

---

### 4.2 Parameter Extraction
- Extract structured parameters from natural language input
- Identify task IDs from numeric references or context
- Separate title and description fields in multi-part requests
- Preserve user intent when rephrasing or normalizing input

**Extraction Rules:**
- Task IDs: Integer values (e.g., "task 5" → `task_id: 5`)
- Titles: Primary action phrase (e.g., "buy groceries" → `title: "buy groceries"`)
- Descriptions: Secondary details following keywords like "description:", "note:", or context-separated clauses

---

### 4.3 Skill Selection & Invocation
- Map detected intent to the corresponding MCP skill
- Construct skill input parameters from extracted data
- Pass authentication token transparently to skills
- Return skill output to user in conversational format

**Skill Mapping:**
| Intent | MCP Skill |
|--------|-----------|
| Add Task | `add_task` |
| List Tasks | `list_tasks` |
| Update Task | `update_task` |
| Complete Task | `complete_task` |
| Delete Task | `delete_task` |

---

## 5. MCP Skill Contracts

All skills operate against the existing Phase II Todo REST API. Each skill receives an opaque session token from the agent runtime and includes it in API requests.

### 5.1 add_task

**Purpose:** Create a new task for the authenticated user.

**Input Schema:**
```json
{
  "title": "string (required, 1-200 characters)",
  "description": "string (optional, 0-1000 characters)"
}
```

**Output Schema (Success):**
```json
{
  "id": "integer",
  "title": "string",
  "description": "string or null",
  "is_completed": false,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Cases:**
- `400 Bad Request`: Missing or invalid title
- `401 Unauthorized`: Invalid or missing session token
- `500 Internal Server Error`: Backend failure

**Backend Endpoint:** `POST /api/todos`

---

### 5.2 list_tasks

**Purpose:** Retrieve all tasks for the authenticated user.

**Input Schema:** None

**Output Schema (Success):**
```json
{
  "tasks": [
    {
      "id": "integer",
      "title": "string",
      "description": "string or null",
      "is_completed": "boolean",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ]
}
```

**Special Cases:**
- Empty list: `{"tasks": []}` (not an error)

**Error Cases:**
- `401 Unauthorized`: Invalid or missing session token
- `500 Internal Server Error`: Backend failure

**Backend Endpoint:** `GET /api/todos`

---

### 5.3 update_task

**Purpose:** Modify title and/or description of an existing task.

**Input Schema:**
```json
{
  "task_id": "integer (required)",
  "title": "string (optional, 1-200 characters)",
  "description": "string (optional, 0-1000 characters)"
}
```

**Validation Rules:**
- At least one of `title` or `description` must be provided
- Null description allowed (clears existing description)

**Output Schema (Success):**
```json
{
  "id": "integer",
  "title": "string",
  "description": "string or null",
  "is_completed": "boolean",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Cases:**
- `400 Bad Request`: Invalid task_id or no fields provided
- `401 Unauthorized`: Invalid or missing session token
- `404 Not Found`: Task does not exist or does not belong to user
- `500 Internal Server Error`: Backend failure

**Backend Endpoint:** `PUT /api/todos/{task_id}`

---

### 5.4 complete_task

**Purpose:** Mark a task as completed (sets `is_completed` to `true`).

**Input Schema:**
```json
{
  "task_id": "integer (required)"
}
```

**Output Schema (Success):**
```json
{
  "id": "integer",
  "title": "string",
  "description": "string or null",
  "is_completed": true,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Cases:**
- `400 Bad Request`: Invalid task_id
- `401 Unauthorized`: Invalid or missing session token
- `404 Not Found`: Task does not exist or does not belong to user
- `500 Internal Server Error`: Backend failure

**Backend Endpoint:** `PUT /api/todos/{task_id}` (with `is_completed: true`)

---

### 5.5 delete_task

**Purpose:** Permanently delete a task.

**Input Schema:**
```json
{
  "task_id": "integer (required)"
}
```

**Output Schema (Success):**
```json
{
  "message": "Task deleted successfully"
}
```

**Error Cases:**
- `400 Bad Request`: Invalid task_id
- `401 Unauthorized`: Invalid or missing session token
- `404 Not Found`: Task does not exist or does not belong to user
- `500 Internal Server Error`: Backend failure

**Backend Endpoint:** `DELETE /api/todos/{task_id}`

---

## 6. Conversation Rules

### 6.1 Statelessness
- Each user message is processed independently
- No conversation history is retained between messages
- No context carryover (e.g., "Delete it" requires explicit task ID)
- Agent cannot reference previous requests ("the task I just added")

**Example:**
```
User: "Add a task to buy milk"
Agent: "Task created: [ID 5] Buy milk"

User: "Delete it"
Agent: "I need a task ID to delete. Which task should I remove?"
```

---

### 6.2 Explicit Clarification
When required information is missing or ambiguous, the agent MUST ask for clarification before proceeding.

**Clarification Required When:**
- Task ID is missing for update/complete/delete operations
- Intent is ambiguous (e.g., "Do something with task 5")
- Multiple interpretations exist (e.g., "Update task 3 to urgent" - unclear if title or description)

**Clarification Pattern:**
```
Agent: "I need more information. Do you want to:
  1. Update the title of task 3 to 'urgent'
  2. Add 'urgent' to the description

Please specify."
```

---

### 6.3 No Assumptions
- Do not infer task IDs from context
- Do not assume fields (e.g., don't auto-generate descriptions)
- Do not interpret relative references ("the first one", "the last task")
- Do not expand abbreviations or acronyms without confirmation

**Example:**
```
User: "Mark the first task as done"
Agent: "Please provide the specific task ID you want to mark as complete."
```

---

### 6.4 Response Format
- Use conversational, friendly language
- Confirm actions with key details (ID, title)
- Present task lists in readable format (ID, title, status)
- Keep responses concise (1-3 sentences typical)

**Format for Task List:**
```
Here are your tasks:
1. [ID 3] Buy groceries (Pending)
2. [ID 5] Finish report (Completed)
3. [ID 8] Call dentist (Pending)
```

---

## 7. Error Handling Model

### 7.1 Ambiguity Errors
**Trigger:** User intent or required parameters cannot be reliably extracted.

**Response:**
- Acknowledge the request
- Explain what information is missing or unclear
- Provide specific examples or options

**Example:**
```
User: "Change task 5"
Agent: "I can update task 5, but I need to know what to change. Would you like to update the title, description, or both? For example: 'Update task 5 title to...' or 'Change task 5 description to...'"
```

---

### 7.2 Not Found Errors (404)
**Trigger:** Task ID does not exist or does not belong to the user.

**Response:**
- Inform user the task was not found
- Suggest listing tasks to verify IDs
- Do not reveal whether the task exists for another user

**Example:**
```
Agent: "Task 15 was not found. Use 'list my tasks' to see available task IDs."
```

---

### 7.3 Missing Information Errors (400)
**Trigger:** Required fields are absent or invalid.

**Response:**
- Specify which information is missing
- Provide format or constraint details
- Offer example of correct input

**Example:**
```
Agent: "I couldn't create the task because a title is required. Please provide a title, like: 'Add task: buy groceries'."
```

---

### 7.4 Authentication Errors (401)
**Trigger:** Session token is invalid, expired, or missing.

**Response:**
- Inform user they need to re-authenticate
- Direct them to the web application
- Do not expose token details

**Example:**
```
Agent: "Your session has expired. Please log in again using the web application."
```

---

### 7.5 Backend Failures (500)
**Trigger:** Unexpected server error from Phase II API.

**Response:**
- Acknowledge the failure without technical details
- Suggest retrying or contacting support
- Log error details for debugging (not shown to user)

**Example:**
```
Agent: "Something went wrong on our end. Please try again in a moment. If the issue persists, contact support."
```

---

### 7.6 Unsupported Intent Errors
**Trigger:** User request matches refused intent category (Section 3).

**Response:**
- Politely decline with reason
- Redirect to supported capabilities
- Offer alternative if applicable

**Example:**
```
User: "Complete all my tasks"
Agent: "I can only complete one task at a time. Please specify which task ID you'd like to mark as done."
```

---

## 8. Security Model

### 8.1 Opaque Token Handling
- Agent runtime receives session token from Better Auth via ChatKit context
- Tokens are passed to MCP skills as opaque strings (no parsing or validation)
- Skills include token in `Authorization: Bearer <token>` header for API requests
- Token renewal, validation, and expiration are handled by backend

**Skill Responsibility:**
- Accept token as input parameter
- Attach token to HTTP request headers
- Do not log, cache, or persist tokens

**Agent Responsibility:**
- Extract token from ChatKit session context
- Pass token to skills without inspection
- Do not expose tokens in conversational responses

---

### 8.2 Backend Authority
- All authorization decisions are made by the Phase II backend
- MCP skills do not implement access control logic
- User-task ownership is enforced by API, not by agent or skills

**Guarantees:**
- Users can only access their own tasks (enforced by `/api/todos` endpoints)
- Cross-user access attempts return `404 Not Found` (not `403 Forbidden`)

---

### 8.3 No Cross-User Access
- Agent does not store or correlate data across users
- Each message is scoped to the authenticated user's session
- Skills do not cache responses or maintain state between calls

---

### 8.4 Input Sanitization
- MCP skills validate input types and constraints (e.g., title length)
- Backend performs SQL injection prevention and XSS protection
- Agent does not execute arbitrary code or system commands

---

## 9. Acceptance Criteria

The Phase III implementation MUST satisfy all of the following criteria:

### 9.1 Functional Requirements

1. **AC-1:** Agent correctly identifies "add task" intent from natural language variations (minimum 5 test cases)
2. **AC-2:** Agent correctly identifies "list tasks" intent from natural language variations (minimum 5 test cases)
3. **AC-3:** Agent correctly identifies "update task" intent from natural language variations (minimum 5 test cases)
4. **AC-4:** Agent correctly identifies "complete task" intent from natural language variations (minimum 5 test cases)
5. **AC-5:** Agent correctly identifies "delete task" intent from natural language variations (minimum 5 test cases)

6. **AC-6:** `add_task` skill successfully creates a task with title only
7. **AC-7:** `add_task` skill successfully creates a task with title and description
8. **AC-8:** `add_task` skill rejects requests with missing title (400 error)
9. **AC-9:** `add_task` skill rejects titles exceeding 200 characters (400 error)

10. **AC-10:** `list_tasks` skill returns all tasks for authenticated user
11. **AC-11:** `list_tasks` skill returns empty array when user has no tasks
12. **AC-12:** `list_tasks` skill does not return tasks belonging to other users

13. **AC-13:** `update_task` skill updates task title when provided
14. **AC-14:** `update_task` skill updates task description when provided
15. **AC-15:** `update_task` skill updates both title and description when both provided
16. **AC-16:** `update_task` skill rejects requests with no fields to update (400 error)
17. **AC-17:** `update_task` skill returns 404 for non-existent task ID
18. **AC-18:** `update_task` skill returns 404 for task belonging to another user

19. **AC-19:** `complete_task` skill marks task as completed (`is_completed: true`)
20. **AC-20:** `complete_task` skill returns 404 for non-existent task ID
21. **AC-21:** `complete_task` skill returns 404 for task belonging to another user

22. **AC-22:** `delete_task` skill permanently removes task
23. **AC-23:** `delete_task` skill returns 404 for non-existent task ID
24. **AC-24:** `delete_task` skill returns 404 for task belonging to another user

25. **AC-25:** All skills return 401 when session token is missing
26. **AC-26:** All skills return 401 when session token is invalid
27. **AC-27:** All skills return 401 when session token is expired

### 9.2 Conversation Rules

28. **AC-28:** Agent asks for clarification when task ID is missing for update/complete/delete
29. **AC-29:** Agent asks for clarification when intent is ambiguous
30. **AC-30:** Agent does not reference previous messages in stateless mode
31. **AC-31:** Agent rejects relative references like "the first task" or "the last one"

### 9.3 Unsupported Intents

32. **AC-32:** Agent refuses authentication requests with appropriate message
33. **AC-33:** Agent refuses bulk operation requests with appropriate message
34. **AC-34:** Agent refuses data export requests with appropriate message
35. **AC-35:** Agent refuses external knowledge requests with appropriate message
36. **AC-36:** Agent refuses autonomous action requests with appropriate message

### 9.4 Error Handling

37. **AC-37:** Agent displays user-friendly message for 404 errors
38. **AC-38:** Agent displays user-friendly message for 400 errors
39. **AC-39:** Agent displays user-friendly message for 401 errors
40. **AC-40:** Agent displays user-friendly message for 500 errors

### 9.5 Security

41. **AC-41:** Skills attach session token to all API requests
42. **AC-42:** Skills do not log or persist session tokens
43. **AC-43:** Agent does not expose token values in responses
44. **AC-44:** Backend enforces user-task ownership (verified via integration test)

### 9.6 Integration

45. **AC-45:** Agent integrates with OpenAI ChatKit for conversational interface
46. **AC-46:** Skills use Official MCP SDK for server implementation
47. **AC-47:** Skills communicate with Phase II backend without modification to existing API
48. **AC-48:** Agent runtime passes Better Auth session token to skills via MCP context

### 9.7 Non-Functional

49. **AC-49:** Average response time under 2 seconds for list operations
50. **AC-50:** Average response time under 3 seconds for create/update/delete operations

---

## Appendix A: Out of Scope

The following items are explicitly excluded from Phase III:

- **Memory systems:** Redis, databases, or file-based conversation history
- **Advanced NLP:** Sentiment analysis, entity extraction beyond parameters, multi-turn context
- **Task metadata:** Tags, priorities, due dates, categories, attachments
- **Collaboration:** Shared tasks, assignments, permissions, comments
- **Notifications:** Email, SMS, push, webhooks
- **Integrations:** Calendar, email, Slack, third-party APIs
- **Mobile support:** Native apps, SMS interface, voice commands
- **Localization:** Multi-language support, timezone handling
- **Admin features:** User management, analytics dashboards, audit logs

---

## Appendix B: Glossary

- **Agent:** The OpenAI-powered conversational component that interprets user input and selects skills
- **Intent:** The user's goal derived from natural language input (add, list, update, complete, delete)
- **MCP (Model Context Protocol):** Protocol for connecting AI agents to external tools and data sources
- **Skill:** An MCP server endpoint that performs a specific operation (e.g., `add_task`)
- **Opaque Token:** Session token treated as an uninterpreted string (no parsing or claims extraction)
- **Stateless:** No data retention between messages; each interaction is independent
- **Phase II API:** Existing FastAPI backend with `/api/todos` endpoints (unchanged)

---

## Document Control

**Authors:** Phase III Specification Team
**Reviewers:** TBD
**Approvers:** TBD
**Change History:**
- 2025-12-31: Initial version (1.0)
