import sqlite3
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

security = HTTPBearer()

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Look up the user_id from Better Auth session database
    try:
        # Better Auth stores sessions in better-auth.db (in frontend directory)
        db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "..", "frontend", "better-auth.db"
        )

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Try to look up token in session table
        cursor.execute(
            "SELECT userId FROM session WHERE token = ?",
            (token,)
        )

        result = cursor.fetchone()
        conn.close()

        if result:
            # Found session token, return the userId
            return result[0]
        else:
            # Token not found in session table
            # Assume it's a user_id passed directly from MCP tools (internal service)
            # This allows MCP tools to work without needing a session token
            return token

    except sqlite3.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )
