# Phase III Implementation Plan: AI-Powered Todo Chatbot

**Version:** 1.0
**Date:** 2025-12-31
**Based On:** Phase III Specification v1.0

---

## 1. Overview

This plan outlines the implementation strategy for the AI-Powered Todo Chatbot as defined in `specs/003-chatbot/spec.md`. The implementation will be executed in sequential phases, each with clear deliverables and verification steps.

### 1.1 Implementation Principles

- **Specification-Driven:** Every decision references the normative spec
- **No Backend Changes:** Phase II Todo API remains untouched
- **Stateless First:** No persistent storage of conversation state
- **Security by Delegation:** Backend enforces all authorization
- **Test Before Integrate:** Each component verified independently before integration

### 1.2 Success Criteria

Implementation is complete when all 50 acceptance criteria (AC-1 through AC-50) from Section 9 of the specification are verified and passing.

---

## 2. Prerequisites & Environment Setup

### 2.1 Required Accounts & Access

- OpenAI Platform account with API access
- Access to Phase II Todo Web Application (backend running, database initialized)
- Better Auth session token generation capability for testing
- Node.js environment (compatible with OpenAI Agents SDK and MCP SDK)

### 2.2 Technology Stack Installation

**Required Dependencies:**
- OpenAI Agents SDK (latest stable version)
- Official MCP SDK for TypeScript/JavaScript
- OpenAI ChatKit (for conversational interface)
- HTTP client library (for API communication with Phase II backend)
- Testing framework (Jest or Vitest recommended)

**Development Tools:**
- TypeScript compiler (for type safety)
- ESLint/Prettier (for code quality)
- Environment variable management (.env files)

### 2.3 Configuration Files

**Create Configuration Structure:**
- `chatbot/` - Root directory for Phase III code
- `chatbot/mcp-server/` - MCP skills implementation
- `chatbot/agent/` - OpenAI agent configuration
- `chatbot/tests/` - Integration and unit tests
- `chatbot/.env.example` - Environment variable template

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI platform authentication
- `PHASE_2_API_BASE_URL` - Phase II backend URL (e.g., `http://localhost:8000`)
- `MCP_SERVER_PORT` - Port for MCP server (e.g., 3100)

---

## 3. Phase A: MCP Skills Development

**Objective:** Implement all five MCP skills as independent, testable components.

### 3.1 MCP Server Initialization

**Task A.1.1:** Initialize MCP server project
- Set up MCP SDK with official TypeScript/JavaScript package
- Configure server to listen on specified port
- Implement health check endpoint for monitoring
- Define server metadata (name, version, description)

**Task A.1.2:** Implement authentication middleware
- Extract session token from MCP request context
- Create HTTP client wrapper that attaches `Authorization: Bearer <token>` header
- Handle missing token scenario (return error, do not call backend)
- Ensure tokens are never logged or persisted

**Verification:**
- MCP server starts without errors
- Health check endpoint responds with 200 OK
- Token extraction logic tested with mock tokens

---

### 3.2 Skill: add_task

**Reference:** Spec Section 5.1

**Task A.2.1:** Define skill schema
- Input parameters: `title` (string, required), `description` (string, optional)
- Output schema matches spec Section 5.1
- Validate title length (1-200 characters)
- Validate description length (0-1000 characters)

**Task A.2.2:** Implement backend integration
- HTTP POST to `/api/todos`
- Request body: `{ "title": string, "description": string | null }`
- Include session token in Authorization header
- Parse JSON response

**Task A.2.3:** Implement error handling
- 400 Bad Request → Return structured error to agent
- 401 Unauthorized → Return auth error to agent
- 500 Internal Server Error → Return generic error to agent
- Network errors → Return connection error to agent

**Verification:**
- Unit test: Valid title creates task (AC-6)
- Unit test: Valid title + description creates task (AC-7)
- Unit test: Missing title returns 400 error (AC-8)
- Unit test: Title > 200 chars returns 400 error (AC-9)
- Unit test: Invalid token returns 401 error (AC-25)

