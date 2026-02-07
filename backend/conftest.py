"""Root conftest.py for backend pytest configuration.

Provides shared fixtures for all backend tests.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_db_session():
    """Mock database session for unit tests."""
    session = MagicMock()
    session.exec = MagicMock()
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def mock_httpx_client():
    """Mock httpx.AsyncClient for testing HTTP calls."""
    client = AsyncMock()
    client.post = AsyncMock()
    client.get = AsyncMock()
    client.put = AsyncMock()
    client.delete = AsyncMock()
    client.aclose = AsyncMock()
    return client
