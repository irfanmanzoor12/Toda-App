# Phase III Tasks: AI-Powered Todo Chatbot

**Version:** 1.0
**Date:** 2025-12-31
**Based On:** specs/003-chatbot/spec.md v1.0, specs/003-chatbot/plan.md v1.0

---

## Task Index

**Infrastructure & MCP Server Setup:** T306–T309
**MCP Skills Implementation:** T310–T314
**Agent Runtime & Configuration:** T315–T319
**ChatKit Integration:** T320–T322
**Integration Testing:** T323–T329
**Security & Acceptance Verification:** T330–T332

---

## T306: Initialize Chatbot Project Structure

### Purpose
Create the directory structure and configuration files for the Phase III chatbot implementation.

### Preconditions
- None (first task)

### Scope

**Included:**
- Create `chatbot/` root directory
- Create subdirectories: `mcp-server/`, `agent/`, `tests/`
- Create `.env.example` with required environment variables
- Create `package.json` with project metadata
- Create `tsconfig.json` for TypeScript configuration

**Excluded:**
- Installation of dependencies (handled in T307)
- Implementation of any business logic
- MCP server code

### Files to be Created or Modified
- `chatbot/package.json` (new)
- `chatbot/tsconfig.json` (new)
- `chatbot/.env.example` (new)
- `chatbot/.gitignore` (new)
- `chatbot/README.md` (new)

### Acceptance Criteria
- [ ] Directory structure matches plan.md Section 2.3
- [ ] `.env.example` contains `OPENAI_API_KEY`, `PHASE_2_API_BASE_URL`, `MCP_SERVER_PORT`
- [ ] `package.json` includes name, version, and scripts placeholders
- [ ] `tsconfig.json` configured for strict TypeScript compilation
- [ ] `.gitignore` excludes `.env`, `node_modules/`, `dist/`

### References
- **Spec:** Section 1 (Purpose & Non-Goals)
- **Plan:** Section 2.3 (Configuration Files)

---

## T307: Install Required Dependencies

### Purpose
Install all NPM packages required for MCP server, agent, and testing.

### Preconditions
- T306 completed (project structure exists)

### Scope

**Included:**
- Install Official MCP SDK for TypeScript
- Install OpenAI Agents SDK
- Install HTTP client library (axios or node-fetch)
- Install testing framework (Vitest)
- Install TypeScript and development tools

**Excluded:**
- OpenAI ChatKit (installed in T320)
- UI testing libraries (installed in T327)
- Configuration of tools (handled in subsequent tasks)

### Files to be Created or Modified
- `chatbot/package.json` (modified: add dependencies)
- `chatbot/package-lock.json` (new)
- `chatbot/node_modules/` (new, gitignored)

### Acceptance Criteria
- [ ] MCP SDK package installed and listed in `dependencies`
- [ ] OpenAI Agents SDK installed and listed in `dependencies`
- [ ] HTTP client library installed (axios or node-fetch)
- [ ] Vitest installed in `devDependencies`
- [ ] TypeScript and ts-node installed in `devDependencies`
- [ ] All packages install without errors

### References
- **Spec:** Section 1 (Purpose & Non-Goals)
- **Plan:** Section 2.2 (Technology Stack Installation)

---

## T308: Initialize MCP Server with Health Check

### Purpose
Set up the MCP server process with basic configuration and a health check endpoint.

### Preconditions
- T307 completed (dependencies installed)

### Scope

**Included:**
- Initialize MCP server using Official MCP SDK
- Configure server to listen on port from environment variable
- Implement `/health` endpoint returning 200 OK
- Define server metadata (name: "todo-chatbot-mcp", version: "1.0.0")
- Server startup and shutdown logic

**Excluded:**
- Authentication middleware (T309)
- Skill implementations (T310–T314)
- Skill registration (separate task)

### Files to be Created or Modified
- `chatbot/mcp-server/server.ts` (new)
- `chatbot/mcp-server/index.ts` (new: entry point)

### Acceptance Criteria
- [ ] MCP server starts without errors
- [ ] Server listens on port specified by `MCP_SERVER_PORT` environment variable
- [ ] `/health` endpoint responds with 200 OK and JSON body `{ "status": "healthy" }`
- [ ] Server metadata includes name and version
- [ ] Server can be gracefully shut down (SIGTERM handling)

### References
- **Spec:** Section 8.1 (Opaque Token Handling)
- **Plan:** Section 3.1 (MCP Server Initialization), Task A.1.1

---

## T309: Implement Authentication Middleware for MCP Server

### Purpose
Extract session tokens from MCP request context and attach them to Phase II API requests.

### Preconditions
- T308 completed (MCP server initialized)

### Scope

