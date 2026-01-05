
"""FastAPI application entrypoint.

Task: Environment fix - Create missing backend entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import tasks
from src.api.routes import chat

app = FastAPI(
    title="Todo API - Phase III",
    description="Todo application with AI chatbot and JWT authentication",
    version="3.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(tasks.router)
app.include_router(chat.router)  # Phase III chat endpoint


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Todo API is running"}
