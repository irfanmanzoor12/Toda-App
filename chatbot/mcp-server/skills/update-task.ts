/**
 * MCP Skill: update_task
 *
 * Updates the title and/or description of an existing task via Phase II /api/todos/{task_id} endpoint.
 *
 * Reference: Spec Section 5.3 (update_task Skill Contract)
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

/**
 * Input schema for update_task skill
 */
export interface UpdateTaskInput {
  task_id: number;
  title?: string;
  description?: string;
}

/**
 * Output schema for update_task skill
 * Matches Phase II /api/todos/{task_id} response
 */
export interface UpdateTaskOutput {
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
 * Validate update_task input parameters
 *
 * @param input - Input parameters to validate
 * @throws ValidationError if validation fails
 *
 * Requirements (Spec Section 5.3):
 * - task_id: required, integer
 * - title: optional, 1-200 characters if provided
 * - description: optional, 0-1000 characters if provided
 * - At least one of title or description must be provided
 */
export function validateUpdateTaskInput(input: UpdateTaskInput): void {
  // Validate task_id is present
  if (input.task_id === undefined || input.task_id === null) {
    throw new ValidationError("Task ID is required");
  }

  // Validate task_id is a number
  if (typeof input.task_id !== "number" || !Number.isInteger(input.task_id)) {
    throw new ValidationError("Task ID must be an integer");
  }

  // Validate task_id is positive
  if (input.task_id <= 0) {
    throw new ValidationError("Task ID must be a positive integer");
  }

  // Validate at least one field is provided
  const hasTitleUpdate = input.title !== undefined && input.title !== null;
  const hasDescriptionUpdate =
    input.description !== undefined && input.description !== null;

  if (!hasTitleUpdate && !hasDescriptionUpdate) {
    throw new ValidationError(
      "At least one of title or description must be provided for update"
    );
  }

  // Validate title if provided
  if (hasTitleUpdate) {
    if (typeof input.title !== "string") {
      throw new ValidationError("Title must be a string");
    }

    const titleLength = input.title.trim().length;
    if (titleLength === 0) {
      throw new ValidationError("Title cannot be empty");
    }
    if (titleLength > 200) {
      throw new ValidationError(
        `Title must be 200 characters or less (got ${titleLength} characters)`
      );
    }
  }

  // Validate description if provided
  if (hasDescriptionUpdate) {
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
 * Execute update_task skill
 *
 * @param input - Task update parameters
 * @param context - MCP request context (contains session token)
 * @returns Updated task object
 * @throws ValidationError for invalid input
 * @throws AuthenticationError for missing/invalid token
 * @throws Error for backend failures
 *
 * Backend Endpoint: PUT /api/todos/{task_id}
 * Error Handling (Spec Section 5.3):
 * - 400 Bad Request → ValidationError
 * - 401 Unauthorized → AuthenticationError
 * - 404 Not Found → Error
 * - 500 Internal Server Error → Error
 */
export async function executeUpdateTask(
  input: UpdateTaskInput,
  context: Record<string, unknown>
): Promise<UpdateTaskOutput> {
  // Validate input
  validateUpdateTaskInput(input);

  // Extract session token from context
  const sessionToken = extractSessionToken(context);

  // Create authenticated HTTP client
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // Prepare request body with only provided fields
    const requestBody: any = {};

    if (input.title !== undefined && input.title !== null) {
      requestBody.title = input.title.trim();
    }

    if (input.description !== undefined && input.description !== null) {
      requestBody.description = input.description;
    }

    // PUT to /api/{user_id}/tasks/{task_id} (Phase II actual endpoint)
    const response = await httpClient.put<UpdateTaskOutput>(
      `/api/${sessionToken}/tasks/${input.task_id}`,
      requestBody
    );

    // Return updated task object
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

    if (error.status === 404) {
      throw new Error(
        `Task ${input.task_id} was not found. Use 'list my tasks' to see available task IDs.`
      );
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
    throw new Error(error.message || "Failed to update task");
  }
}

/**
 * MCP Tool definition for update_task
 */
export const updateTaskTool = {
  name: "update_task",
  description:
    "Update the title and/or description of an existing task. At least one of title or description must be provided. The task must belong to the authenticated user.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task to update (required)",
      },
      title: {
        type: "string" as const,
        description: "New task title (optional, 1-200 characters)",
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: "string" as const,
        description: "New task description (optional, 0-1000 characters)",
        maxLength: 1000,
      },
    },
    required: ["task_id"],
  },
};