**Included:**
- Extract session token from MCP request context (opaque string)
- Create HTTP client wrapper that adds `Authorization: Bearer <token>` header
- Handle missing token scenario (return error, do not call backend)
- Ensure tokens are never logged or persisted

**Excluded:**
- Token validation (delegated to Phase II backend)
- Token renewal logic (handled by Better Auth)
- Token parsing or claims extraction

### Files to be Created or Modified
- `chatbot/mcp-server/middleware/auth.ts` (new)
- `chatbot/mcp-server/utils/http-client.ts` (new)

### Acceptance Criteria
- [ ] Token extracted from MCP context without parsing
- [ ] HTTP client wrapper attaches `Authorization: Bearer <token>` to all requests
- [ ] Missing token returns structured error (no backend call)
- [ ] Tokens not logged in any log statements
- [ ] Unit test verifies token attachment to requests
- [ ] Unit test verifies error on missing token

### References
- **Spec:** Section 8.1 (Opaque Token Handling)
- **Plan:** Section 3.1 (MCP Server Initialization), Task A.1.2

---

## T310: Implement add_task MCP Skill

### Purpose
Create MCP skill to add a new task via Phase II `/api/todos` endpoint.

### Preconditions
- T309 completed (auth middleware exists)

### Scope

**Included:**
- Define skill schema: input `{ title: string, description?: string }`, output per spec Section 5.1
- Validate title (1–200 characters, required)
- Validate description (0–1000 characters, optional)
- HTTP POST to `/api/todos` with Authorization header
- Error handling for 400, 401, 500, network errors
- Unit tests for success and error cases

**Excluded:**
- Skill registration with agent (T315)
- Integration tests (T323)
- UI presentation logic

### Files to be Created or Modified
- `chatbot/mcp-server/skills/add-task.ts` (new)
- `chatbot/tests/skills/add-task.test.ts` (new)

### Acceptance Criteria
- [ ] Skill accepts `title` (required) and `description` (optional)
- [ ] Title length validated (1–200 chars)
- [ ] Description length validated (0–1000 chars)
- [ ] POST request sent to `/api/todos` with token
- [ ] Returns structured task object on success
- [ ] Returns appropriate error for 400, 401, 500 responses
- [ ] Unit tests pass for AC-6, AC-7, AC-8, AC-9, AC-25

### References
- **Spec:** Section 5.1 (add_task Skill Contract)
- **Plan:** Section 3.2 (Skill: add_task)

---

## T311: Implement list_tasks MCP Skill

### Purpose
Create MCP skill to retrieve all tasks via Phase II `/api/todos` endpoint.

### Preconditions
- T309 completed (auth middleware exists)

### Scope

**Included:**
- Define skill schema: no input, output `{ tasks: [...] }` per spec Section 5.2
- HTTP GET to `/api/todos` with Authorization header
- Error handling for 401, 500
- Handle empty array as success (not error)
- Unit tests for success and error cases

**Excluded:**
- Skill registration with agent (T315)
- Integration tests (T324)
- UI formatting of task list

### Files to be Created or Modified
- `chatbot/mcp-server/skills/list-tasks.ts` (new)
- `chatbot/tests/skills/list-tasks.test.ts` (new)

### Acceptance Criteria
- [ ] Skill accepts no input parameters
- [ ] GET request sent to `/api/todos` with token
- [ ] Returns array of tasks on success
- [ ] Empty array returned for users with no tasks (not error)
- [ ] Returns appropriate error for 401, 500 responses
- [ ] Unit tests pass for AC-10, AC-11, AC-26

### References
- **Spec:** Section 5.2 (list_tasks Skill Contract)
- **Plan:** Section 3.3 (Skill: list_tasks)

---

## T312: Implement update_task MCP Skill

### Purpose
Create MCP skill to update task title and/or description via Phase II `/api/todos/{task_id}` endpoint.

### Preconditions
- T309 completed (auth middleware exists)

### Scope

**Included:**
- Define skill schema: input `{ task_id: number, title?: string, description?: string }`, output per spec Section 5.3
- Validate at least one of title/description provided
- Validate title length (1–200 characters) if provided
- Validate description length (0–1000 characters) if provided
- HTTP PUT to `/api/todos/{task_id}` with Authorization header
- Error handling for 400, 401, 404, 500
- Unit tests for success and error cases

**Excluded:**
- Skill registration with agent (T315)
- Integration tests (T325)
- Complete task functionality (separate skill)

### Files to be Created or Modified
- `chatbot/mcp-server/skills/update-task.ts` (new)
- `chatbot/tests/skills/update-task.test.ts` (new)

### Acceptance Criteria
- [ ] Skill accepts `task_id` (required), `title` (optional), `description` (optional)
- [ ] Validates at least one field provided
- [ ] PUT request sent to `/api/todos/{task_id}` with token
- [ ] Returns updated task object on success
- [ ] Returns appropriate error for 400, 401, 404, 500 responses
- [ ] Unit tests pass for AC-13, AC-14, AC-15, AC-16, AC-17, AC-27

