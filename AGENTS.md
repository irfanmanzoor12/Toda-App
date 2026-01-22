# AGENTS.md - Development Constitution for TodoApp

## Purpose

This document defines the development workflow and principles for ALL AI agents (Claude Code, GitHub Copilot, Cursor, etc.) working on this project. Following this constitution ensures systematic, traceable, and high-quality development.

---

## Core Principle: Spec-Driven Development

**NO VIBE CODING.** Every code change must be traceable to a specification, plan, and task.

### The Workflow

```
┌─────────────┐
│  SPECIFY    │  What are we building? (Requirements, user stories, acceptance criteria)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    PLAN     │  How will we build it? (Architecture, component design, API schemas)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   TASKS     │  Break plan into atomic, testable work units
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ IMPLEMENT   │  Execute tasks systematically, test, commit
└─────────────┘
```

**Rule:** Never jump directly to implementation. Always start with specifications.

---

## Spec-KitPlus Integration

We use **Spec-KitPlus** for structured specification management.

### Directory Structure

```
.specifyplus/
├── speckit.constitution    # Architectural principles and constraints
├── speckit.specify         # Requirements and specifications
├── speckit.plan            # Technical implementation plans
├── speckit.tasks           # Actionable work items
└── speckit.done            # Completed tasks archive
```

### File Formats

All Spec-KitPlus files use **YAML** with structured sections:

**speckit.constitution:**
```yaml
principles:
  - principle_id: ARCH-001
    title: "Event-Driven Architecture"
    description: "All task state changes must emit events to Kafka"
    rationale: "Enables real-time updates and distributed processing"
```

**speckit.specify:**
```yaml
requirements:
  - req_id: REQ-001
    title: "Recurring Tasks"
    description: "Users can create tasks that automatically spawn new instances"
    user_story: "As a user, I want to create recurring tasks..."
    acceptance_criteria:
      - "User can set recurrence pattern (daily, weekly, monthly)"
      - "System spawns new task instances automatically"
```

**speckit.plan:**
```yaml
components:
  - component_id: COMP-001
    name: "RecurrenceEngine"
    type: "Service"
    technology: "Python + Dapr Binding"
    responsibilities:
      - "Calculate next occurrence dates"
      - "Spawn new task instances via Kafka"
```

**speckit.tasks:**
```yaml
tasks:
  - task_id: TASK-001
    title: "Create recurrence_pattern table migration"
    spec_ref: REQ-001
    plan_ref: COMP-001
    priority: high
    status: pending
    acceptance:
      - "Migration creates table with correct schema"
      - "Pytest passes for migration"
```

---

## Agent Responsibilities

### 1. Before Writing Code

**STOP. Ask these questions:**

1. Is there a specification for this feature?
   - If NO → Create specification in `speckit.specify`

2. Is there a plan for how to implement it?
   - If NO → Create plan in `speckit.plan`

3. Is there a task breaking down the work?
   - If NO → Create tasks in `speckit.tasks`

### 2. During Implementation

- **Reference task IDs** in commit messages: `git commit -m "[TASK-001] Create recurrence_pattern table migration"`
- **Update task status** as you work: `pending → in_progress → completed`
- **Write tests first** for new functionality (TDD where applicable)
- **Follow existing patterns** - maintain architectural consistency

### 3. After Implementation

- Mark task as `completed` in `speckit.tasks`
- Move completed task to `speckit.done`
- Update `speckit.plan` if implementation differs from design
- Document any technical debt or future improvements

---

## Phase V Specific Guidelines

### Technology Stack

**Backend:**
- Python 3.11+ with FastAPI
- PostgreSQL (Neon for production)
- SQLAlchemy ORM
- Alembic for migrations

**Event Streaming:**
- Apache Kafka (Strimzi on Kubernetes)
- Dapr Pub/Sub component
- Topics: `task-events`, `reminders`, `task-updates`

**Distributed Runtime:**
- Dapr sidecars for all services
- Building blocks: Pub/Sub, State, Bindings, Secrets, Service Invocation
- HTTP and gRPC communication

**Frontend:**
- Next.js 14 with App Router
- React 18
- Better Auth for authentication

**Deployment:**
- Local: Minikube + Dapr + Kafka (Strimzi)
- Cloud: AKS/GKE + Dapr + Managed Kafka
- CI/CD: GitHub Actions

### Architecture Principles

1. **Event-Driven Design**
   - All task CRUD operations emit events to Kafka
   - Services consume events asynchronously
   - Maintain event sourcing for audit trail

2. **Stateless Services**
   - No in-memory state (use Dapr State or PostgreSQL)
   - Horizontal scaling with Kubernetes
   - Session management via Better Auth

3. **Microservices Boundaries**
   - Task Service: CRUD operations
   - Recurrence Service: Scheduled task spawning
   - Reminder Service: Due date notifications
   - Chat Service: AI agent with MCP tools

4. **Dapr-First Integration**
   - Use Dapr APIs instead of direct SDK calls
   - Service invocation via Dapr sidecars
   - Secrets from Dapr secret store

### Testing Requirements

- **Unit Tests:** pytest with >80% coverage
- **Integration Tests:** Test Dapr components with testcontainers
- **E2E Tests:** Playwright for frontend flows
- **Load Tests:** k6 for Kafka throughput

### Security Standards

- JWT authentication for all API endpoints
- User-scoped data access (enforce user_id filtering)
- Secrets stored in Dapr secret store (never in code)
- TLS for all service-to-service communication

---

## MCP Tools Integration

Phase V will extend the MCP server with new tools:

**New MCP Tools:**
- `add_recurring_task` - Create task with recurrence pattern
- `set_task_due_date` - Set due date and reminder
- `search_tasks` - Full-text search with filters
- `add_task_tags` - Tag management
- `set_task_priority` - Priority management

**Implementation:**
- All MCP tools must call backend APIs (no direct DB access)
- Use Dapr service invocation for inter-service calls
- Emit events to Kafka for state changes

---

## Commit Message Format

```
[TASK-ID] Brief description

- Detailed change 1
- Detailed change 2

Refs: REQ-ID, PLAN-COMPONENT-ID
```

**Example:**
```
[TASK-003] Add Kafka event publisher for task creation

- Implement TaskEventPublisher class
- Emit task-created event to task-events topic
- Add integration test with testcontainers

Refs: REQ-002, COMP-005
```

---

## Documentation Requirements

For each new feature:

1. **API Documentation:** Update OpenAPI schema
2. **Architecture Diagrams:** Use Mermaid for sequence diagrams
3. **README Updates:** Document new environment variables
4. **Migration Notes:** Document database schema changes

---

## Prohibited Practices

**NEVER:**
- Skip specification/planning phase
- Write code without a corresponding task
- Commit untested code
- Hardcode credentials or secrets
- Create god classes or services
- Use synchronous HTTP for inter-service communication (use Dapr + events)
- Deploy without health checks and readiness probes

---

## Questions and Clarifications

**If you're unsure:**

1. Check existing specifications in `.specifyplus/`
2. Review architectural decisions in `speckit.constitution`
3. Ask the user to clarify requirements
4. Create a spike task for research if needed

**Spike Task Example:**
```yaml
- task_id: SPIKE-001
  title: "Research Dapr State Store options for task cache"
  type: spike
  time_box: 2 hours
  outcome: "Decision document with recommendation"
```

---

## Success Criteria

A feature is complete when:

1. ✅ Specification exists and is approved
2. ✅ Plan is documented and reviewed
3. ✅ All tasks are completed and tested
4. ✅ Code is committed with proper references
5. ✅ Documentation is updated
6. ✅ CI/CD pipeline passes
7. ✅ Feature is deployed and verified

---

## Phase V Milestones

**Milestone 1: Advanced Features (Part A)**
- Recurring tasks with Dapr Bindings
- Due dates and reminders
- Priorities, tags, search
- Kafka event streaming
- All features working locally

**Milestone 2: Local Deployment (Part B)**
- Minikube cluster setup
- Dapr installation and configuration
- Kafka deployment with Strimzi
- Full integration testing

**Milestone 3: Cloud Deployment (Part C)**
- AKS/GKE cluster provisioning
- Managed Kafka integration
- CI/CD pipeline with GitHub Actions
- Production monitoring and logging

---

## Agent-Specific Notes

### For Claude Code

- Use `Read` tool to check existing specs before implementing
- Use `TodoWrite` to track task progress
- Use `EnterPlanMode` for complex feature planning
- Always reference task IDs in file edits

### For GitHub Copilot

- Respect existing patterns in codebase
- Follow type hints and docstring conventions
- Use pytest fixtures from existing test files
- Don't suggest shortcuts that violate specs

### For Cursor

- Use `@speckit.plan` to reference implementation plans
- Follow component boundaries defined in specifications
- Maintain consistency with existing architecture

---

## Version History

- **v1.0** (2026-01-06): Initial constitution for Phase V
- Focus: Event-driven architecture with Dapr + Kafka
- Stack: FastAPI + Next.js + PostgreSQL + Kubernetes

---

**Remember:** This is not bureaucracy. This is **systematic engineering**. Following this workflow prevents technical debt, ensures quality, and makes the codebase maintainable for the long term.

Let's build something great! 🚀
