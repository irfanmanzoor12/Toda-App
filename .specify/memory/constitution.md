<!--
Sync Impact Report:
- Version change: [CONSTITUTION_VERSION] → 1.0.0
- Initial ratification from user-provided constitution content
- Added principles: Spec-First Rule, No Manual Coding, Skills Before Agents, Skills as Unit of Reuse, Agent Constraints, MCP Boundary Rule, Stateless Backend Rule, Phase-Gated Evolution, Technology Lock, Authority Hierarchy, Enforcement
- Added sections: Non-Negotiable Development Rules, Skill-First Architecture, Agent Constraints, MCP Boundary Rule, Stateless Backend Rule, Phase-Gated Evolution, Technology Lock, Authority Hierarchy, Enforcement
- Templates requiring updates:
  ✅ plan-template.md - reviewed, constitution check section aligns
  ✅ spec-template.md - reviewed, requirements structure aligns
  ✅ tasks-template.md - reviewed, task organization aligns
  ⚠ commands/*.md - no command files found in templates/commands/
- Follow-up TODOs: None - all placeholders filled
-->

# Hackathon II Constitution
## The Evolution of Todo – Spec-Driven, AI-Native System

---

## Core Principles

### I. Spec-First Rule

No code, skill, agent, API, or infrastructure may be created unless it is:
- Defined in `speckit.specify`
- Planned in `speckit.plan`
- Authorized by a Task ID in `speckit.tasks`

**No task = no code.**

**Rationale**: This ensures all implementation decisions trace back to approved specifications, preventing scope creep and maintaining architectural coherence throughout the project lifecycle.

### II. No Manual Coding

All code MUST be generated or modified through **Claude Code**.

Human developers may:
- Edit specs
- Review output
- Run commands
- Validate behavior

Manual code edits are forbidden.

**Rationale**: Enforces consistency, traceability, and adherence to architectural patterns. All code generation is documented and reversible.

### III. Skills Before Agents

- Business logic MUST live in **reusable skills**
- Skills MUST be deterministic and stateless
- Skills MUST NOT depend on UI, chat, or transport layers

Agents are allowed ONLY to:
- Interpret intent
- Select skills
- Orchestrate execution

Agents MUST NOT contain business logic.

**Rationale**: Separation of concerns ensures business logic is testable, portable, and reusable across multiple interfaces (CLI, API, agents, events).

### IV. Skills as the Unit of Reuse

Skills are the primary reusable intelligence unit and may be reused across:
- CLI
- REST APIs
- MCP tools
- AI agents
- Event consumers

**Rationale**: Maximizes code reuse and maintains consistency across all interaction surfaces.

### V. Agent Constraints

- Agents are **thin orchestrators**
- Agents MUST interact with the system only via MCP tools
- Agents MUST be stateless
- Conversation state MUST be persisted externally (DB or Dapr state)

**Rationale**: Ensures agents remain horizontally scalable, testable, and independent of specific runtime contexts.

### VI. MCP Boundary Rule

All AI-to-system interaction MUST cross an **MCP boundary**.

Agents:
- MAY NOT call databases directly
- MAY NOT import infrastructure SDKs (Kafka, Postgres, etc.)
- MAY ONLY invoke MCP-exposed tools

**Rationale**: Creates a clean abstraction layer that isolates AI logic from infrastructure concerns, enabling testing, security controls, and infrastructure changes without affecting agent logic.

### VII. Stateless Backend Rule

All backend services MUST be stateless:
- No in-memory session state
- No reliance on local filesystem state
- All persistence must use external systems (DB, Dapr State, Kafka)

**Rationale**: Enables horizontal scaling and Kubernetes deployment patterns essential for cloud-native architecture.

### VIII. Phase-Gated Evolution

The system MUST evolve strictly by phase:

- Phase I: In-memory CLI
- Phase II: Web + persistent storage
- Phase III: AI chatbot via MCP
- Phase IV: Local Kubernetes deployment
- Phase V: Event-driven cloud deployment

Features from future phases MUST NOT appear early.

**Rationale**: Prevents premature complexity and ensures each phase is fully validated before adding new capabilities. Each phase builds on proven foundations.

### IX. Technology Lock

The following technologies are fixed and MUST NOT be replaced:

- Python 3.13+
- UV package manager
- Claude Code
- Spec-Kit Plus
- FastAPI
- SQLModel
- Next.js (App Router)
- OpenAI Agents SDK
- Official MCP SDK
- Docker, Kubernetes, Helm
- Kafka + Dapr (Phase V)

**Rationale**: Reduces decision fatigue, ensures team expertise concentration, and maintains ecosystem compatibility.

### X. Authority Hierarchy

In case of conflict, authority is resolved in this order:

1. Constitution
2. Specification (`speckit.specify`)
3. Plan (`speckit.plan`)
4. Tasks (`speckit.tasks`)
5. Implementation

Lower levels MUST yield to higher levels.

**Rationale**: Establishes clear precedence for resolving ambiguities and ensures foundational decisions take priority over implementation details.

### XI. Enforcement

If any ambiguity exists:
- Implementation MUST stop
- Specification MUST be updated
- No assumptions may be made

**Rationale**: Prevents technical debt from accumulating through undocumented assumptions. Forces explicit decision-making and documentation.

## Purpose

This project follows **Spec-Driven Development (SDD)** to evolve a Todo application from a simple console program into a cloud-native, AI-powered, event-driven system.

All implementation decisions MUST trace back to an approved specification.

## Non-Negotiable Development Rules

### Spec-First Mandate

All development work requires:
1. Feature specification in `specs/<feature>/spec.md`
2. Implementation plan in `specs/<feature>/plan.md`
3. Task breakdown in `specs/<feature>/tasks.md`
4. Task ID authorization for each code change

### Code Generation Policy

- All code MUST be generated via Claude Code
- Manual edits are prohibited
- Human role: specify requirements, review outputs, validate behavior
- All changes must be traceable to specifications

## Skill-First Architecture

### Design Hierarchy

```
Skills (business logic, stateless, reusable)
    ↓
MCP Tools (skill exposure layer)
    ↓
Agents (orchestration only, stateless)
    ↓
Interfaces (CLI, API, Chat, Events)
```

### Skill Requirements

- Deterministic behavior
- No side effects beyond explicit I/O
- No UI, chat, or transport coupling
- Full unit test coverage
- Clear input/output contracts

### Agent Limitations

Agents MUST NOT:
- Contain business logic
- Call databases directly
- Import infrastructure SDKs
- Maintain conversational state in memory

Agents MUST:
- Use only MCP-exposed tools
- Delegate all logic to skills
- Persist state externally (DB/Dapr)

## Architectural Boundaries

### MCP Abstraction Layer

All system interactions from AI agents MUST:
- Cross the MCP boundary
- Use only registered MCP tools
- Never bypass to direct SDK calls

This ensures:
- Testability via tool mocking
- Security via tool-level authorization
- Infrastructure independence

### Statelessness Requirement

Backend services MUST:
- Avoid in-memory session state
- Externalize all persistence
- Support horizontal scaling
- Enable Kubernetes deployment

## Phase-Gated Evolution

### Phase Progression

Development MUST proceed sequentially through phases:

**Phase I: In-Memory CLI**
- Console-based interaction
- In-memory data structures
- Basic CRUD operations

**Phase II: Web + Persistence**
- FastAPI backend
- Next.js frontend
- SQLModel + database
- RESTful APIs

**Phase III: AI Chatbot**
- OpenAI Agents SDK integration
- MCP tool exposure
- Conversational interface
- State persistence

**Phase IV: Local Kubernetes**
- Containerization (Docker)
- Helm charts
- Local cluster deployment
- Service mesh basics

**Phase V: Event-Driven Cloud**
- Kafka event streams
- Dapr runtime
- Cloud deployment
- Scalable architecture

### Phase Discipline

- No phase may be skipped
- No future-phase features allowed in current phase
- Each phase must be fully validated before progression
- Regression tests required before phase transition

## Technology Standards

### Locked Technologies

These technologies are non-negotiable and MUST be used:

**Language & Runtime**
- Python 3.13+
- UV package manager

**AI & Orchestration**
- Claude Code (code generation)
- Spec-Kit Plus (SDD tooling)
- OpenAI Agents SDK (agent runtime)
- Official MCP SDK (tool exposure)

**Backend**
- FastAPI (web framework)
- SQLModel (ORM)

**Frontend**
- Next.js (App Router)

**Infrastructure**
- Docker (containerization)
- Kubernetes (orchestration)
- Helm (package management)
- Kafka (Phase V events)
- Dapr (Phase V runtime)

### Technology Substitution

Technology substitution requires:
1. Constitution amendment
2. Migration plan approval
3. Rollback strategy
4. Team consensus

## Governance

### Amendment Process

Constitution changes require:
1. Written proposal with rationale
2. Impact analysis on existing specs/plans/tasks
3. Migration plan for affected code
4. Approval from project stakeholders
5. Version increment per semantic versioning

### Compliance

- All PRs MUST verify constitution compliance
- All specs MUST reference applicable principles
- All plans MUST document principle adherence
- All tasks MUST trace to authorized specifications

### Conflict Resolution

When conflicts arise:
1. Identify applicable principle from authority hierarchy
2. If ambiguous, escalate to specification update
3. Document decision as ADR
4. Update affected artifacts
5. No implementation until resolved

### Versioning

**Version Increment Rules**:
- **MAJOR**: Backward incompatible governance changes, principle removals/redefinitions
- **MINOR**: New principles added, section expansions, new mandates
- **PATCH**: Clarifications, wording improvements, typo fixes

**Version**: 1.0.0 | **Ratified**: 2025-12-28 | **Last Amended**: 2025-12-28
