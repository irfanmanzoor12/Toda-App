# Todo App Backend - Phase II

REST API backend for the Todo application with persistent storage.

## Features

- FastAPI REST API
- SQLModel ORM with PostgreSQL/SQLite support
- JWT-based authentication
- Database migrations with Alembic
- Multi-user support with data isolation

## Setup

```bash
# Create virtual environment
uv venv

# Install dependencies
uv pip install -e ".[dev]"

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start development server
uvicorn src.api.main:app --reload
```

## Development

See root README.md for complete Phase II documentation.
