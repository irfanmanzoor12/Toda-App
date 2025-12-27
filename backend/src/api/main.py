"""FastAPI application setup with CORS middleware."""

import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from src.api.exceptions import TodoNotFoundError, UnauthorizedError, ForbiddenError

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI(
    title="Todo App API",
    version="2.0.0",
    description="REST API for Todo application with user authentication and persistent storage",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(TodoNotFoundError)
async def todo_not_found_handler(request: Request, exc: TodoNotFoundError):
    """Handle TodoNotFoundError with 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)}
    )


@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request: Request, exc: UnauthorizedError):
    """Handle UnauthorizedError with 401 response."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.message},
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError):
    """Handle ForbiddenError with 403 response."""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.message}
    )


# Include routers
from src.api.routes import auth, todos

app.include_router(auth.router)
app.include_router(todos.router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}
