"""GetCurrentUserSkill - Retrieves current authenticated user."""

from sqlmodel import select
from src.models.user import User
from .base_auth_skill import BaseAuthSkill, SkillResult
from .verify_session_skill import VerifySessionSkill


class GetCurrentUserSkill(BaseAuthSkill):
    """
    Skill for retrieving current authenticated user.

    Responsibilities:
    - Verify JWT token
    - Extract user ID from token
    - Fetch user from database
    - Return user object
    """

    def execute(self, token: str) -> SkillResult:
        """
        Get current user from JWT token.

        Args:
            token: JWT access token string

        Returns:
            SkillResult with User object or error message
        """
        try:
            # Verify token and extract payload
            verify_skill = VerifySessionSkill(self.db)
            verify_result = verify_skill.execute(token)

            if not verify_result.success:
                return SkillResult(success=False, error=verify_result.error)

            # Extract user ID from payload
            user_id = verify_result.data.get("user_id")
            if not user_id:
                return SkillResult(success=False, error="User ID not found in token")

            # Fetch user from database
            user = self._get_user_by_id(user_id)
            if not user:
                return SkillResult(success=False, error="User not found")

            return SkillResult(success=True, data=user)

        except Exception as e:
            return SkillResult(success=False, error=f"Failed to get current user: {str(e)}")

    def _get_user_by_id(self, user_id: int) -> User | None:
        """Fetch user by ID from database."""
        statement = select(User).where(User.id == user_id)
        return self.db.exec(statement).first()