---

### 3.3 Skill: list_tasks

**Reference:** Spec Section 5.2

**Task A.3.1:** Define skill schema
- Input parameters: None
- Output schema: `{ "tasks": [...] }` as per spec Section 5.2

**Task A.3.2:** Implement backend integration
- HTTP GET to `/api/todos`
- Include session token in Authorization header
- Parse JSON array response

**Task A.3.3:** Implement error handling
- 401 Unauthorized → Return auth error to agent
- 500 Internal Server Error → Return generic error to agent
- Empty array is success, not error

**Verification:**
- Unit test: Returns all tasks for authenticated user (AC-10)
- Unit test: Returns empty array when no tasks exist (AC-11)
- Integration test: Does not return other users' tasks (AC-12)
- Unit test: Invalid token returns 401 error (AC-26)

---

### 3.4 Skill: update_task

**Reference:** Spec Section 5.3

**Task A.4.1:** Define skill schema
- Input parameters: `task_id` (integer, required), `title` (string, optional), `description` (string, optional)
- Validate at least one of title/description is provided
- Output schema matches spec Section 5.3

**Task A.4.2:** Implement backend integration
- HTTP PUT to `/api/todos/{task_id}`
- Request body includes only provided fields
- Include session token in Authorization header
- Parse JSON response

**Task A.4.3:** Implement error handling
- 400 Bad Request → Return validation error to agent
- 401 Unauthorized → Return auth error to agent
- 404 Not Found → Return not found error to agent
- 500 Internal Server Error → Return generic error to agent

**Verification:**
- Unit test: Updates title only (AC-13)
- Unit test: Updates description only (AC-14)
- Unit test: Updates both fields (AC-15)
- Unit test: Rejects request with no fields (AC-16)
- Unit test: Returns 404 for non-existent task (AC-17)
- Integration test: Returns 404 for other user's task (AC-18)
- Unit test: Invalid token returns 401 error (AC-27)

---

### 3.5 Skill: complete_task

**Reference:** Spec Section 5.4

**Task A.5.1:** Define skill schema
- Input parameters: `task_id` (integer, required)
- Output schema matches spec Section 5.4 with `is_completed: true`

**Task A.5.2:** Implement backend integration
- HTTP PUT to `/api/todos/{task_id}`
- Request body: `{ "is_completed": true }`
- Include session token in Authorization header
- Parse JSON response

**Task A.5.3:** Implement error handling
- 400 Bad Request → Return validation error to agent
- 401 Unauthorized → Return auth error to agent
- 404 Not Found → Return not found error to agent
- 500 Internal Server Error → Return generic error to agent

**Verification:**
- Unit test: Marks task as completed (AC-19)
- Unit test: Returns 404 for non-existent task (AC-20)
- Integration test: Returns 404 for other user's task (AC-21)

---

### 3.6 Skill: delete_task

**Reference:** Spec Section 5.5

**Task A.6.1:** Define skill schema
- Input parameters: `task_id` (integer, required)
- Output schema: `{ "message": "Task deleted successfully" }`

**Task A.6.2:** Implement backend integration
- HTTP DELETE to `/api/todos/{task_id}`
- Include session token in Authorization header
- Parse response

**Task A.6.3:** Implement error handling
- 400 Bad Request → Return validation error to agent
- 401 Unauthorized → Return auth error to agent
- 404 Not Found → Return not found error to agent
- 500 Internal Server Error → Return generic error to agent

**Verification:**
- Unit test: Permanently deletes task (AC-22)
- Unit test: Returns 404 for non-existent task (AC-23)
- Integration test: Returns 404 for other user's task (AC-24)

---

### 3.7 MCP Server Testing

**Task A.7.1:** Integration test suite
- Test server startup and shutdown
- Test all skills with valid inputs
- Test error handling across all skills
- Test concurrent skill invocations (thread safety)

**Task A.7.2:** Performance baseline
- Measure response times for list operations (target: <2s, AC-49)
- Measure response times for create/update/delete (target: <3s, AC-50)
- Identify bottlenecks if targets not met

