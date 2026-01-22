"""Recurrence Service - FastAPI application.

TASK-023: Create Recurrence Service project structure
REQ-001: Recurring Tasks
COMP-002: Recurrence Service

This microservice handles:
- Recurrence pattern CRUD operations
- Scheduled task spawning via Dapr Cron binding
- Event publishing for spawned tasks
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import recurrence
from src.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Recurrence Service",
    description="Microservice for managing recurring task patterns",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(recurrence.router)


@app.get("/health")
def health_check():
    """Health check endpoint for Kubernetes probes."""
    return {"status": "healthy", "service": "recurrence-service"}


@app.get("/")
def root():
    """Root endpoint."""
    return {"service": "recurrence-service", "version": "1.0.0"}
