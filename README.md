# TodoApp

A full-stack task management application with AI-powered chatbot, built with modern cloud-native technologies.

## Features

- **Task Management**: Create, update, complete, and delete tasks
- **Priorities**: Low, Medium, High, Critical with visual indicators
- **Tags**: Organize tasks with custom tags
- **Due Dates**: Set deadlines with reminder scheduling
- **Full-Text Search**: Search tasks by title and description with filters
- **AI Chatbot**: Natural language task management via OpenAI + MCP tools
- **Event-Driven**: Kafka event publishing for task state changes
- **Authentication**: Better Auth with JWT tokens

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Backend | FastAPI, Python 3.13, SQLAlchemy |
| Database | PostgreSQL (Neon) |
| Auth | Better Auth + JWT |
| AI | OpenAI GPT-4, MCP Protocol |
| Events | Apache Kafka (Strimzi) |
| Orchestration | Kubernetes, Helm, Dapr |
| CI/CD | GitHub Actions |

## Project Structure

```
todoapp/
├── backend/                    # FastAPI backend (port 8000)
│   ├── src/
│   │   ├── api/routes/        # API endpoints (tasks, tags, chat)
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── auth/              # JWT verification
│   │   ├── events/            # Kafka event publisher
│   │   └── services/          # Agent service (OpenAI)
│   ├── alembic/               # Database migrations
│   ├── recurrence-service/    # Recurring tasks microservice
│   └── reminder-service/      # Reminders microservice
├── frontend/                   # Next.js frontend (port 3000)
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   └── lib/                   # API client, auth client
├── chatbot/                    # AI chatbot system
│   ├── mcp-server/            # MCP tools + HTTP server (port 3003)
│   │   ├── skills/            # add/list/complete/delete/update task
│   │   ├── middleware/        # Auth middleware
│   │   └── utils/             # HTTP client wrapper
│   ├── agent/                 # Agent config and runtime
│   └── tests/                 # Vitest test suite (252 tests)
├── k8s/                       # Kubernetes manifests
│   ├── charts/todoapp/        # Helm chart
│   ├── kafka/                 # Strimzi Kafka
│   └── dapr/                  # Dapr components
├── specs/                     # Specifications
├── tests/load/                # k6 load tests
└── .github/workflows/         # CI/CD pipelines
```

## Quick Start

### Prerequisites

- Python 3.13+ (with uv package manager)
- Node.js 18+
- PostgreSQL (or Neon account)
- OpenAI API key

### 1. Backend

```bash
cd backend

# Create .env from example
cp .env.example .env
# Edit .env with your DATABASE_URL, OPENAI_API_KEY, BETTER_AUTH_SECRET

# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head

# Start server (runs on port 8000)
uv run uvicorn src.api.main:app --reload
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local from example
cp .env.local.example .env.local
# Edit with BETTER_AUTH_SECRET and BETTER_AUTH_URL

# Start dev server (runs on port 3000)
npm run dev
```

### 3. Chatbot (MCP Server)

```bash
cd chatbot

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
# Edit with OPENAI_API_KEY and PHASE_2_API_BASE_URL=http://127.0.0.1:8000

# Start MCP HTTP server (runs on port 3003)
npm run dev:mcp-http
```

### 4. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MCP Server: http://localhost:3003/health

## API Endpoints

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/todos` | Create task |
| GET | `/api/todos` | List tasks (paginated, filterable) |
| PUT | `/api/todos/{id}` | Update task |
| DELETE | `/api/todos/{id}` | Soft delete task |
| PATCH | `/api/todos/{id}/complete` | Mark complete |
| PUT | `/api/todos/{id}/priority` | Set priority |
| PUT | `/api/todos/{id}/due-date` | Set due date |
| GET | `/api/todos/search` | Full-text search |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List user tags |
| POST | `/api/todos/{id}/tags` | Add tag to task |
| DELETE | `/api/todos/{id}/tags/{name}` | Remove tag |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{user_id}/chat` | Send message to AI assistant |

## MCP Tools (AI Chatbot)

The chatbot uses OpenAI with MCP tool integration for natural language task management:

| Tool | Description |
|------|-------------|
| `add_task` | Create a new task |
| `list_tasks` | View all tasks |
| `complete_task` | Mark task as done |
| `delete_task` | Remove a task |
| `update_task` | Edit task title/description |

Example prompts:
- "Add a task to review quarterly report"
- "Show me all my tasks"
- "Mark task 3 as complete"
- "Delete task 5"

## Running Tests

```bash
# Backend (14 tests)
cd backend
uv run pytest tests/ -v

# Chatbot (252 tests)
cd chatbot
npm test

# Load tests
k6 run tests/load/load-test.js
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL  │
│  (Next.js)  │     │  (FastAPI)  │     │   (Neon)     │
│  port 3000  │     │  port 8000  │     └──────────────┘
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  MCP Server │
                    │  port 3003  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Kafka     │   │ Recurrence  │   │  Reminder   │
│  (Strimzi)  │   │  Service    │   │  Service    │
└─────────────┘   └─────────────┘   └─────────────┘
```

The frontend proxies API calls through Next.js rewrites (`/backend/*` -> `http://127.0.0.1:8000/*`). The backend delegates AI chat to OpenAI, which calls MCP tools via HTTP on port 3003. All task mutations publish events to Kafka.

## License

MIT
