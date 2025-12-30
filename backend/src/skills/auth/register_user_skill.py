"""RegisterUserSkill - Handles user registration."""

from sqlmodel import select
from src.models.user import User
from src.auth.password import hash_password
from .base_auth_skill import BaseAuthSkill, SkillResult


class RegisterUserSkill(BaseAuthSkill):
    """
    Skill for user registration.

    Responsibilities:
    - Validate email format and uniqueness
    - Validate password strength
    - Hash password securely
    - Create user in database
    """

    def execute(self, email: str, password: str) -> SkillResult:
        """
        Register a new user.

        Args:
            email: User's email address
            password: Plain-text password

        Returns:
            SkillResult with created User or error message
        """
        try:
            # Validate and normalize email
            email = self._validate_email(email)

            # Check email uniqueness
            if self._email_exists(email):
                return SkillResult(success=False, error="Email already registered")

            # Validate password
            self._validate_password(password)

            # Hash password
            password_hash = hash_password(password)

            # Create user
            user = User(email=email, password_hash=password_hash)

            # Save to database
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            return SkillResult(success=True, data=user)

        except ValueError as e:
            return SkillResult(success=False, error=str(e))
        except Exception as e:
            self.db.rollback()
            return SkillResult(success=False, error=f"Registration failed: {str(e)}")

    def _validate_email(self, email: str) -> str:
        """Validate and normalize email address."""
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")

        email = email.strip().lower()

        if "@" not in email:
            raise ValueError("Invalid email format")

        parts = email.split("@")
        if len(parts) != 2 or not parts[0] or not parts[1]:
            raise ValueError("Invalid email format")

        if "." not in parts[1]:
            raise ValueError("Invalid email format")

        return email

    def _email_exists(self, email: str) -> bool:
        """Check if email is already registered."""
        statement = select(User).where(User.email == email)
        existing_user = self.db.exec(statement).first()
        return existing_user is not None

    def _validate_password(self, password: str) -> None:
        """Validate password strength."""
        if not password:
            raise ValueError("Password cannot be empty")

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")
