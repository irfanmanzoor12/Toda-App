/**
 * Unit tests for list_tasks MCP skill
 *
 * Tests acceptance criteria:
 * - AC-10: Returns all tasks for authenticated user
 * - AC-11: Returns empty array when no tasks exist
 * - AC-26: Invalid token returns 401
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  executeListTasks,
  listTasksTool,
  type Task,
  type ListTasksOutput,
} from "../../mcp-server/skills/list-tasks.js";
import * as authModule from "../../mcp-server/middleware/auth.js";
import * as httpClientModule from "../../mcp-server/utils/http-client.js";

describe("list_tasks Skill", () => {
  describe("Tool Definition", () => {
    it("should have correct tool name", () => {
      expect(listTasksTool.name).toBe("list_tasks");
    });

    it("should have description", () => {
      expect(listTasksTool.description).toBeTruthy();
      expect(listTasksTool.description).toContain("Retrieve all tasks");
    });

    it("should define input schema with no required fields", () => {
      expect(listTasksTool.inputSchema.required).toEqual([]);
    });

    it("should define empty properties object", () => {
      expect(listTasksTool.inputSchema.properties).toEqual({});
    });
  });

  describe("executeListTasks", () => {
    let mockHttpClient: any;
    let extractSessionTokenSpy: any;
    let createAuthenticatedClientSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock HTTP client
      mockHttpClient = {
        get: vi.fn(),
      };

      // Spy on extractSessionToken
      extractSessionTokenSpy = vi
        .spyOn(authModule, "extractSessionToken")
        .mockReturnValue("test-token");

      // Spy on createAuthenticatedClient
      createAuthenticatedClientSpy = vi
        .spyOn(httpClientModule, "createAuthenticatedClient")
        .mockReturnValue(mockHttpClient);
    });

    it("AC-10: should return all tasks for authenticated user", async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: "Buy groceries",
          description: "Get milk, eggs, and bread",
          is_completed: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          title: "Finish report",
          description: null,
          is_completed: true,
          created_at: "2025-01-02T00:00:00Z",
          updated_at: "2025-01-02T00:00:00Z",
        },
        {
          id: 3,
          title: "Call dentist",
          description: "Schedule appointment",
          is_completed: false,
          created_at: "2025-01-03T00:00:00Z",
          updated_at: "2025-01-03T00:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockTasks });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks).toEqual(mockTasks);
      expect(result.tasks).toHaveLength(3);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/api/todos");
    });

    it("AC-11: should return empty array when user has no tasks", async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks).toEqual([]);
      expect(result.tasks).toHaveLength(0);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/api/todos");
    });

    it("should handle null response data gracefully", async () => {
      mockHttpClient.get.mockResolvedValue({ data: null });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks).toEqual([]);
    });

    it("should handle undefined response data gracefully", async () => {
      mockHttpClient.get.mockResolvedValue({ data: undefined });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks).toEqual([]);
    });

    it("should return tasks with all required fields", async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: "Test task",
          description: "Test description",
          is_completed: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockTasks });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      const task = result.tasks[0];
      expect(task).toHaveProperty("id");
      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("description");
      expect(task).toHaveProperty("is_completed");
      expect(task).toHaveProperty("created_at");
      expect(task).toHaveProperty("updated_at");
    });

    it("should handle tasks with null descriptions", async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: "Task without description",
          description: null,
          is_completed: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockTasks });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks[0].description).toBeNull();
    });

    it("should handle mix of completed and pending tasks", async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: "Completed task",
          description: null,
          is_completed: true,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          title: "Pending task",
          description: null,
          is_completed: false,
          created_at: "2025-01-02T00:00:00Z",
          updated_at: "2025-01-02T00:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockTasks });

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result.tasks[0].is_completed).toBe(true);
      expect(result.tasks[1].is_completed).toBe(false);
    });

    it("should extract session token from context", async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });

      const context = { sessionToken: "my-session-token" };
      await executeListTasks(context);

      expect(extractSessionTokenSpy).toHaveBeenCalledWith(context);
    });

    it("should create authenticated HTTP client with token", async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });

      const context = { sessionToken: "test-token" };
      await executeListTasks(context);

      expect(createAuthenticatedClientSpy).toHaveBeenCalledWith("test-token");
    });

    it("AC-26: should handle 401 error (invalid token)", async () => {
      mockHttpClient.get.mockRejectedValue({
        status: 401,
        data: { detail: "Unauthorized" },
      });

      const context = { sessionToken: "invalid-token" };

      await expect(executeListTasks(context)).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("should handle 500 error from backend", async () => {
      mockHttpClient.get.mockRejectedValue({
        status: 500,
        data: { detail: "Internal server error" },
      });

      const context = { sessionToken: "test-token" };

      await expect(executeListTasks(context)).rejects.toThrow(
        "Backend server error"
      );
    });

    it("should handle network errors", async () => {
      mockHttpClient.get.mockRejectedValue({
        status: 0,
        message: "Network error",
      });

      const context = { sessionToken: "test-token" };

      await expect(executeListTasks(context)).rejects.toThrow(
        "Cannot connect to backend server"
      );
    });

    it("should handle unknown errors", async () => {
      mockHttpClient.get.mockRejectedValue({
        status: 503,
        message: "Service unavailable",
      });

      const context = { sessionToken: "test-token" };

      await expect(executeListTasks(context)).rejects.toThrow(
        "Service unavailable"
      );
    });

    it("should throw authentication error for missing token", async () => {
      extractSessionTokenSpy.mockImplementation(() => {
        throw new authModule.AuthenticationError("Session token is required");
      });

      const context = { sessionToken: undefined };

      await expect(executeListTasks(context as any)).rejects.toThrow(
        "Session token is required"
      );

      // GET should not have been called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe("Output Schema", () => {
    it("should return object with tasks array", async () => {
      const mockHttpClient: any = {
        get: vi.fn().mockResolvedValue({ data: [] }),
      };

      vi.spyOn(authModule, "extractSessionToken").mockReturnValue("test-token");
      vi.spyOn(httpClientModule, "createAuthenticatedClient").mockReturnValue(
        mockHttpClient
      );

      const context = { sessionToken: "test-token" };
      const result = await executeListTasks(context);

      expect(result).toHaveProperty("tasks");
      expect(Array.isArray(result.tasks)).toBe(true);
    });
  });
});
