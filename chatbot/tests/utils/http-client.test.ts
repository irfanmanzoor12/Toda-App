/**
 * Unit tests for HTTP client wrapper
 * Verifies Authorization header attachment and token security
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import {
  AuthenticatedHttpClient,
  createAuthenticatedClient,
} from "../../mcp-server/utils/http-client.js";

// Mock axios
vi.mock("axios");

describe("AuthenticatedHttpClient", () => {
  const mockToken = "test-session-token-12345";
  const baseURL = "http://localhost:8000";

  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((successHandler) => {
            // Store the request interceptor for testing
            mockAxiosInstance._requestInterceptor = successHandler;
            return 0;
          }),
        },
        response: {
          use: vi.fn((successHandler, errorHandler) => {
            mockAxiosInstance._responseInterceptor = {
              success: successHandler,
              error: errorHandler,
            };
            return 0;
          }),
        },
      },
    };

    // Mock axios.create to return our mock instance
    (axios.create as any).mockReturnValue(mockAxiosInstance);
  });

  describe("Constructor", () => {
    it("should create axios instance with correct base URL", () => {
      new AuthenticatedHttpClient(baseURL, mockToken);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL,
        })
      );
    });

    it("should set up request interceptor", () => {
      new AuthenticatedHttpClient(baseURL, mockToken);

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it("should set up response interceptor", () => {
      new AuthenticatedHttpClient(baseURL, mockToken);

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe("Request Interceptor", () => {
    it("should attach Authorization header to requests", () => {
      const client = new AuthenticatedHttpClient(baseURL, mockToken);

      // Get the request interceptor
      const requestInterceptor = mockAxiosInstance._requestInterceptor;

      // Mock config object
      const config: any = {
        headers: {},
      };

      // Call interceptor
      const modifiedConfig = requestInterceptor(config);

      // Verify Authorization header was added
      expect(modifiedConfig.headers.Authorization).toBe(
        `Bearer ${mockToken}`
      );
    });

    it("should attach Authorization header with correct Bearer format", () => {
      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const requestInterceptor = mockAxiosInstance._requestInterceptor;

      const config: any = { headers: {} };
      const modifiedConfig = requestInterceptor(config);

      expect(modifiedConfig.headers.Authorization).toMatch(/^Bearer /);
      expect(modifiedConfig.headers.Authorization).toBe(
        `Bearer ${mockToken}`
      );
    });

    it("should not log or expose token in interceptor", () => {
      // Spy on console methods
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const requestInterceptor = mockAxiosInstance._requestInterceptor;

      const config: any = { headers: {} };
      requestInterceptor(config);

      // Token should not appear in any console output
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockToken)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockToken)
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("HTTP Methods", () => {
    it("should call axios.get with correct parameters", async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true } });

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      await client.get("/api/todos");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/todos", undefined);
    });

    it("should call axios.post with correct parameters", async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1 } });

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const postData = { title: "Test task" };
      await client.post("/api/todos", postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/todos",
        postData,
        undefined
      );
    });

    it("should call axios.put with correct parameters", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: { id: 1 } });

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const putData = { title: "Updated task" };
      await client.put("/api/todos/1", putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/todos/1",
        putData,
        undefined
      );
    });

    it("should call axios.delete with correct parameters", async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      await client.delete("/api/todos/1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/api/todos/1", undefined);
    });
  });

  describe("Error Handling", () => {
    it("should handle response errors without logging token", () => {
      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const errorHandler = mockAxiosInstance._responseInterceptor.error;

      const mockError = {
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
        message: "Request failed",
      };

      const result = errorHandler(mockError);

      expect(result).rejects.toEqual({
        status: 401,
        data: { error: "Unauthorized" },
        message: "Request failed",
      });
    });

    it("should handle network errors", () => {
      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const errorHandler = mockAxiosInstance._responseInterceptor.error;

      const mockError = {
        request: {},
        message: "Network error",
      };

      const result = errorHandler(mockError);

      expect(result).rejects.toEqual({
        status: 0,
        message: "No response from backend server",
      });
    });
  });

  describe("createAuthenticatedClient", () => {
    it("should create client with default base URL", () => {
      delete process.env.PHASE_2_API_BASE_URL;

      const client = createAuthenticatedClient(mockToken);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://localhost:8000",
        })
      );
    });

    it("should create client with environment base URL", () => {
      process.env.PHASE_2_API_BASE_URL = "http://custom-backend:9000";

      const client = createAuthenticatedClient(mockToken);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://custom-backend:9000",
        })
      );

      delete process.env.PHASE_2_API_BASE_URL;
    });
  });

  describe("Security Requirements (AC-41, AC-42)", () => {
    it("AC-41: should attach token to all API requests", () => {
      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const requestInterceptor = mockAxiosInstance._requestInterceptor;

      const config: any = { headers: {} };
      const modifiedConfig = requestInterceptor(config);

      // Verify Authorization header is present
      expect(modifiedConfig.headers.Authorization).toBeDefined();
      expect(modifiedConfig.headers.Authorization).toBe(
        `Bearer ${mockToken}`
      );
    });

    it("AC-42: should not log tokens in any log statements", () => {
      const consoleLogSpy = vi.spyOn(console, "log");
      const consoleErrorSpy = vi.spyOn(console, "error");
      const consoleWarnSpy = vi.spyOn(console, "warn");

      const client = new AuthenticatedHttpClient(baseURL, mockToken);
      const requestInterceptor = mockAxiosInstance._requestInterceptor;

      const config: any = { headers: {} };
      requestInterceptor(config);

      // Check no console methods were called with the token
      const allCalls = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
      ];

      allCalls.forEach((call) => {
        call.forEach((arg) => {
          if (typeof arg === "string") {
            expect(arg).not.toContain(mockToken);
          }
        });
      });

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});
