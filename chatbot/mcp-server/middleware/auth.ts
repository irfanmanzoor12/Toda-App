/**
 * Authentication Middleware for MCP Server
 *
 * Extracts session tokens from MCP request context and validates their presence.
 * Tokens are treated as opaque strings - no parsing or validation is performed here.
 * All authorization decisions are delegated to the Phase II backend.
 *
 * Security Requirements (spec Section 8.1):
 * - Tokens must never be logged or persisted
 * - Tokens are passed through unchanged (opaque)
 * - Token validation is handled by Phase II backend
 */

/**
 * Error thrown when authentication token is missing
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Extract session token from MCP request context
 *
 * @param context - MCP request context (may contain session token)
 * @returns Session token as opaque string
 * @throws AuthenticationError if token is missing
 *
 * CRITICAL: Token is treated as opaque - no parsing or validation
 */
export function extractSessionToken(context: Record<string, unknown>): string {
  const token = context.sessionToken;

  // Check if token is a string type first
  if (typeof token !== "string") {
    throw new AuthenticationError(
      "Session token is required but was not provided in the request context"
    );
  }

  // Validate token is not empty
  if (token.trim().length === 0) {
    throw new AuthenticationError("Session token cannot be empty");
  }

  // SECURITY: Do not log the token value
  // Return token as-is (opaque string)
  return token;
}

/**
 * Validate that a token string appears to be present
 * Does NOT validate token contents or authenticity
 *
 * @param token - Token string to validate
 * @returns true if token is present and non-empty
 */
export function isTokenPresent(token: string | undefined | null): boolean {
  return typeof token === "string" && token.trim().length > 0;
}

/**
 * Create authorization header value from token
 *
 * @param token - Session token (opaque)
 * @returns Bearer token header value
 *
 * SECURITY: Do not log the returned value
 */
export function createAuthorizationHeader(token: string): string {
  return `Bearer ${token}`;
}