### References
- **Spec:** Section 5.3 (update_task Skill Contract)
- **Plan:** Section 3.4 (Skill: update_task)

---

## T313: Implement complete_task MCP Skill

### Purpose
Create MCP skill to mark a task as completed via Phase II `/api/todos/{task_id}` endpoint.

### Preconditions
- T309 completed (auth middleware exists)

### Scope

**Included:**
- Define skill schema: input `{ task_id: number }`, output per spec Section 5.4
- HTTP PUT to `/api/todos/{task_id}` with body `{ "is_completed": true }`
- Include Authorization header
- Error handling for 400, 401, 404, 500
- Unit tests for success and error cases

**Excluded:**
- Skill registration with agent (T315)
- Integration tests (T326)
- Uncomplete functionality (not in scope)

### Files to be Created or Modified
- `chatbot/mcp-server/skills/complete-task.ts` (new)
- `chatbot/tests/skills/complete-task.test.ts` (new)

### Acceptance Criteria
- [ ] Skill accepts `task_id` (required)
- [ ] PUT request sent to `/api/todos/{task_id}` with `is_completed: true`
- [ ] Returns task object with `is_completed: true` on success
- [ ] Returns appropriate error for 400, 401, 404, 500 responses
- [ ] Unit tests pass for AC-19, AC-20

### References
- **Spec:** Section 5.4 (complete_task Skill Contract)
- **Plan:** Section 3.5 (Skill: complete_task)

---

## T314: Implement delete_task MCP Skill

### Purpose
Create MCP skill to permanently delete a task via Phase II `/api/todos/{task_id}` endpoint.

### Preconditions
- T309 completed (auth middleware exists)

### Scope

**Included:**
- Define skill schema: input `{ task_id: number }`, output `{ message: string }`
- HTTP DELETE to `/api/todos/{task_id}` with Authorization header
- Error handling for 400, 401, 404, 500
- Unit tests for success and error cases

**Excluded:**
- Skill registration with agent (T315)
- Integration tests (T326)
- Bulk delete operations (not in scope per spec Section 3.3)

### Files to be Created or Modified
- `chatbot/mcp-server/skills/delete-task.ts` (new)
- `chatbot/tests/skills/delete-task.test.ts` (new)

### Acceptance Criteria
- [ ] Skill accepts `task_id` (required)
- [ ] DELETE request sent to `/api/todos/{task_id}` with token
- [ ] Returns success message on deletion
- [ ] Returns appropriate error for 400, 401, 404, 500 responses
- [ ] Unit tests pass for AC-22, AC-23

### References
- **Spec:** Section 5.5 (delete_task Skill Contract)
- **Plan:** Section 3.6 (Skill: delete_task)

---

## T315: Register All MCP Skills with Agent

### Purpose
Configure the OpenAI agent to recognize and invoke all five MCP skills.

### Preconditions
- T310–T314 completed (all skills implemented)

### Scope

**Included:**
- Initialize OpenAI Agents SDK with API key
- Configure model selection (GPT-4 or later)
- Connect agent to MCP server
- Register `add_task`, `list_tasks`, `update_task`, `complete_task`, `delete_task` skills
- Verify agent can list available skills

**Excluded:**
- System prompt configuration (T316)
- Intent detection examples (T317)
- Error response templates (T318)

### Files to be Created or Modified
- `chatbot/agent/config.ts` (new)
- `chatbot/agent/index.ts` (new: agent initialization)

### Acceptance Criteria
- [ ] Agent initialized with OpenAI API key from environment
- [ ] Agent connects to MCP server successfully
- [ ] All five skills registered with correct schemas
- [ ] Agent can list registered skills programmatically
- [ ] Connection test verifies agent-MCP communication

### References
- **Spec:** Section 4 (Agent Responsibilities)
- **Plan:** Section 4.1 (Agent Initialization), Task B.1.1, B.1.3

---

## T316: Configure Agent System Prompt and Conversation Rules

### Purpose
Define agent instructions for intent detection, unsupported intent refusal, and stateless behavior.

### Preconditions
- T315 completed (agent initialized)

### Scope

**Included:**
- System prompt defining role as todo list assistant
- Specify five supported intents (spec Section 2)
- Specify unsupported intents with refusal patterns (spec Section 3)
- Enforce statelessness: no context carryover, no relative references
- Enforce explicit clarification rules (spec Section 6)
- No assumptions policy (spec Section 6.3)

**Excluded:**
- Intent detection examples (T317)
- Error message templates (T318)
- Parameter extraction logic (handled by model)

