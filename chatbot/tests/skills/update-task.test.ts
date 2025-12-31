/**
 * Unit tests for update_task MCP skill
 *
 * Tests acceptance criteria:
 * - AC-13: Updates title only
 * - AC-14: Updates description only
 * - AC-15: Updates both fields
 * - AC-16: Rejects request with no fields
 * - AC-17: Returns 404 for non-existent task
 * - AC-27: Invalid token returns 401
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateUpdateTaskInput,
  executeUpdateTask,
  updateTaskTool,
  ValidationError,
  type UpdateTaskInput,
  type UpdateTaskOutput,
} from "../../mcp-server/skills/update-task.js";
import * as authModule from "../../mcp-server/middleware/auth.js";
import * as httpClientModule from "../../mcp-server/utils/http-client.js";

describe("update_task Skill", () => {
  describe("Tool Definition", () => {
    it("should have correct tool name", () => {
      expect(updateTaskTool.name).toBe("update_task");
    });

    it("should have description", () => {
      expect(updateTaskTool.description).toBeTruthy();
      expect(updateTaskTool.description).toContain("Update the title");
    });

    it("should define task_id as required", () => {
      expect(updateTaskTool.inputSchema.required).toContain("task_id");
    });

    it("should define title and description as optional", () => {
      const required = updateTaskTool.inputSchema.required;
      expect(required).not.toContain("title");
      expect(required).not.toContain("description");
    });

    it("should define title constraints", () => {
      const titleSchema = updateTaskTool.inputSchema.properties.title;
      expect(titleSchema.minLength).toBe(1);
      expect(titleSchema.maxLength).toBe(200);
    });

    it("should define description constraints", () => {
      const descriptionSchema =
        updateTaskTool.inputSchema.properties.description;
      expect(descriptionSchema.maxLength).toBe(1000);
    });
  });

  describe("validateUpdateTaskInput", () => {
    it("should validate update with title only", () => {
      const input: UpdateTaskInput = { task_id: 1, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should validate update with description only", () => {
      const input: UpdateTaskInput = {
        task_id: 1,
        description: "New description",
      };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should validate update with both title and description", () => {
      const input: UpdateTaskInput = {
        task_id: 1,
        title: "New title",
        description: "New description",
      };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should reject missing task_id", () => {
      const input: any = { title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow("Task ID is required");
    });

    it("should reject undefined task_id", () => {
      const input: any = { task_id: undefined, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject null task_id", () => {
      const input: any = { task_id: null, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject non-integer task_id", () => {
      const input: any = { task_id: 1.5, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow("must be an integer");
    });

    it("should reject string task_id", () => {
      const input: any = { task_id: "1", title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject zero task_id", () => {
      const input: UpdateTaskInput = { task_id: 0, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow("positive integer");
    });

    it("should reject negative task_id", () => {
      const input: UpdateTaskInput = { task_id: -1, title: "New title" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });

    it("AC-16: should reject update with no fields to update", () => {
      const input: any = { task_id: 1 };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow(
        "At least one of title or description must be provided"
      );
    });

    it("should reject empty title", () => {
      const input: UpdateTaskInput = { task_id: 1, title: "" };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow("cannot be empty");
    });

    it("should reject whitespace-only title", () => {
      const input: UpdateTaskInput = { task_id: 1, title: "   " };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject title > 200 characters", () => {
      const longTitle = "a".repeat(201);
      const input: UpdateTaskInput = { task_id: 1, title: longTitle };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow(
        "200 characters or less"
      );
    });

    it("should accept title with exactly 200 characters", () => {
      const maxTitle = "a".repeat(200);
      const input: UpdateTaskInput = { task_id: 1, title: maxTitle };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should reject non-string title", () => {
      const input: any = { task_id: 1, title: 12345 };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow("must be a string");
    });

    it("should reject description > 1000 characters", () => {
      const longDescription = "a".repeat(1001);
      const input: UpdateTaskInput = {
        task_id: 1,
        description: longDescription,
      };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
      expect(() => validateUpdateTaskInput(input)).toThrow(
        "1000 characters or less"
      );
    });

    it("should accept description with exactly 1000 characters", () => {
      const maxDescription = "a".repeat(1000);
      const input: UpdateTaskInput = {
        task_id: 1,
        description: maxDescription,
      };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should accept empty description", () => {
      const input: UpdateTaskInput = {
        task_id: 1,
        description: "",
      };
      expect(() => validateUpdateTaskInput(input)).not.toThrow();
    });

    it("should reject non-string description", () => {
      const input: any = {
        task_id: 1,
        description: 12345,
      };
      expect(() => validateUpdateTaskInput(input)).toThrow(ValidationError);
    });
  });

  describe("executeUpdateTask", () => {
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

    it("AC-13: should update title only", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Updated title",
        description: "Original description",
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = { task_id: 1, title: "Updated title" };
      const context = { sessionToken: "test-token" };

      const result = await executeUpdateTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.put).toHaveBeenCalledWith("/api/todos/1", {
        title: "Updated title",
      });
    });

    it("AC-14: should update description only", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Original title",
        description: "Updated description",
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = {
        task_id: 1,
        description: "Updated description",
      };
      const context = { sessionToken: "test-token" };

      const result = await executeUpdateTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.put).toHaveBeenCalledWith("/api/todos/1", {
        description: "Updated description",
      });
    });

    it("AC-15: should update both title and description", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Updated title",
        description: "Updated description",
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = {
        task_id: 1,
        title: "Updated title",
        description: "Updated description",
      };
      const context = { sessionToken: "test-token" };

      const result = await executeUpdateTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.put).toHaveBeenCalledWith("/api/todos/1", {
        title: "Updated title",
        description: "Updated description",
      });
    });

    it("should trim title before sending to backend", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Updated title",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = { task_id: 1, title: "  Updated title  " };
      const context = { sessionToken: "test-token" };

      await executeUpdateTask(input, context);

      expect(mockHttpClient.put).toHaveBeenCalledWith("/api/todos/1", {
        title: "Updated title",
      });
    });

    it("should use correct task_id in URL", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 42,
        title: "Test",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = { task_id: 42, title: "Test" };
      const context = { sessionToken: "test-token" };

      await executeUpdateTask(input, context);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        "/api/todos/42",
        expect.any(Object)
      );
    });

    it("should extract session token from context", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Test",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "my-session-token" };

      await executeUpdateTask(input, context);

      expect(extractSessionTokenSpy).toHaveBeenCalledWith(context);
    });

    it("should create authenticated HTTP client with token", async () => {
      const mockResponse: UpdateTaskOutput = {
        id: 1,
        title: "Test",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.put.mockResolvedValue({ data: mockResponse });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "test-token" };

      await executeUpdateTask(input, context);

      expect(createAuthenticatedClientSpy).toHaveBeenCalledWith("test-token");
    });

    it("should handle 400 error from backend", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 400,
        data: { detail: "Invalid update data" },
      });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        ValidationError
      );
      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        "Invalid update data"
      );
    });

    it("AC-27: should handle 401 error (invalid token)", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 401,
        data: { detail: "Unauthorized" },
      });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "invalid-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("AC-17: should handle 404 error (non-existent task)", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 404,
        data: { detail: "Task not found" },
      });

      const input: UpdateTaskInput = { task_id: 999, title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        "Task 999 was not found"
      );
    });

    it("should handle 500 error from backend", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 500,
        data: { detail: "Internal server error" },
      });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        "Backend server error"
      );
    });

    it("should handle network errors", async () => {
      mockHttpClient.put.mockRejectedValue({
        status: 0,
        message: "Network error",
      });

      const input: UpdateTaskInput = { task_id: 1, title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        "Cannot connect to backend server"
      );
    });

    it("should validate input before making request", async () => {
      const input: any = { task_id: 1 }; // No title or description
      const context = { sessionToken: "test-token" };

      await expect(executeUpdateTask(input, context)).rejects.toThrow(
        ValidationError
      );

      // PUT should not have been called
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });
  });
});