**Deliverable:** Fully tested MCP server with all five skills operational.

---

## 4. Phase B: Agent Configuration

**Objective:** Configure OpenAI agent to interpret intents and invoke MCP skills.

### 4.1 Agent Initialization

**Task B.1.1:** Set up OpenAI Agents SDK
- Initialize agent with OpenAI API key
- Configure model selection (GPT-4 or later recommended for intent detection)
- Set up MCP connection to local server

**Task B.1.2:** Define agent instructions
- System prompt defining role: "You are a todo list assistant..."
- Specify five supported intents from spec Section 2
- Specify unsupported intents from spec Section 3
- Include conversation rules from spec Section 6 (stateless, explicit clarification, no assumptions)

**Task B.1.3:** Register MCP skills
- Register `add_task` skill with schema
- Register `list_tasks` skill with schema
- Register `update_task` skill with schema
- Register `complete_task` skill with schema
- Register `delete_task` skill with schema

**Verification:**
- Agent starts and connects to MCP server
- Agent can list available skills
- System prompt correctly guides agent behavior

---

### 4.2 Intent Detection Configuration

**Task B.2.1:** Add task intent examples
- Provide 10+ training examples for "add task" variations (spec Section 2.1)
- Include edge cases: "Remind me to X", "Create task X", "Add X"

**Task B.2.2:** List tasks intent examples
- Provide 10+ training examples for "list tasks" variations (spec Section 2.2)
- Include edge cases: "What's on my list?", "Show todos", "What do I need to do?"

**Task B.2.3:** Update task intent examples
- Provide 10+ training examples for "update task" variations (spec Section 2.3)
- Include edge cases: title-only, description-only, both fields

**Task B.2.4:** Complete task intent examples
- Provide 10+ training examples for "complete task" variations (spec Section 2.4)
- Include edge cases: "Mark done", "Finished with", "Task X is complete"

**Task B.2.5:** Delete task intent examples
- Provide 10+ training examples for "delete task" variations (spec Section 2.5)
- Include edge cases: "Remove", "Get rid of", "Cancel", "Trash"

**Verification:**
- Test each intent category with 5 natural language variations (AC-1 through AC-5)
- Verify agent selects correct skill for each variation
- Verify parameter extraction accuracy

---

### 4.3 Parameter Extraction Logic

**Task B.3.1:** Task ID extraction
- Configure agent to identify numeric task IDs (e.g., "task 5", "ID 10", "#3")
- Reject ambiguous references ("the first one", "that task")
- Require explicit ID for update/complete/delete operations

**Task B.3.2:** Title extraction
- Primary action phrase becomes title
- Handle quoted strings ("Add task 'Buy milk'")
- Preserve user phrasing (no auto-correction)

**Task B.3.3:** Description extraction
- Detect keywords: "description:", "note:", "details:"
- Handle context-separated clauses ("Buy milk, organic if possible" → description = "organic if possible")
- Allow optional description (null is valid)

**Verification:**
- Test extraction with 20+ natural language samples
- Verify edge cases (missing IDs, ambiguous titles, multi-part descriptions)

---

### 4.4 Error Response Configuration

**Task B.4.1:** Implement error message templates
- 404 error → "Task X was not found. Use 'list my tasks' to see available task IDs." (spec Section 7.2)
- 400 error → "I couldn't create the task because a title is required..." (spec Section 7.3)
- 401 error → "Your session has expired. Please log in again..." (spec Section 7.4)
- 500 error → "Something went wrong on our end..." (spec Section 7.5)
- Ambiguity error → "I need more information. Do you want to..." (spec Section 7.1)
- Unsupported intent → Category-specific refusals from spec Section 3

**Task B.4.2:** Implement clarification prompts
- Missing task ID → "Please provide the specific task ID..."
- Ambiguous intent → "I can update task 3, but I need to know what to change..."
- Multiple interpretations → Provide numbered options for user to select

