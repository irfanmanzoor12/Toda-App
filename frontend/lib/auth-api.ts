/**
 * Authentication API functions.
 */

import { apiCall } from './api';

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Register a new user.
 */
export async function register(email: string, password: string): Promise<User> {
  return apiCall<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    requireAuth: false,
  });
}

/**
 * Login with email and password.
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiCall<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    requireAuth: false,
  });
}

/**
 * Get current authenticated user.
 */
export async function getCurrentUser(): Promise<User> {
  return apiCall<User>('/api/auth/me', {
    method: 'GET',
  });
}
