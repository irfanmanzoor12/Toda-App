/**
 * MCP Skill: add_task
 *
 * Creates a new task via Phase II /api/todos endpoint.
 *
 * Reference: Spec Section 5.1 (add_task Skill Contract)
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

/**
 * Input schema for add_task skill
 */
export interface AddTaskInput {
  title: string;
  description?: string;
}

/**
 * Output schema for add_task skill
 * Matches Phase II /api/todos response
 */
export interface AddTaskOutput {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate add_task input parameters
 *
 * @param input - Input parameters to validate
 * @throws ValidationError if validation fails
 *
 * Requirements (Spec Section 5.1):
 * - title: required, 1-200 characters
 * - description: optional, 0-1000 characters
 */
export function validateAddTaskInput(input: AddTaskInput): void {
  // Validate title is a string type first
  if (typeof input.title !== "string" || input.title === undefined || input.title === null) {
    throw new ValidationError("Title is required");
  }

  // Validate title length (1-200 characters)
  const titleLength = input.title.trim().length;
  if (titleLength === 0) {
    throw new ValidationError("Title cannot be empty");
  }
  if (titleLength > 200) {
    throw new ValidationError(
      `Title must be 200 characters or less (got ${titleLength} characters)`
    );
  }

  // Validate description if provided
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") {
      throw new ValidationError("Description must be a string");
    }

    const descriptionLength = input.description.length;
    if (descriptionLength > 1000) {
      throw new ValidationError(
        `Description must be 1000 characters or less (got ${descriptionLength} characters)`
      );
    }
  }
}

/**
 * Execute add_task skill
 *
 * @param input - Task creation parameters
 * @param context - MCP request context (contains session token)
 * @returns Created task object
 * @throws ValidationError for invalid input
 * @throws AuthenticationError for missing/invalid token
 * @throws Error for backend failures
 *
 * Backend Endpoint: POST /api/todos
 * Error Handling (Spec Section 5.1):
 * - 400 Bad Request → ValidationError
 * - 401 Unauthorized → AuthenticationError
 * - 500 Internal Server Error → Error
 */
export async function executeAddTask(
  input: AddTaskInput,
  context: Record<string, unknown>
): Promise<AddTaskOutput> {
  // Validate input
  validateAddTaskInput(input);

  // Extract session token from context
  const sessionToken = extractSessionToken(context);

  // Create authenticated HTTP client
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // Prepare request body
    const requestBody = {
      title: input.title.trim(),
      description: input.description || null,
    };

    // POST to /api/{user_id}/tasks (Phase II actual endpoint)
    // Note: user_id derived from session token by backend
    const response = await httpClient.post<AddTaskOutput>(
      `/api/${sessionToken}/tasks`,
      requestBody
    );

    // Return task object
    return response.data;
  } catch (error: any) {
    // Handle HTTP errors
    if (error.status === 400) {
      throw new ValidationError(
        error.data?.detail || error.data?.message || "Invalid request"
      );
    }

    if (error.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }

    if (error.status === 500) {
      throw new Error("Backend server error. Please try again later.");
    }

    if (error.status === 0) {
      throw new Error(
        "Cannot connect to backend server. Please check your connection."
      );
    }

    // Re-throw other errors
    throw new Error(error.message || "Failed to create task");
  }
}

/**
 * MCP Tool definition for add_task
 */
export const addTaskTool = {
  name: "add_task",
  description:
    "Create a new task with a title and optional description. The task will be added to the authenticated user's todo list.",
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string" as const,
        description: "Task title (required, 1-200 characters)",
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: "string" as const,
        description: "Task description (optional, 0-1000 characters)",
        maxLength: 1000,
      },
    },
    required: ["title"],
  },
};
