/**
 * Base class for authentication skills.
 * Provides common utilities for auth operations.
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export const BACKEND_JWT_KEY = 'backend_jwt';

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export abstract class BaseAuthSkill {
  protected readonly apiUrl: string;
  protected readonly jwtKey: string;

  constructor() {
    this.apiUrl = BACKEND_API_URL;
    this.jwtKey = BACKEND_JWT_KEY;
  }

  /**
   * Store backend JWT in localStorage
   */
  protected storeJwt(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.jwtKey, token);
    }
  }

  /**
   * Retrieve backend JWT from localStorage
   */
  protected getJwt(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.jwtKey);
    }
    return null;
  }

  /**
   * Remove backend JWT from localStorage
   */
  protected clearJwt(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.jwtKey);
      // Also clear legacy token key
      localStorage.removeItem('token');
    }
  }

  /**
   * Make an API call to the backend
   */
  protected async callBackendApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `Request failed with status ${response.status}`,
      }));
      throw new Error(errorData.detail || errorData.message || 'Request failed');
    }

    return response.json();
  }
}
