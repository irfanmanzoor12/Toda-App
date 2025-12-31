# Phase III: AI-Powered Todo Chatbot

**Version:** 1.0.0
**Status:** In Development

## Overview

This is the Phase III implementation of the Hackathon II project: an AI-powered conversational interface for the existing Todo Web Application. The chatbot enables users to manage their tasks through natural language interactions using the Model Context Protocol (MCP).

## Architecture

- **MCP Server:** Implements 5 skills (add_task, list_tasks, update_task, complete_task, delete_task)
- **OpenAI Agent:** Translates natural language into MCP skill invocations
- **ChatKit UI:** Conversational interface for end users
- **Phase II API:** Existing backend (unchanged, source of truth)

## Technology Stack

- **OpenAI Agents SDK** - Agent runtime and intent detection
- **Official MCP SDK** - Model Context Protocol implementation
- **OpenAI ChatKit** - Conversational UI
- **TypeScript** - Type-safe development
- **Vitest** - Testing framework

## Prerequisites

- Node.js >= 18.0.0
- OpenAI API key
- Phase II Todo Web Application running (backend at http://localhost:8000)
- Better Auth configured (session token provider)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Development (once implemented):**
   ```bash
   # Start MCP server
   npm run dev:mcp

   # Start Agent API
   npm run dev:agent

   # Start ChatKit UI
   npm run dev:chatkit
   ```

## Project Structure

```
chatbot/
├── mcp-server/       # MCP skills implementation
├── agent/            # OpenAI agent configuration
├── tests/            # Unit, integration, and security tests
├── chatkit/          # ChatKit UI (created in T320)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Implementation Status

**Current Task:** T306 - Project structure initialization

See `../specs/003-chatbot/tasks.md` for complete task list (T306-T332).

## Key Constraints

- **Stateless:** No conversation history retention
- **5 Skills Only:** add_task, list_tasks, update_task, complete_task, delete_task
- **No Auth Skills:** Authentication handled by Phase II + Better Auth
- **No Backend Changes:** Phase II API remains unchanged
- **Opaque Tokens:** Session tokens passed through without parsing

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Security tests
npm run test:security

# Performance benchmarks
npm run test:performance

# All tests
npm test
```

## Documentation

- **Specification:** `../specs/003-chatbot/spec.md`
- **Implementation Plan:** `../specs/003-chatbot/plan.md`
- **Task List:** `../specs/003-chatbot/tasks.md`

## Acceptance Criteria

Implementation is complete when all 50 acceptance criteria (AC-1 through AC-50) from the specification are verified and passing.

## License

UNLICENSED - Private project
