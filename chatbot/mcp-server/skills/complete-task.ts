/**
 * MCP Skill: complete_task
 *
 * Marks a task as completed via Phase II /api/todos/{task_id} endpoint.
 *
 * Reference: Spec Section 5.4 (complete_task Skill Contract)
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

/**
 * Input schema for complete_task skill
 */
export interface CompleteTaskInput {
  task_id: number;
}

/**
 * Output schema for complete_task skill
 * Matches Phase II /api/todos/{task_id} response
 */
export interface CompleteTaskOutput {
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
 * Validate complete_task input parameters
 *
 * @param input - Input parameters to validate
 * @throws ValidationError if validation fails
 *
 * Requirements (Spec Section 5.4):
 * - task_id: required, positive integer
 */
export function validateCompleteTaskInput(input: CompleteTaskInput): void {
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
 * Execute complete_task skill
 *
 * @param input - Task completion parameters
 * @param context - MCP request context (contains session token)
 * @returns Completed task object with is_completed: true
 * @throws ValidationError for invalid input
 * @throws AuthenticationError for missing/invalid token
 * @throws Error for backend failures
 *
 * Backend Endpoint: PUT /api/todos/{task_id}
 * Request Body: { "is_completed": true }
 * Error Handling (Spec Section 5.4):
 * - 400 Bad Request → ValidationError
 * - 401 Unauthorized → AuthenticationError
 * - 404 Not Found → Error
 * - 500 Internal Server Error → Error
 */
export async function executeCompleteTask(
  input: CompleteTaskInput,
  context: Record<string, unknown>
): Promise<CompleteTaskOutput> {
  // Validate input
  validateCompleteTaskInput(input);

  // Extract session token from context
  const sessionToken = extractSessionToken(context);

  // Create authenticated HTTP client
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // PUT to /api/todos/{task_id} with is_completed: true
    const response = await httpClient.put<CompleteTaskOutput>(
      `/api/todos/${input.task_id}`,
      { is_completed: true }
    );

    // Return completed task object
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
    throw new Error(error.message || "Failed to complete task");
  }
}

/**
 * MCP Tool definition for complete_task
 */
export const completeTaskTool = {
  name: "complete_task",
  description:
    "Mark a task as completed. The task must belong to the authenticated user. Once completed, the task's is_completed status will be set to true.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task to mark as completed (required)",
      },
    },
    required: ["task_id"],
  },
};