### Files to be Created or Modified
- `chatbot/agent/prompts/system-prompt.ts` (new)
- `chatbot/agent/config.ts` (modified: add system prompt)

### Acceptance Criteria
- [ ] System prompt includes role definition as todo assistant
- [ ] Supported intents listed: add, list, update, complete, delete
- [ ] Unsupported intents enumerated per spec Section 3 (auth, export, bulk, etc.)
- [ ] Statelessness rules enforced (no "the task I just added")
- [ ] Clarification rules specified (ask when ambiguous)
- [ ] No assumptions rule included (reject relative references)

### References
- **Spec:** Section 2 (Supported Intents), Section 3 (Unsupported Intents), Section 6 (Conversation Rules)
- **Plan:** Section 4.1 (Agent Initialization), Task B.1.2

---

## T317: Add Intent Detection Training Examples

### Purpose
Provide natural language examples for each of the five supported intents to improve detection accuracy.

### Preconditions
- T316 completed (system prompt configured)

### Scope

**Included:**
- 10+ examples for "add task" intent variations
- 10+ examples for "list tasks" intent variations
- 10+ examples for "update task" intent variations
- 10+ examples for "complete task" intent variations
- 10+ examples for "delete task" intent variations
- Edge cases per spec Section 2 (e.g., "Remind me to X" → add_task)

**Excluded:**
- Parameter extraction logic (model-driven)
- Error handling examples (T318)
- Refusal examples for unsupported intents (T318)

### Files to be Created or Modified
- `chatbot/agent/prompts/intent-examples.ts` (new)
- `chatbot/agent/config.ts` (modified: include examples)

### Acceptance Criteria
- [ ] 10+ examples provided for add_task intent
- [ ] 10+ examples provided for list_tasks intent
- [ ] 10+ examples provided for update_task intent
- [ ] 10+ examples provided for complete_task intent
- [ ] 10+ examples provided for delete_task intent
- [ ] Examples cover edge cases from spec Section 2
- [ ] Examples formatted for OpenAI Agents SDK consumption

### References
- **Spec:** Section 2 (Supported User Intents, all subsections)
- **Plan:** Section 4.2 (Intent Detection Configuration)

---

## T318: Implement Error Response Templates and Clarification Prompts

### Purpose
Configure agent to return user-friendly error messages and clarification requests per spec Section 7.

### Preconditions
- T316 completed (system prompt configured)

### Scope

**Included:**
- Error templates for 404, 400, 401, 500 errors (spec Section 7.2–7.5)
- Ambiguity error templates (spec Section 7.1)
- Unsupported intent refusal templates (spec Section 3)
- Clarification prompts for missing task ID, ambiguous intent
- Multi-option prompts for multiple interpretations

**Excluded:**
- Actual error handling logic in skills (already in T310–T314)
- UI presentation of errors (T322)
- Integration testing of error flows (T328)

### Files to be Created or Modified
- `chatbot/agent/prompts/error-templates.ts` (new)
- `chatbot/agent/prompts/clarification-prompts.ts` (new)
- `chatbot/agent/config.ts` (modified: include templates)

### Acceptance Criteria
- [ ] 404 template: "Task X was not found. Use 'list my tasks'..."
- [ ] 400 template: "I couldn't create the task because a title is required..."
- [ ] 401 template: "Your session has expired. Please log in again..."
- [ ] 500 template: "Something went wrong on our end..."
- [ ] Ambiguity template: "I need more information. Do you want to..."
- [ ] Refusal templates for each unsupported intent category (6 categories)
- [ ] Clarification prompts for missing task ID and ambiguous intent

### References
- **Spec:** Section 3 (Unsupported Intents), Section 7 (Error Handling Model)
- **Plan:** Section 4.4 (Error Response Configuration)

---

## T319: Implement Chat API Endpoint for Agent Invocation

### Purpose
Create HTTP endpoint that accepts user messages, invokes the agent, and returns responses.

### Preconditions
- T315–T318 completed (agent fully configured)

### Scope

**Included:**
- POST endpoint `/api/chat` accepting `{ message: string, session_token: string }`
- Extract session token from request
- Pass token to agent runtime as MCP context
- Invoke agent with user message
- Return agent response as JSON `{ response: string }`
- Error handling for missing token, agent failures

**Excluded:**
- ChatKit UI integration (T320–T322)
- Multi-turn conversation history (stateless per spec)
- WebSocket or streaming responses

### Files to be Created or Modified
- `chatbot/agent/api/chat-endpoint.ts` (new)
- `chatbot/agent/api/server.ts` (new: Express/Fastify server)

### Acceptance Criteria
- [ ] POST `/api/chat` accepts `message` and `session_token`
- [ ] Session token passed to MCP context (not parsed by agent)
- [ ] Agent invoked with user message
- [ ] Agent response returned as JSON
- [ ] Missing token returns 401 error
- [ ] Agent errors return 500 with user-friendly message

