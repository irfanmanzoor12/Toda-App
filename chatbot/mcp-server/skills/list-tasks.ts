/**
 * MCP Skill: list_tasks
 *
 * Retrieves all tasks for the authenticated user via Phase II /api/todos endpoint.
 *
 * Reference: Spec Section 5.2 (list_tasks Skill Contract)
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

/**
 * Task object returned by the backend
 */
export interface Task {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Output schema for list_tasks skill
 * Matches Phase II /api/todos response
 */
export interface ListTasksOutput {
  tasks: Task[];
}

/**
 * Execute list_tasks skill
 *
 * @param context - MCP request context (contains session token)
 * @returns Array of tasks for authenticated user
 * @throws AuthenticationError for missing/invalid token
 * @throws Error for backend failures
 *
 * Backend Endpoint: GET /api/todos
 * Error Handling (Spec Section 5.2):
 * - 401 Unauthorized → AuthenticationError
 * - 500 Internal Server Error → Error
 * - Empty array is success (not error)
 */
export async function executeListTasks(
  context: Record<string, unknown>
): Promise<ListTasksOutput> {
  // Extract session token from context
  const sessionToken = extractSessionToken(context);

  // Create authenticated HTTP client
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // GET from /api/todos
    const response = await httpClient.get<Task[]>("/api/todos");

    // Return tasks array
    // Note: Empty array is a valid success response
    return {
      tasks: response.data || [],
    };
  } catch (error: any) {
    // Handle HTTP errors
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
    throw new Error(error.message || "Failed to retrieve tasks");
  }
}

/**
 * MCP Tool definition for list_tasks
 */
export const listTasksTool = {
  name: "list_tasks",
  description:
    "Retrieve all tasks for the authenticated user. Returns a list of tasks with their details including ID, title, description, completion status, and timestamps. Returns an empty list if the user has no tasks.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};
