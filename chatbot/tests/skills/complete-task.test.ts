/**
 * Unit tests for complete_task MCP skill
 *
 * Tests acceptance criteria:
 * - AC-19: Marks task as completed
 * - AC-20: Returns 404 for non-existent task
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateCompleteTaskInput,
  executeCompleteTask,
  completeTaskTool,
  ValidationError,
  type CompleteTaskInput,
  type CompleteTaskOutput,
} from "../../mcp-server/skills/complete-task.js";
import * as authModule from "../../mcp-server/middleware/auth.js";
import * as httpClientModule from "../../mcp-server/utils/http-client.js";

describe("complete_task Skill", () => {
  describe("Tool Definition", () => {
    it("should have correct tool name", () => {
      expect(completeTaskTool.name).toBe("complete_task");
    });

    it("should have description", () => {
      expect(completeTaskTool.description).toBeTruthy();
      expect(completeTaskTool.description).toContain("Mark a task as completed");
    });

    it("should define task_id as required", () => {
      expect(completeTaskTool.inputSchema.required).toContain("task_id");
    });

    it("should have only task_id property", () => {
      const properties = Object.keys(
        completeTaskTool.inputSchema.properties
      );
      expect(properties).toEqual(["task_id"]);
    });
  });

  describe("validateCompleteTaskInput", () => {
    it("should validate valid task_id", () => {
      const input: CompleteTaskInput = { task_id: 1 };
      expect(() => validateCompleteTaskInput(input)).not.toThrow();
    });

    it("should validate large task_id", () => {
      const input: CompleteTaskInput = { task_id: 999999 };
      expect(() => validateCompleteTaskInput(input)).not.toThrow();
    });

    it("should reject missing task_id", () => {
      const input: any = {};
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateCompleteTaskInput(input)).toThrow(
        "Task ID is required"
      );
    });

    it("should reject undefined task_id", () => {
      const input: any = { task_id: undefined };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject null task_id", () => {
      const input: any = { task_id: null };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject non-integer task_id", () => {
      const input: any = { task_id: 1.5 };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateCompleteTaskInput(input)).toThrow(
        "must be an integer"
      );
    });

    it("should reject string task_id", () => {
      const input: any = { task_id: "1" };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateCompleteTaskInput(input)).toThrow(
        "must be an integer"
      );
    });

    it("should reject zero task_id", () => {
      const input: CompleteTaskInput = { task_id: 0 };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateCompleteTaskInput(input)).toThrow(
        "positive integer"
      );
    });

    it("should reject negative task_id", () => {
      const input: CompleteTaskInput = { task_id: -1 };
      expect(() => validateCompleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateCompleteTaskInput(input)).toThrow(
        "positive integer"
      );
    });
  });

  describe("executeCompleteTask", () => {
    let mockHttpClient: any;
    let extractSessionTokenSpy: any;
    let createAuthenticatedClientSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock HTTP client
      mockHttpClient = {
        put: vi.fn(),
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

    it("AC-19: should mark task as completed", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Buy groceries",
        description: "Get milk, eggs, and bread",
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeCompleteTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(result.is_completed).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith("/api/todos/1", {
        is_completed: true,
      });
    });

    it("should send is_completed: true in request body", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Test",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await executeCompleteTask(input, context);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { is_completed: true }
      );
    });

    it("should use correct task_id in URL", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 42,
        title: "Test",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 42 };
      const context = { sessionToken: "test-token" };

      await executeCompleteTask(input, context);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        "/api/todos/42",
        expect.any(Object)
      );
    });

    it("should return task with all required fields", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Test task",
        description: "Test description",
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeCompleteTask(input, context);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("is_completed");
      expect(result).toHaveProperty("created_at");
      expect(result).toHaveProperty("updated_at");
    });

    it("should handle task with null description", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Task without description",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeCompleteTask(input, context);

      expect(result.description).toBeNull();
    });

    it("should extract session token from context", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Test",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "my-session-token" };

      await executeCompleteTask(input, context);

      expect(extractSessionTokenSpy).toHaveBeenCalledWith(context);
    });

    it("should create authenticated HTTP client with token", async () => {
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Test",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await executeCompleteTask(input, context);

      expect(createAuthenticatedClientSpy).toHaveBeenCalledWith("test-token");
    });

    it("should handle 400 error from backend", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 400,
        data: { detail: "Invalid request" },
      });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        ValidationError
      );
      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        "Invalid request"
      );
    });

    it("should handle 401 error (invalid token)", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 401,
        data: { detail: "Unauthorized" },
      });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "invalid-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("AC-20: should handle 404 error (non-existent task)", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 404,
        data: { detail: "Task not found" },
      });

      const input: CompleteTaskInput = { task_id: 999 };
      const context = { sessionToken: "test-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        "Task 999 was not found"
      );
    });

    it("should handle 500 error from backend", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 500,
        data: { detail: "Internal server error" },
      });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        "Backend server error"
      );
    });

    it("should handle network errors", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 0,
        message: "Network error",
      });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        "Cannot connect to backend server"
      );
    });

    it("should validate input before making request", async () => {
      const input: any = { task_id: -1 };
      const context = { sessionToken: "test-token" };

      await expect(executeCompleteTask(input, context)).rejects.toThrow(
        ValidationError
      );

      // PUT should not have been called
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it("should handle already completed task", async () => {
      // Task that's already completed should still succeed
      const mockResponse: CompleteTaskOutput = {
        id: 1,
        title: "Already completed task",
        description: null,
        is_completed: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: CompleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeCompleteTask(input, context);

      expect(result.is_completed).toBe(true);
    });
  });
});