### References
- **Spec:** Section 6 (Conversation Rules), Section 8.1 (Opaque Token Handling)
- **Plan:** Section 5.1 (ChatKit Setup), Task C.1.2

---

## T320: Initialize OpenAI ChatKit Project

### Purpose
Set up ChatKit SDK and configure it to use the agent from T315–T319.

### Preconditions
- T319 completed (chat API endpoint exists)

### Scope

**Included:**
- Install OpenAI ChatKit SDK
- Configure ChatKit to call `/api/chat` endpoint
- Set up default ChatKit UI components
- Configure ChatKit for stateless mode (no history retention)

**Excluded:**
- Better Auth token integration (T321)
- UI customization for task formatting (T322)
- Deployment configuration

### Files to be Created or Modified
- `chatbot/chatkit/package.json` (new)
- `chatbot/chatkit/src/index.tsx` (new: ChatKit entry point)
- `chatbot/chatkit/src/config.ts` (new: ChatKit configuration)

### Acceptance Criteria
- [ ] ChatKit SDK installed and imported
- [ ] ChatKit configured to call `/api/chat` endpoint
- [ ] Default UI renders conversational interface
- [ ] Stateless mode enforced (no conversation history)
- [ ] User can send messages and receive responses
- [ ] Basic error display for failed requests

### References
- **Spec:** Section 6 (Conversation Rules)
- **Plan:** Section 5.1 (ChatKit Setup), Task C.1.1

---

## T321: Integrate Better Auth Session Token with ChatKit

### Purpose
Extract session token from Better Auth and pass it to the agent runtime via ChatKit.

### Preconditions
- T320 completed (ChatKit initialized)

### Scope

**Included:**
- Extract session token from Better Auth cookie/header
- Pass token to `/api/chat` endpoint in request body
- Handle missing token (redirect to login)
- Handle expired token (401 response triggers re-auth prompt)
- Ensure token not exposed in UI or browser console

**Excluded:**
- Better Auth configuration (already exists in Phase II)
- Token renewal logic (handled by Better Auth)
- Multi-user testing (T330)

### Files to be Created or Modified
- `chatbot/chatkit/src/auth/token-provider.ts` (new)
- `chatbot/chatkit/src/config.ts` (modified: add token extraction)

### Acceptance Criteria
- [ ] Session token extracted from Better Auth session
- [ ] Token included in `/api/chat` POST requests
- [ ] Missing token triggers login redirect
- [ ] 401 response displays re-authentication prompt
- [ ] Token not logged in browser console
- [ ] Token not visible in UI or DevTools Network tab body

### References
- **Spec:** Section 8.1 (Opaque Token Handling), Section 8.2 (Backend Authority)
- **Plan:** Section 5.1 (ChatKit Setup), Task C.1.2, C.1.3

---

## T322: Implement Task List Formatting and Response Presentation

### Purpose
Format agent responses for task lists, confirmations, and errors in ChatKit UI.

### Preconditions
- T321 completed (ChatKit with auth working)

### Scope

**Included:**
- Format task lists as "[ID X] Title (Status)" per spec Section 6.4
- Display task descriptions if present
- Distinguish completed vs pending tasks visually
- Format confirmations: "Task created: [ID 5] Buy milk"
- Display user-friendly error messages (no stack traces)
- Consistent styling for errors, warnings, confirmations

**Excluded:**
- Business logic for task operations (in skills)
- Integration testing (T323–T326)
- Performance optimization

### Files to be Created or Modified
- `chatbot/chatkit/src/components/TaskListFormatter.tsx` (new)
- `chatbot/chatkit/src/components/MessageDisplay.tsx` (new)
- `chatbot/chatkit/src/styles/chat.css` (new)

### Acceptance Criteria
- [ ] Task lists displayed with ID, title, status
- [ ] Completed tasks visually distinct from pending
- [ ] Task descriptions shown when present
- [ ] Confirmations formatted per spec Section 6.4
- [ ] Errors displayed with clear next steps
- [ ] No stack traces or technical details in user-facing messages

### References
- **Spec:** Section 6.4 (Response Format)
- **Plan:** Section 5.2 (UI Presentation)

---

## T323: Integration Test – Add Task Intent

### Purpose
Verify end-to-end add task flow from user input through agent to backend.

### Preconditions
- T322 completed (ChatKit UI functional)
- Phase II backend running

### Scope

**Included:**
- Test 5+ natural language variations for add task intent (AC-1)
- Test task creation with title only (AC-6)
- Test task creation with title and description (AC-7)
- Test rejection of missing title (AC-8)
- Test rejection of title > 200 characters (AC-9)
- Verify task appears in backend database

