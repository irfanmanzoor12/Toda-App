/**
 * JWT Token Extraction for Authorization Header Pattern
 *
 * This module extracts the JWT token from Better Auth's HTTP-only cookie
 * via a Next.js API route and makes it available for Authorization headers.
 *
 * Architecture:
 * 1. Better Auth stores JWT in HTTP-only cookie (secure)
 * 2. Next.js API route extracts token server-side
 * 3. Client fetches token when needed
 * 4. Client sends in Authorization: Bearer <token> header
 */

/**
 * Get JWT token from Better Auth session via Next.js API route
 *
 * This calls a server-side API route that can read the HTTP-only cookie
 * and return the token value to the client.
 *
 * @returns JWT token string or null if not authenticated
 */
export async function getJWTToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Call Next.js API route to extract token from cookie
    const response = await fetch('/api/auth/token', {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error fetching JWT token:', error);
    return null;
  }
}

/**
 * Get the Authorization header value for backend API requests
 *
 * @returns Authorization header string or null if not authenticated
 */
export async function getAuthorizationHeader(): Promise<string | null> {
  const token = await getJWTToken();
  return token ? `Bearer ${token}` : null;
}