**Verification:**
- Test error handling for all error types (AC-37 through AC-40)
- Test clarification scenarios (AC-28, AC-29)
- Verify unsupported intent refusals (AC-32 through AC-36)

---

### 4.5 Statelessness Enforcement

**Task B.5.1:** Configure agent to ignore conversation history
- Each message processed independently
- No context carryover between turns
- Agent cannot reference "the task I just added" or "the previous request"

**Task B.5.2:** Test statelessness
- Verify agent does not reference prior messages (AC-30)
- Verify agent rejects relative references (AC-31)
- Test sequences: "Add task X" → "Delete it" (should fail, require ID)

**Verification:**
- AC-28: Agent asks for task ID when missing
- AC-29: Agent asks for clarification when ambiguous
- AC-30: Agent does not use previous message context
- AC-31: Agent rejects relative references

---

## 5. Phase C: ChatKit Integration

**Objective:** Embed agent in OpenAI ChatKit conversational interface.

### 5.1 ChatKit Setup

**Task C.1.1:** Initialize ChatKit project
- Install OpenAI ChatKit SDK
- Configure ChatKit to use the OpenAI agent from Phase B
- Set up UI components (if ChatKit provides default UI, use it)

**Task C.1.2:** Session token integration
- Configure Better Auth to provide session token to ChatKit
- Implement token extraction from user session (cookie or header)
- Pass token to agent runtime as context parameter

**Task C.1.3:** Token lifecycle handling
- Handle token expiration (401 errors trigger re-authentication prompt)
- Handle missing token (prompt user to log in)
- Do not expose token in UI or logs

**Verification:**
- ChatKit renders conversational interface
- User can send messages and receive responses
- Session token is passed to agent correctly (AC-41, AC-48)

---

### 5.2 UI Presentation

**Task C.2.1:** Format task lists
- Display tasks in readable format: "[ID X] Title (Status)"
- Include task details (description if present)
- Distinguish completed vs pending tasks visually

**Task C.2.2:** Format confirmations
- "Task created: [ID 5] Buy milk"
- "Task 5 updated successfully"
- "Task 10 marked as complete"
- "Task 7 deleted"

**Task C.2.3:** Format errors
- User-friendly error messages (no stack traces)
- Clear next steps for user
- Consistent error styling

**Verification:**
- Test UI with all five intents
- Verify readability and clarity of responses
- Test error message presentation

---

## 6. Phase D: End-to-End Testing

**Objective:** Verify all 50 acceptance criteria against integrated system.

### 6.1 Functional Testing

**Task D.1.1:** Intent detection tests
- AC-1: Test 5+ variations of "add task" intent
- AC-2: Test 5+ variations of "list tasks" intent
- AC-3: Test 5+ variations of "update task" intent
- AC-4: Test 5+ variations of "complete task" intent
- AC-5: Test 5+ variations of "delete task" intent

**Task D.1.2:** Add task tests
- AC-6: Create task with title only
- AC-7: Create task with title and description
- AC-8: Verify rejection of missing title
- AC-9: Verify rejection of title > 200 characters

**Task D.1.3:** List tasks tests
- AC-10: List all tasks for user
- AC-11: List empty tasks (new user)
- AC-12: Verify isolation (multi-user test)

**Task D.1.4:** Update task tests
- AC-13: Update title only
- AC-14: Update description only
- AC-15: Update both fields
- AC-16: Reject empty update
- AC-17: Verify 404 for non-existent task
- AC-18: Verify 404 for other user's task (multi-user test)

**Task D.1.5:** Complete task tests
- AC-19: Mark task as completed
- AC-20: Verify 404 for non-existent task
- AC-21: Verify 404 for other user's task (multi-user test)

**Task D.1.6:** Delete task tests
- AC-22: Permanently delete task
- AC-23: Verify 404 for non-existent task
- AC-24: Verify 404 for other user's task (multi-user test)

**Task D.1.7:** Authentication tests
- AC-25: Test all skills with missing token
- AC-26: Test all skills with invalid token
- AC-27: Test all skills with expired token

