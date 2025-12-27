"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# User schemas
class UserRegister(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model."""
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


# Todo schemas
class TodoCreate(BaseModel):
    """Todo creation request."""
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=2000)


class TodoUpdate(BaseModel):
    """Todo update request."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class TodoResponse(BaseModel):
    """Todo response model."""
    id: int
    title: str
    description: str
    status: str
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True