**Excluded:**
- Unit tests (already in T310)
- UI testing (separate E2E tests)
- Performance benchmarking (T329)

### Files to be Created or Modified
- `chatbot/tests/integration/add-task.test.ts` (new)

### Acceptance Criteria
- [ ] AC-1 verified: 5+ add task variations work
- [ ] AC-6 verified: Title-only task created
- [ ] AC-7 verified: Title + description task created
- [ ] AC-8 verified: Missing title rejected with error
- [ ] AC-9 verified: Long title rejected with error
- [ ] All tests pass against running Phase II backend

### References
- **Spec:** Section 2.1 (Add Task), Section 5.1 (add_task Skill Contract), Section 9 (AC-1, AC-6–AC-9)
- **Plan:** Section 6.1 (Functional Testing), Task D.1.1, D.1.2

---

## T324: Integration Test – List Tasks Intent

### Purpose
Verify end-to-end list tasks flow from user input through agent to backend.

### Preconditions
- T322 completed (ChatKit UI functional)
- Phase II backend running

### Scope

**Included:**
- Test 5+ natural language variations for list tasks intent (AC-2)
- Test listing all tasks for authenticated user (AC-10)
- Test empty list for new user (AC-11)
- Verify tasks formatted correctly in UI

**Excluded:**
- Multi-user isolation testing (T330)
- Unit tests (already in T311)
- Performance benchmarking (T329)

### Files to be Created or Modified
- `chatbot/tests/integration/list-tasks.test.ts` (new)

### Acceptance Criteria
- [ ] AC-2 verified: 5+ list task variations work
- [ ] AC-10 verified: All tasks returned for user
- [ ] AC-11 verified: Empty array handled gracefully
- [ ] Tasks displayed with ID, title, status
- [ ] All tests pass against running Phase II backend

### References
- **Spec:** Section 2.2 (List Tasks), Section 5.2 (list_tasks Skill Contract), Section 9 (AC-2, AC-10–AC-11)
- **Plan:** Section 6.1 (Functional Testing), Task D.1.1, D.1.3

---

## T325: Integration Test – Update Task Intent

### Purpose
Verify end-to-end update task flow from user input through agent to backend.

### Preconditions
- T322 completed (ChatKit UI functional)
- Phase II backend running

### Scope

**Included:**
- Test 5+ natural language variations for update task intent (AC-3)
- Test updating title only (AC-13)
- Test updating description only (AC-14)
- Test updating both fields (AC-15)
- Test rejection of empty update (AC-16)
- Test 404 for non-existent task (AC-17)

**Excluded:**
- Multi-user isolation testing (T330)
- Unit tests (already in T312)
- Performance benchmarking (T329)

### Files to be Created or Modified
- `chatbot/tests/integration/update-task.test.ts` (new)

### Acceptance Criteria
- [ ] AC-3 verified: 5+ update task variations work
- [ ] AC-13 verified: Title-only update succeeds
- [ ] AC-14 verified: Description-only update succeeds
- [ ] AC-15 verified: Both fields update succeeds
- [ ] AC-16 verified: Empty update rejected
- [ ] AC-17 verified: Non-existent task returns 404 error

### References
- **Spec:** Section 2.3 (Update Task), Section 5.3 (update_task Skill Contract), Section 9 (AC-3, AC-13–AC-17)
- **Plan:** Section 6.1 (Functional Testing), Task D.1.1, D.1.4

---

## T326: Integration Test – Complete and Delete Task Intents

### Purpose
Verify end-to-end complete and delete task flows from user input through agent to backend.

### Preconditions
- T322 completed (ChatKit UI functional)
- Phase II backend running

### Scope

**Included:**
- Test 5+ natural language variations for complete task intent (AC-4)
- Test 5+ natural language variations for delete task intent (AC-5)
- Test marking task as completed (AC-19)
- Test 404 for non-existent task in complete (AC-20)
- Test permanent deletion (AC-22)
- Test 404 for non-existent task in delete (AC-23)

**Excluded:**
- Multi-user isolation testing (T330)
- Unit tests (already in T313, T314)
- Performance benchmarking (T329)

### Files to be Created or Modified
- `chatbot/tests/integration/complete-task.test.ts` (new)
- `chatbot/tests/integration/delete-task.test.ts` (new)

### Acceptance Criteria
- [ ] AC-4 verified: 5+ complete task variations work
- [ ] AC-5 verified: 5+ delete task variations work
- [ ] AC-19 verified: Task marked as completed
- [ ] AC-20 verified: Non-existent task returns 404 in complete
- [ ] AC-22 verified: Task permanently deleted
- [ ] AC-23 verified: Non-existent task returns 404 in delete

