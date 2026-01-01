/**
 * HTTP Client Wrapper for Phase II API Communication
 *
 * Wraps axios to automatically attach session tokens to all requests.
 * All requests are sent to the Phase II Todo backend with proper authentication.
 *
 * Security Requirements (spec Section 8.1):
 * - Tokens attached as Authorization: Bearer <token> header
 * - Tokens never logged or persisted
 * - All authorization delegated to backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { createAuthorizationHeader } from "../middleware/auth.js";

/**
 * HTTP Client for authenticated requests to Phase II backend
 */
export class AuthenticatedHttpClient {
  private client: AxiosInstance;
  private sessionToken: string;

  /**
   * Create authenticated HTTP client
   *
   * @param baseURL - Phase II backend base URL (from PHASE_2_API_BASE_URL env)
   * @param sessionToken - Opaque session token from MCP context
   */
  constructor(baseURL: string, sessionToken: string) {
    this.sessionToken = sessionToken;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL,
      timeout: 10000, // 10 second timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Add request interceptor to attach auth header
    this.client.interceptors.request.use(
      (config) => {
        // Attach Authorization header to every request
        config.headers.Authorization = createAuthorizationHeader(
          this.sessionToken
        );

        // SECURITY: Do not log the token or Authorization header
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Do not log token-related information
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;

          return Promise.reject({
            status,
            data,
            message: error.message,
          });
        } else if (error.request) {
          // Request made but no response received
          return Promise.reject({
            status: 0,
            message: "No response from backend server",
          });
        } else {
          // Error setting up the request
          return Promise.reject({
            status: 0,
            message: error.message,
          });
        }
      }
    );
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

/**
 * Create authenticated HTTP client instance
 *
 * @param sessionToken - Opaque session token from MCP context
 * @returns Authenticated HTTP client
 *
 * Note: Reads PHASE_2_API_BASE_URL from environment
 */
export function createAuthenticatedClient(
  sessionToken: string
): AuthenticatedHttpClient {
  const baseURL = process.env.PHASE_2_API_BASE_URL || "http://localhost:8000";
  return new AuthenticatedHttpClient(baseURL, sessionToken);
}
