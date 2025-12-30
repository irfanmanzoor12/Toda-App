"""Base class for authentication skills."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from sqlmodel import Session


class SkillResult:
    """
    Result object returned by skills.

    Attributes:
        success: Whether the operation succeeded
        data: Result data (user, token, etc.)
        error: Error message if operation failed
    """

    def __init__(self, success: bool, data: Any = None, error: Optional[str] = None):
        self.success = success
        self.data = data
        self.error = error


class BaseAuthSkill(ABC):
    """
    Base class for authentication skills.

    Provides common utilities and defines the contract for auth skills.
    Each skill encapsulates a specific authentication operation.
    """

    def __init__(self, db: Session):
        """
        Initialize the skill with a database session.

        Args:
            db: SQLModel database session
        """
        self.db = db

    @abstractmethod
    def execute(self, *args, **kwargs) -> SkillResult:
        """
        Execute the skill's primary operation.

        Must be implemented by subclasses.

        Returns:
            SkillResult with operation outcome
        """
        pass
