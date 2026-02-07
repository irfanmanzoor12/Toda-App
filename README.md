# TodoApp

A full-stack task management application with AI-powered chatbot, built with modern cloud-native technologies.

## Features

- **Task Management**: Create, update, complete, and delete tasks
- **Priorities**: Low, Medium, High, Critical with visual indicators
- **Tags**: Organize tasks with custom tags
- **Due Dates**: Set deadlines with reminder scheduling
- **Full-Text Search**: Search tasks by title/description with filters
- **Recurring Tasks**: Daily, weekly, monthly recurrence patterns
- **AI Chatbot**: Natural language task management via MCP tools
- **Real-time Updates**: Event-driven architecture with Kafka

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Backend | FastAPI, Python 3.13, SQLAlchemy |
| Database | PostgreSQL (Neon) |
| Auth | Better Auth |
| AI | OpenAI GPT-4, MCP Protocol |
| Events | Apache Kafka (Strimzi) |
| Runtime | Dapr |
| Orchestration | Kubernetes, Helm |
| CI/CD | GitHub Actions |

## Project Structure

```
todoapp/
├── backend/                    # FastAPI backend
│   ├── src/
│   │   ├── api/routes/        # API endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── events/            # Kafka event publisher
│   ├── alembic/               # Database migrations
│   ├── recurrence-service/    # Recurring tasks microservice
│   └── reminder-service/      # Reminders microservice
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   └── lib/                   # API client, auth
├── chatbot/
│   └── mcp-server/            # MCP tools for AI chatbot
├── k8s/                       # Kubernetes manifests
│   ├── charts/todoapp/        # Helm chart
│   ├── kafka/                 # Strimzi Kafka
│   ├── dapr/                  # Dapr components
│   └── deployments/           # Service deployments
└── .github/workflows/         # CI/CD pipelines
```

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL (or Neon account)
- OpenAI API key

### 1. Clone and Setup

```bash
git clone https://github.com/irfanmanzoor12/Toda-App.git
cd Toda-App
```

### 2. Backend Setup

```bash
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@host:5432/todoapp
OPENAI_API_KEY=sk-...
BETTER_AUTH_SECRET=your-secret-key
EOF

# Install dependencies (using uv)
uv sync

# Run migrations
uv run alembic upgrade head

# Start server
uv run uvicorn src.api.main:app --reload --port 8001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001
BETTER_AUTH_SECRET=your-secret-key
EOF

# Start dev server
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/docs

## API Endpoints

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all tasks |
| POST | `/api/todos` | Create task |
| GET | `/api/todos/{id}` | Get task |
| PUT | `/api/todos/{id}` | Update task |
| DELETE | `/api/todos/{id}` | Delete task (soft) |
| PATCH | `/api/todos/{id}/complete` | Mark complete |
| PUT | `/api/todos/{id}/priority` | Set priority |
| PUT | `/api/todos/{id}/due-date` | Set due date |
| GET | `/api/todos/search` | Full-text search |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List user's tags |
| POST | `/api/todos/{id}/tags` | Add tag to task |
| DELETE | `/api/todos/{id}/tags/{name}` | Remove tag |

### Recurrence (port 8002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recurrence/patterns` | Create pattern |
| GET | `/api/recurrence/patterns/{id}` | Get pattern |
| PUT | `/api/recurrence/patterns/{id}` | Update pattern |
| DELETE | `/api/recurrence/patterns/{id}` | Delete pattern |

### Reminders (port 8003)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reminders/schedule` | Schedule reminders |
| GET | `/api/reminders/{task_id}` | Get task reminders |
| DELETE | `/api/reminders/{task_id}` | Cancel reminders |

## MCP Tools (AI Chatbot)

The chatbot supports natural language commands:

- `add_task` - Create a new task
- `list_tasks` - View all tasks
- `complete_task` - Mark task as done
- `search_tasks` - Find tasks by keyword
- `set_priority` - Change task priority
- `add_tags` - Tag a task
- `set_due_date` - Set deadline with reminders
- `add_recurring_task` - Create recurring task

Example: *"Create a high priority task to review PR and remind me 1 hour before"*

## Kubernetes Deployment

### Local (Minikube)

```bash
cd k8s
./deploy-local.sh
```

### Helm

```bash
helm install todoapp ./k8s/charts/todoapp \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.openaiApiKey="sk-..."
```

See [k8s/README.md](k8s/README.md) for detailed instructions.

## Development

### Run Tests

```bash
# Backend
cd backend && uv run pytest

# Frontend
cd frontend && npm test

# E2E
cd frontend && npm run test:e2e

# Load tests
k6 run tests/load/load-test.js
```

### Database Migrations

```bash
cd backend

# Create migration
uv run alembic revision -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Task Service│────▶│  PostgreSQL │
│  (Next.js)  │     │  (FastAPI)  │     │   (Neon)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    Dapr     │
                    │  Sidecar    │
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

## License

MIT

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request
