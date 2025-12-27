/**
 * API client wrapper with authentication and error handling.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiCallOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Make an API call with automatic authentication and error handling.
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Get token from localStorage if authentication is required
  let token: string | null = null;
  if (requireAuth && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  // Set up headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Add Authorization header if token exists
  if (token && requireAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  // Parse and return JSON response
  return await response.json();
}