### References
- **Spec:** Section 2.4 (Complete Task), Section 2.5 (Delete Task), Sections 5.4–5.5 (Skill Contracts), Section 9 (AC-4–AC-5, AC-19–AC-20, AC-22–AC-23)
- **Plan:** Section 6.1 (Functional Testing), Task D.1.1, D.1.5, D.1.6

---

## T327: Integration Test – Conversation Rules and Clarification

### Purpose
Verify statelessness enforcement and clarification prompts per spec Section 6.

### Preconditions
- T322 completed (ChatKit UI functional)

### Scope

**Included:**
- Test missing task ID triggers clarification (AC-28)
- Test ambiguous intent triggers clarification (AC-29)
- Test no context carryover between messages (AC-30)
- Test rejection of relative references like "the first one" (AC-31)
- Test sequences: "Add task X" → "Delete it" (should require ID)

**Excluded:**
- Intent detection tests (T323–T326)
- Error handling tests (T328)
- Multi-user isolation (T330)

### Files to be Created or Modified
- `chatbot/tests/integration/conversation-rules.test.ts` (new)

### Acceptance Criteria
- [ ] AC-28 verified: Missing task ID prompts clarification
- [ ] AC-29 verified: Ambiguous intent prompts clarification
- [ ] AC-30 verified: Agent does not reference prior messages
- [ ] AC-31 verified: Relative references rejected
- [ ] Clarification prompts match templates from spec Section 7.1

### References
- **Spec:** Section 6 (Conversation Rules), Section 7.1 (Ambiguity Errors), Section 9 (AC-28–AC-31)
- **Plan:** Section 6.2 (Conversation Rules Testing), Task D.2.1, D.2.2

---

## T328: Integration Test – Error Handling and Unsupported Intents

### Purpose
Verify error messages and refusals for unsupported intents per spec Sections 3 and 7.

### Preconditions
- T322 completed (ChatKit UI functional)

### Scope

**Included:**
- Test authentication request refusal (AC-32)
- Test bulk operation refusal (AC-33)
- Test data export refusal (AC-34)
- Test external knowledge refusal (AC-35)
- Test autonomous action refusal (AC-36)
- Verify 404 error message format (AC-37)
- Verify 400 error message format (AC-38)
- Verify 401 error message format (AC-39)
- Verify 500 error message format (AC-40)

**Excluded:**
- Token handling tests (T330)
- Performance tests (T329)
- Intent detection tests (T323–T326)

### Files to be Created or Modified
- `chatbot/tests/integration/unsupported-intents.test.ts` (new)
- `chatbot/tests/integration/error-messages.test.ts` (new)

### Acceptance Criteria
- [ ] AC-32 verified: Auth requests refused with pattern from spec Section 3.1
- [ ] AC-33 verified: Bulk ops refused with pattern from spec Section 3.3
- [ ] AC-34 verified: Export requests refused with pattern from spec Section 3.2
- [ ] AC-35 verified: External knowledge refused with pattern from spec Section 3.4
- [ ] AC-36 verified: Autonomous requests refused with pattern from spec Section 3.5
- [ ] AC-37–AC-40 verified: Error messages match spec Section 7 templates

### References
- **Spec:** Section 3 (Unsupported Intents), Section 7 (Error Handling Model), Section 9 (AC-32–AC-40)
- **Plan:** Section 6.3 (Unsupported Intent Testing), Section 6.4 (Error Handling Testing)

---

## T329: Performance Benchmarking and Optimization

### Purpose
Measure response times and verify performance targets per spec AC-49 and AC-50.

### Preconditions
- T322 completed (ChatKit UI functional)
- All integration tests passing (T323–T328)

### Scope

**Included:**
- Measure list_tasks response time over 100 requests (target: <2s average)
- Measure add_task, update_task, complete_task, delete_task over 100 requests each (target: <3s average)
- Identify bottlenecks if targets not met
- Optimize HTTP client connection pooling if needed
- Profile MCP server performance

**Excluded:**
- Load testing with concurrent users (out of scope)
- Caching strategies that violate statelessness
- Code changes that affect functionality

### Files to be Created or Modified
- `chatbot/tests/performance/benchmark.test.ts` (new)
- `chatbot/tests/performance/results.md` (new: report)

### Acceptance Criteria
- [ ] AC-49 verified: List operations average <2 seconds
- [ ] AC-50 verified: Create/update/delete operations average <3 seconds
- [ ] Bottlenecks identified and documented if targets not met
- [ ] Performance report includes P50, P95, P99 percentiles
- [ ] Optimization recommendations documented if needed

### References
- **Spec:** Section 9 (AC-49, AC-50)
- **Plan:** Section 3.7 (MCP Server Testing), Task A.7.2; Section 6.7 (Performance Testing)

---

## T330: Security Audit – Token Handling and Multi-User Isolation

### Purpose
Verify token security and cross-user access prevention per spec Section 8.