---

### 6.2 Conversation Rules Testing

**Task D.2.1:** Clarification tests
- AC-28: Missing task ID triggers clarification
- AC-29: Ambiguous intent triggers clarification

**Task D.2.2:** Statelessness tests
- AC-30: Verify no context carryover
- AC-31: Verify rejection of relative references

---

### 6.3 Unsupported Intent Testing

**Task D.3.1:** Refusal tests
- AC-32: Test authentication request refusal
- AC-33: Test bulk operation refusal
- AC-34: Test data export refusal
- AC-35: Test external knowledge refusal
- AC-36: Test autonomous action refusal

---

### 6.4 Error Handling Testing

**Task D.4.1:** Error message tests
- AC-37: Verify 404 error message format
- AC-38: Verify 400 error message format
- AC-39: Verify 401 error message format
- AC-40: Verify 500 error message format

---

### 6.5 Security Testing

**Task D.5.1:** Token handling tests
- AC-41: Verify token attached to API requests (network inspection)
- AC-42: Verify tokens not logged (log audit)
- AC-43: Verify tokens not exposed in responses (UI inspection)
- AC-44: Verify backend enforces ownership (multi-user test)

---

### 6.6 Integration Testing

**Task D.6.1:** Technology stack verification
- AC-45: Verify ChatKit integration
- AC-46: Verify MCP SDK usage
- AC-47: Verify Phase II API unchanged (run Phase II tests)
- AC-48: Verify token passed via MCP context

---

### 6.7 Performance Testing

**Task D.7.1:** Response time benchmarks
- AC-49: List operations < 2 seconds (average over 100 requests)
- AC-50: Create/update/delete < 3 seconds (average over 100 requests)

**If benchmarks fail:**
- Profile MCP server for bottlenecks
- Optimize HTTP client connection pooling
- Consider caching strategies (if allowed by statelessness)
- Review network latency between components

---

## 7. Phase E: Deployment Preparation

**Objective:** Package and document deployment process.

### 7.1 Environment Configuration

**Task E.1.1:** Production environment variables
- Document all required environment variables
- Provide `.env.example` with placeholder values
- Document production API URLs for Phase II backend

**Task E.1.2:** Secrets management
- Document secure storage for OpenAI API key
- Document secure storage for session tokens (handled by Better Auth)
- Ensure no secrets committed to version control

---

### 7.2 Deployment Documentation

**Task E.2.1:** Deployment guide
- Prerequisites (Node.js version, dependencies)
- Installation steps (npm install, build process)
- Configuration steps (environment variables)
- Startup procedure (MCP server, then ChatKit)
- Health check verification

**Task E.2.2:** Troubleshooting guide
- Common errors and solutions
- MCP server connection issues
- OpenAI API rate limiting
- Phase II backend connectivity
- Better Auth token issues

**Task E.2.3:** Monitoring recommendations
- Log MCP skill invocations (without tokens)
- Track error rates by type (400, 401, 404, 500)
- Monitor response times
- Alert on health check failures

---

### 7.3 User Documentation

**Task E.3.1:** User guide
- How to access chatbot interface
- Supported commands with examples
- Examples of natural language phrasing
- Error message explanations
- FAQ section

**Task E.3.2:** Example conversations
- Adding tasks (various phrasings)
- Listing tasks
- Updating tasks
- Completing tasks
- Deleting tasks
- Handling errors and clarifications

---

## 8. Rollout Strategy

### 8.1 Phased Rollout

**Phase 1: Internal Testing**
- Deploy to staging environment
- Test with 3-5 internal users
- Collect feedback on intent detection accuracy
- Verify error handling in real scenarios
- Duration: 3-5 days

**Phase 2: Limited Beta**
- Deploy to production with feature flag
- Enable for 10-20 beta users
- Monitor logs for unexpected errors
- Gather user feedback on conversational quality
- Duration: 1-2 weeks

**Phase 3: General Availability**
- Enable for all authenticated users
- Monitor performance metrics
- Track adoption rate
- Collect user feedback for future improvements

