/**
 * MCP Skill: delete_task
 *
 * Permanently deletes a task via Phase II /api/todos/{task_id} endpoint.
 *
 * Reference: Spec Section 5.5 (delete_task Skill Contract)
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

/**
 * Input schema for delete_task skill
 */
export interface DeleteTaskInput {
  task_id: number;
}

/**
 * Output schema for delete_task skill
 */
export interface DeleteTaskOutput {
  message: string;
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
 * Validate delete_task input parameters
 *
 * @param input - Input parameters to validate
 * @throws ValidationError if validation fails
 *
 * Requirements (Spec Section 5.5):
 * - task_id: required, positive integer
 */
export function validateDeleteTaskInput(input: DeleteTaskInput): void {
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
}

/**
 * Execute delete_task skill
 *
 * @param input - Task deletion parameters
 * @param context - MCP request context (contains session token)
 * @returns Success message confirming deletion
 * @throws ValidationError for invalid input
 * @throws AuthenticationError for missing/invalid token
 * @throws Error for backend failures
 *
 * Backend Endpoint: DELETE /api/todos/{task_id}
 * Error Handling (Spec Section 5.5):
 * - 400 Bad Request → ValidationError
 * - 401 Unauthorized → AuthenticationError
 * - 404 Not Found → Error
 * - 500 Internal Server Error → Error
 */
export async function executeDeleteTask(
  input: DeleteTaskInput,
  context: Record<string, unknown>
): Promise<DeleteTaskOutput> {
  // Validate input
  validateDeleteTaskInput(input);

  // Extract session token from context
  const sessionToken = extractSessionToken(context);

  // Create authenticated HTTP client
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // DELETE to /api/todos/{task_id}
    await httpClient.delete(`/api/todos/${input.task_id}`);

    // Return success message
    return {
      message: `Task ${input.task_id} has been permanently deleted.`,
    };
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
    throw new Error(error.message || "Failed to delete task");
  }
}

/**
 * MCP Tool definition for delete_task
 */
export const deleteTaskTool = {
  name: "delete_task",
  description:
    "Permanently delete a task. The task must belong to the authenticated user. Once deleted, the task cannot be recovered.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task to delete (required)",
      },
    },
    required: ["task_id"],
  },
};
