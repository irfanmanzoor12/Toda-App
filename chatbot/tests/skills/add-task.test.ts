/**
 * Unit tests for add_task MCP skill
 *
 * Tests acceptance criteria:
 * - AC-6: Create task with title only
 * - AC-7: Create task with title and description
 * - AC-8: Reject missing title
 * - AC-9: Reject title > 200 characters
 * - AC-25: Invalid token returns 401
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateAddTaskInput,
  executeAddTask,
  addTaskTool,
  ValidationError,
  type AddTaskInput,
  type AddTaskOutput,
} from "../../mcp-server/skills/add-task.js";
import * as authModule from "../../mcp-server/middleware/auth.js";
import * as httpClientModule from "../../mcp-server/utils/http-client.js";

describe("add_task Skill", () => {
  describe("Tool Definition", () => {
    it("should have correct tool name", () => {
      expect(addTaskTool.name).toBe("add_task");
    });

    it("should have description", () => {
      expect(addTaskTool.description).toBeTruthy();
      expect(addTaskTool.description).toContain("Create a new task");
    });

    it("should define input schema with title as required", () => {
      expect(addTaskTool.inputSchema.required).toContain("title");
    });

    it("should define title constraints", () => {
      const titleSchema = addTaskTool.inputSchema.properties.title;
      expect(titleSchema.minLength).toBe(1);
      expect(titleSchema.maxLength).toBe(200);
    });

    it("should define description constraints", () => {
      const descriptionSchema =
        addTaskTool.inputSchema.properties.description;
      expect(descriptionSchema.maxLength).toBe(1000);
    });
  });

  describe("validateAddTaskInput", () => {
    it("should validate valid title-only input", () => {
      const input: AddTaskInput = { title: "Buy groceries" };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should validate valid title and description", () => {
      const input: AddTaskInput = {
        title: "Buy groceries",
        description: "Get milk, eggs, and bread",
      };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("AC-8: should reject missing title", () => {
      const input: any = {};
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("Title is required");
    });

    it("AC-8: should reject undefined title", () => {
      const input: any = { title: undefined };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
    });

    it("AC-8: should reject null title", () => {
      const input: any = { title: null };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
    });

    it("AC-8: should reject empty title", () => {
      const input: AddTaskInput = { title: "" };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("cannot be empty");
    });

    it("should reject whitespace-only title", () => {
      const input: AddTaskInput = { title: "   " };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("cannot be empty");
    });

    it("should reject non-string title", () => {
      const input: any = { title: 12345 };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("Title is required");
    });

    it("AC-9: should reject title > 200 characters", () => {
      const longTitle = "a".repeat(201);
      const input: AddTaskInput = { title: longTitle };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("200 characters or less");
    });

    it("should accept title with exactly 200 characters", () => {
      const maxTitle = "a".repeat(200);
      const input: AddTaskInput = { title: maxTitle };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should accept title with 1 character", () => {
      const input: AddTaskInput = { title: "a" };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should reject description > 1000 characters", () => {
      const longDescription = "a".repeat(1001);
      const input: AddTaskInput = {
        title: "Valid title",
        description: longDescription,
      };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow(
        "1000 characters or less"
      );
    });

    it("should accept description with exactly 1000 characters", () => {
      const maxDescription = "a".repeat(1000);
      const input: AddTaskInput = {
        title: "Valid title",
        description: maxDescription,
      };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should accept empty description", () => {
      const input: AddTaskInput = {
        title: "Valid title",
        description: "",
      };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should reject non-string description", () => {
      const input: any = {
        title: "Valid title",
        description: 12345,
      };
      expect(() => validateAddTaskInput(input)).toThrow(ValidationError);
      expect(() => validateAddTaskInput(input)).toThrow("must be a string");
    });

    it("should accept null description", () => {
      const input: AddTaskInput = {
        title: "Valid title",
        description: null as any,
      };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });

    it("should trim title for length validation", () => {
      const input: AddTaskInput = { title: "  Valid title  " };
      expect(() => validateAddTaskInput(input)).not.toThrow();
    });
  });

  describe("executeAddTask", () => {
    let mockHttpClient: any;
    let extractSessionTokenSpy: any;
    let createAuthenticatedClientSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock HTTP client
      mockHttpClient = {
        post: vi.fn(),
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

    it("AC-6: should create task with title only", async () => {
      const mockResponse: AddTaskOutput = {
        id: 1,
        title: "Buy groceries",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const input: AddTaskInput = { title: "Buy groceries" };
      const context = { sessionToken: "test-token" };

      const result = await executeAddTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith("/api/todos", {
        title: "Buy groceries",
        description: null,
      });
    });

    it("AC-7: should create task with title and description", async () => {
      const mockResponse: AddTaskOutput = {
        id: 2,
        title: "Buy groceries",
        description: "Get milk, eggs, and bread",
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const input: AddTaskInput = {
        title: "Buy groceries",
        description: "Get milk, eggs, and bread",
      };
      const context = { sessionToken: "test-token" };

      const result = await executeAddTask(input, context);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith("/api/todos", {
        title: "Buy groceries",
        description: "Get milk, eggs, and bread",
      });
    });

    it("should trim title before sending to backend", async () => {
      const mockResponse: AddTaskOutput = {
        id: 3,
        title: "Buy groceries",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const input: AddTaskInput = { title: "  Buy groceries  " };
      const context = { sessionToken: "test-token" };

      await executeAddTask(input, context);

      expect(mockHttpClient.post).toHaveBeenCalledWith("/api/todos", {
        title: "Buy groceries",
        description: null,
      });
    });

    it("should extract session token from context", async () => {
      const mockResponse: AddTaskOutput = {
        id: 4,
        title: "Test",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "my-session-token" };

      await executeAddTask(input, context);

      expect(extractSessionTokenSpy).toHaveBeenCalledWith(context);
    });

    it("should create authenticated HTTP client with token", async () => {
      const mockResponse: AddTaskOutput = {
        id: 5,
        title: "Test",
        description: null,
        is_completed: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "test-token" };

      await executeAddTask(input, context);

      expect(createAuthenticatedClientSpy).toHaveBeenCalledWith("test-token");
    });

    it("should handle 400 error from backend", async () => {
      mockHttpClient.post.mockRejectedValue({
        status: 400,
        data: { detail: "Invalid task data" },
      });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeAddTask(input, context)).rejects.toThrow(
        ValidationError
      );
      await expect(executeAddTask(input, context)).rejects.toThrow(
        "Invalid task data"
      );
    });

    it("AC-25: should handle 401 error (invalid token)", async () => {
      mockHttpClient.post.mockRejectedValue({
        status: 401,
        data: { detail: "Unauthorized" },
      });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "invalid-token" };

      await expect(executeAddTask(input, context)).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("should handle 500 error from backend", async () => {
      mockHttpClient.post.mockRejectedValue({
        status: 500,
        data: { detail: "Internal server error" },
      });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeAddTask(input, context)).rejects.toThrow(
        "Backend server error"
      );
    });

    it("should handle network errors", async () => {
      mockHttpClient.post.mockRejectedValue({
        status: 0,
        message: "Network error",
      });

      const input: AddTaskInput = { title: "Test" };
      const context = { sessionToken: "test-token" };

      await expect(executeAddTask(input, context)).rejects.toThrow(
        "Cannot connect to backend server"
      );
    });

    it("should validate input before making request", async () => {
      const input: any = { title: "" };
      const context = { sessionToken: "test-token" };

      await expect(executeAddTask(input, context)).rejects.toThrow(
        ValidationError
      );

      // POST should not have been called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
