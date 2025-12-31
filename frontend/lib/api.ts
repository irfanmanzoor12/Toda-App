/**
 * Frontend API client with JWT Authorization header.
 *
 * Task: T210 - Create API client that sends Authorization header with Better Auth JWT.
 */

import { authClient } from "./auth-client";

const API_BASE_URL = "/backend";


interface ApiCallOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Make an API call with JWT in Authorization header.
 *
 * Gets JWT from Better Auth session and attaches as Bearer token.
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Get JWT from Better Auth (opaque token access)
  if (requireAuth) {
    const { data } = await authClient.getSession();
    const token = data?.session?.token;

    if (!token) {
      throw new Error("No authentication token available");
    }

    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json();
}