---

### 8.2 Success Metrics

**Functional Metrics:**
- Intent detection accuracy > 95%
- Skill invocation success rate > 98%
- User error rate < 5% (errors caused by user input, not system)

**Performance Metrics:**
- P95 response time < 3 seconds
- MCP server uptime > 99.5%
- ChatKit availability > 99.9%

**User Metrics:**
- User adoption rate (% of authenticated users who try chatbot)
- Daily active users (DAU) of chatbot feature
- Average messages per session

---

## 9. Risk Management

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI API rate limiting | Medium | High | Implement request queuing, monitor quota |
| MCP server downtime | Low | High | Health checks, auto-restart, monitoring alerts |
| Phase II API breaking changes | Low | Critical | Pin Phase II version, integration test suite |
| Session token expiration handling | Medium | Medium | Clear error messages, re-auth flow |
| Intent detection inaccuracy | Medium | Medium | Extensive training examples, user feedback loop |

---

### 9.2 Compliance & Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Token exposure in logs | Low | Critical | Code review, log auditing, AC-42 verification |
| Cross-user data access | Very Low | Critical | Integration tests (AC-12, AC-18, AC-21, AC-24, AC-44) |
| Injection attacks | Low | High | Backend input validation (already in Phase II) |
| OpenAI data retention policies | Low | Medium | Review OpenAI terms, ensure compliance |

---

## 10. Implementation Checklist

**Phase A: MCP Skills**
- [ ] MCP server initialized and running
- [ ] Skill: add_task implemented and tested
- [ ] Skill: list_tasks implemented and tested
- [ ] Skill: update_task implemented and tested
- [ ] Skill: complete_task implemented and tested
- [ ] Skill: delete_task implemented and tested
- [ ] All skill-level unit tests passing

**Phase B: Agent Configuration**
- [ ] OpenAI agent initialized
- [ ] System prompt configured per spec Section 6
- [ ] All five skills registered
- [ ] Intent detection tested (AC-1 through AC-5)
- [ ] Parameter extraction tested
- [ ] Error response templates implemented
- [ ] Statelessness enforced (AC-28 through AC-31)

**Phase C: ChatKit Integration**
- [ ] ChatKit project initialized
- [ ] Better Auth token integration complete
- [ ] UI presentation verified
- [ ] Token lifecycle handling tested

**Phase D: Testing**
- [ ] All 50 acceptance criteria verified
- [ ] Multi-user isolation tests passing
- [ ] Performance benchmarks met (AC-49, AC-50)
- [ ] Security audit complete (AC-41 through AC-44)

**Phase E: Deployment**
- [ ] Environment configuration documented
- [ ] Deployment guide written
- [ ] User documentation created
- [ ] Monitoring and alerting configured

**Rollout**
- [ ] Internal testing complete
- [ ] Beta rollout complete
- [ ] General availability launched
- [ ] Success metrics tracked

---

## 11. Appendix: Testing Tools & Frameworks

### 11.1 Recommended Testing Stack

- **Unit Testing:** Jest or Vitest
- **Integration Testing:** Supertest (for HTTP API testing)
- **E2E Testing:** Playwright or Cypress (for ChatKit UI)
- **Load Testing:** k6 or Artillery (for performance benchmarks)
- **Mocking:** MSW (Mock Service Worker) for Phase II API mocking

### 11.2 Test Data Management

- Use fixed test user accounts with known credentials
- Create test tasks with predictable IDs for update/complete/delete tests
- Clean up test data after each test run
- Use database snapshots for repeatable integration tests

### 11.3 CI/CD Integration

- Run unit tests on every commit
- Run integration tests on pull requests
- Run E2E tests on staging deployment
- Block deployment if any AC fails
- Generate test coverage reports (target: >80% coverage)

---

## Document Control

**Author:** Phase III Implementation Team
**Based On:** specs/003-chatbot/spec.md v1.0
**Status:** Draft
**Last Updated:** 2025-12-31
