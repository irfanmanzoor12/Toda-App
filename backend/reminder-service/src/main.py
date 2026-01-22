"""Reminder Service - FastAPI application.

TASK-032: Create Reminder Service project structure
REQ-002: Due Dates & Time Reminders
COMP-003: Reminder Service

This microservice handles:
- Reminder scheduling for tasks with due dates
- Processing due reminders via Dapr Cron binding
- Publishing reminder notifications to Kafka
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import reminders
from src.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    init_db()
    yield


app = FastAPI(
    title="Reminder Service",
    description="Microservice for managing task reminders",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reminders.router)


@app.get("/health")
def health_check():
    """Health check endpoint for Kubernetes probes."""
    return {"status": "healthy", "service": "reminder-service"}


@app.get("/")
def root():
    """Root endpoint."""
    return {"service": "reminder-service", "version": "1.0.0"}
