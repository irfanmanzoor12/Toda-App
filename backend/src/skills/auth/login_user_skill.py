"""LoginUserSkill - Handles user authentication and JWT generation."""

from typing import Dict
from sqlmodel import select
from src.models.user import User
from src.auth.password import verify_password
from src.auth.jwt import create_access_token
from .base_auth_skill import BaseAuthSkill, SkillResult


class LoginUserSkill(BaseAuthSkill):
    """
    Skill for user authentication and login.

    Responsibilities:
    - Validate credentials
    - Authenticate user against database
    - Generate JWT access token
    - Return token for client use
    """

    def execute(self, email: str, password: str) -> SkillResult:
        """
        Authenticate user and generate JWT token.

        Args:
            email: User's email address
            password: Plain-text password to verify

        Returns:
            SkillResult with JWT token or error message
        """
        try:
            # Validate inputs
            if not email or not password:
                return SkillResult(success=False, error="Email and password are required")

            email = email.strip().lower()

            # Find user by email
            user = self._find_user_by_email(email)
            if not user:
                return SkillResult(success=False, error="Incorrect email or password")

            # Verify password
            if not verify_password(password, user.password_hash):
                return SkillResult(success=False, error="Incorrect email or password")

            # Generate JWT token
            access_token = create_access_token(user.id, user.email)

            # Return token response
            token_data = {
                "access_token": access_token,
                "token_type": "bearer",
            }

            return SkillResult(success=True, data=token_data)

        except Exception as e:
            return SkillResult(success=False, error=f"Authentication failed: {str(e)}")

    def _find_user_by_email(self, email: str) -> User | None:
        """Find user by email address."""
        statement = select(User).where(User.email == email)
        return self.db.exec(statement).first()
