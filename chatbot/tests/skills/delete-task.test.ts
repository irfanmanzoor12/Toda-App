/**
 * Unit tests for delete_task MCP skill
 *
 * Tests acceptance criteria:
 * - AC-22: Permanently deletes task
 * - AC-23: Returns 404 for non-existent task
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateDeleteTaskInput,
  executeDeleteTask,
  deleteTaskTool,
  ValidationError,
  type DeleteTaskInput,
  type DeleteTaskOutput,
} from "../../mcp-server/skills/delete-task.js";
import * as authModule from "../../mcp-server/middleware/auth.js";
import * as httpClientModule from "../../mcp-server/utils/http-client.js";

describe("delete_task Skill", () => {
  describe("Tool Definition", () => {
    it("should have correct tool name", () => {
      expect(deleteTaskTool.name).toBe("delete_task");
    });

    it("should have description", () => {
      expect(deleteTaskTool.description).toBeTruthy();
      expect(deleteTaskTool.description).toContain("Permanently delete");
    });

    it("should define task_id as required", () => {
      expect(deleteTaskTool.inputSchema.required).toContain("task_id");
    });

    it("should have only task_id property", () => {
      const properties = Object.keys(
        deleteTaskTool.inputSchema.properties
      );
      expect(properties).toEqual(["task_id"]);
    });
  });

  describe("validateDeleteTaskInput", () => {
    it("should validate valid task_id", () => {
      const input: DeleteTaskInput = { task_id: 1 };
      expect(() => validateDeleteTaskInput(input)).not.toThrow();
    });

    it("should validate large task_id", () => {
      const input: DeleteTaskInput = { task_id: 999999 };
      expect(() => validateDeleteTaskInput(input)).not.toThrow();
    });

    it("should reject missing task_id", () => {
      const input: any = {};
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateDeleteTaskInput(input)).toThrow(
        "Task ID is required"
      );
    });

    it("should reject undefined task_id", () => {
      const input: any = { task_id: undefined };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject null task_id", () => {
      const input: any = { task_id: null };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
    });

    it("should reject non-integer task_id", () => {
      const input: any = { task_id: 1.5 };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateDeleteTaskInput(input)).toThrow(
        "must be an integer"
      );
    });

    it("should reject string task_id", () => {
      const input: any = { task_id: "1" };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateDeleteTaskInput(input)).toThrow(
        "must be an integer"
      );
    });

    it("should reject zero task_id", () => {
      const input: DeleteTaskInput = { task_id: 0 };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateDeleteTaskInput(input)).toThrow(
        "positive integer"
      );
    });

    it("should reject negative task_id", () => {
      const input: DeleteTaskInput = { task_id: -1 };
      expect(() => validateDeleteTaskInput(input)).toThrow(ValidationError);
      expect(() => validateDeleteTaskInput(input)).toThrow(
        "positive integer"
      );
    });
  });

  describe("executeDeleteTask", () => {
    let mockHttpClient: any;
    let extractSessionTokenSpy: any;
    let createAuthenticatedClientSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock HTTP client
      mockHttpClient = {
        delete: vi.fn(),
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

    it("AC-22: should permanently delete task", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeDeleteTask(input, context);

      expect(result.message).toContain("permanently deleted");
      expect(mockHttpClient.delete).toHaveBeenCalledWith("/api/todos/1");
    });

    it("should return success message with task_id", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 42 };
      const context = { sessionToken: "test-token" };

      const result = await executeDeleteTask(input, context);

      expect(result.message).toContain("Task 42");
      expect(result.message).toContain("permanently deleted");
    });

    it("should use correct task_id in URL", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 42 };
      const context = { sessionToken: "test-token" };

      await executeDeleteTask(input, context);

      expect(mockHttpClient.delete).toHaveBeenCalledWith("/api/todos/42");
    });

    it("should extract session token from context", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "my-session-token" };

      await executeDeleteTask(input, context);

      expect(extractSessionTokenSpy).toHaveBeenCalledWith(context);
    });

    it("should create authenticated HTTP client with token", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await executeDeleteTask(input, context);

      expect(createAuthenticatedClientSpy).toHaveBeenCalledWith("test-token");
    });

    it("should handle 400 error from backend", async () => {
      mockHttpClient.delete.mockRejectedValue({
        status: 400,
        data: { detail: "Invalid request" },
      });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        ValidationError
      );
      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        "Invalid request"
      );
    });

    it("should handle 401 error (invalid token)", async () => {
      mockHttpClient.delete.mockRejectedValue({
        status: 401,
        data: { detail: "Unauthorized" },
      });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "invalid-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("AC-23: should handle 404 error (non-existent task)", async () => {
      mockHttpClient.delete.mockRejectedValue({
        status: 404,
        data: { detail: "Task not found" },
      });

      const input: DeleteTaskInput = { task_id: 999 };
      const context = { sessionToken: "test-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        "Task 999 was not found"
      );
    });

    it("should handle 500 error from backend", async () => {
      mockHttpClient.delete.mockRejectedValue({
        status: 500,
        data: { detail: "Internal server error" },
      });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        "Backend server error"
      );
    });

    it("should handle network errors", async () => {
      mockHttpClient.delete.mockRejectedValue({
        status: 0,
        message: "Network error",
      });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        "Cannot connect to backend server"
      );
    });

    it("should validate input before making request", async () => {
      const input: any = { task_id: -1 };
      const context = { sessionToken: "test-token" };

      await expect(executeDeleteTask(input, context)).rejects.toThrow(
        ValidationError
      );

      // DELETE should not have been called
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it("should return message property in output", async () => {
      mockHttpClient.delete.mockResolvedValue({ data: null });

      const input: DeleteTaskInput = { task_id: 1 };
      const context = { sessionToken: "test-token" };

      const result = await executeDeleteTask(input, context);

      expect(result).toHaveProperty("message");
      expect(typeof result.message).toBe("string");
    });
  });
});