### Preconditions
- All integration tests passing (T323–T328)

### Scope

**Included:**
- Verify token attached to all API requests (AC-41, network inspection)
- Verify tokens not logged in server logs (AC-42, log audit)
- Verify tokens not exposed in UI or responses (AC-43, UI inspection)
- Verify backend enforces task ownership (AC-44, multi-user test)
- Test skills with missing token (AC-25)
- Test skills with invalid token (AC-26)
- Test skills with expired token (AC-27)
- Multi-user isolation tests for list (AC-12), update (AC-18), complete (AC-21), delete (AC-24)

**Excluded:**
- Token generation logic (Better Auth responsibility)
- Backend authorization logic (Phase II responsibility)
- Penetration testing

### Files to be Created or Modified
- `chatbot/tests/security/token-handling.test.ts` (new)
- `chatbot/tests/security/multi-user-isolation.test.ts` (new)
- `chatbot/tests/security/audit-report.md` (new)

### Acceptance Criteria
- [ ] AC-41 verified: Token in Authorization header for all API calls
- [ ] AC-42 verified: No tokens in server logs (grep audit)
- [ ] AC-43 verified: No tokens in UI or network responses
- [ ] AC-44 verified: User A cannot access User B's tasks
- [ ] AC-25–AC-27 verified: Missing/invalid/expired tokens return 401
- [ ] AC-12, AC-18, AC-21, AC-24 verified: Multi-user isolation enforced

### References
- **Spec:** Section 8 (Security Model), Section 9 (AC-12, AC-18, AC-21, AC-24, AC-25–AC-27, AC-41–AC-44)
- **Plan:** Section 6.5 (Security Testing), Task D.5.1

---

## T331: Technology Stack Verification

### Purpose
Verify integration with required technologies per spec Section 9 (AC-45–AC-48).

### Preconditions
- T330 completed (security audit passed)

### Scope

**Included:**
- Verify ChatKit integration (AC-45)
- Verify Official MCP SDK usage (AC-46)
- Verify Phase II API unchanged (AC-47, run Phase II tests)
- Verify token passed via MCP context (AC-48)

**Excluded:**
- Functional testing (already in T323–T328)
- Performance testing (already in T329)
- Security testing (already in T330)

### Files to be Created or Modified
- `chatbot/tests/integration/technology-stack.test.ts` (new)

### Acceptance Criteria
- [ ] AC-45 verified: ChatKit SDK integrated and functional
- [ ] AC-46 verified: MCP SDK imported and used for all skills
- [ ] AC-47 verified: Phase II backend tests still pass (no changes)
- [ ] AC-48 verified: Token passed from ChatKit → Agent → MCP context
- [ ] Documentation updated with technology versions

### References
- **Spec:** Section 9 (AC-45–AC-48)
- **Plan:** Section 6.6 (Integration Testing), Task D.6.1

---

## T332: Final Acceptance Criteria Verification and Sign-Off

### Purpose
Comprehensive verification that all 50 acceptance criteria from spec Section 9 are satisfied.

### Preconditions
- T323–T331 completed (all tests passing)

### Scope

**Included:**
- Generate test report showing all 50 ACs with pass/fail status
- Document any deviations or blockers
- Create acceptance sign-off checklist
- Update project README with deployment instructions
- Archive test results and performance benchmarks

**Excluded:**
- New feature development
- Bug fixes for Phase II
- Production deployment (separate process)

### Files to be Created or Modified
- `chatbot/tests/acceptance-report.md` (new)
- `chatbot/README.md` (modified: add deployment guide)
- `chatbot/ACCEPTANCE-SIGN-OFF.md` (new)

### Acceptance Criteria
- [ ] All 50 ACs (AC-1 through AC-50) verified and documented
- [ ] Test report includes evidence for each AC (logs, screenshots)
- [ ] Zero failing tests in CI pipeline
- [ ] Deployment guide documented per plan Section 7.2
- [ ] Sign-off checklist completed and approved
- [ ] All deliverables match plan Section 10 (Implementation Checklist)

### References
- **Spec:** Section 9 (Acceptance Criteria, all 50 items)
- **Plan:** Section 1.2 (Success Criteria), Section 10 (Implementation Checklist)

---

## End of Tasks

**Total Tasks:** 27 (T306–T332)

**Estimated Completion Checkpoints:**
- Infrastructure & MCP: T306–T314 (9 tasks)
- Agent & API: T315–T319 (5 tasks)
- ChatKit UI: T320–T322 (3 tasks)
- Testing & Verification: T323–T332 (10 tasks)

**Critical Path:**
T306 → T307 → T308 → T309 → T310–T314 (parallel) → T315 → T316 → T317 → T318 → T319 → T320 → T321 → T322 → T323–T328 (parallel) → T329 → T330 → T331 → T332
