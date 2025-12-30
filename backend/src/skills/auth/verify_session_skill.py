"""VerifySessionSkill - Handles JWT token verification."""

from typing import Dict, Optional
from src.auth.jwt import decode_access_token
from .base_auth_skill import BaseAuthSkill, SkillResult


class VerifySessionSkill(BaseAuthSkill):
    """
    Skill for JWT token verification.

    Responsibilities:
    - Decode and validate JWT token
    - Extract user information from token
    - Verify token expiration
    - Return decoded token payload
    """

    def execute(self, token: str) -> SkillResult:
        """
        Verify JWT token and extract payload.

        Args:
            token: JWT access token string

        Returns:
            SkillResult with decoded token payload or error message
        """
        try:
            if not token:
                return SkillResult(success=False, error="Token is required")

            # Strip "Bearer " prefix if present
            token = token.replace("Bearer ", "").strip()

            # Decode and verify token
            payload = decode_access_token(token)

            if not payload:
                return SkillResult(success=False, error="Invalid or expired token")

            # Validate required fields
            if "user_id" not in payload or "email" not in payload:
                return SkillResult(success=False, error="Invalid token payload")

            return SkillResult(success=True, data=payload)

        except Exception as e:
            return SkillResult(success=False, error=f"Token verification failed: {str(e)}")

    def get_user_id_from_token(self, token: str) -> Optional[int]:
        """
        Extract user ID from JWT token.

        Args:
            token: JWT access token string

        Returns:
            User ID if token is valid, None otherwise
        """
        result = self.execute(token)
        if result.success and result.data:
            return result.data.get("user_id")
        return None
