/**
 * MCP Skill: search_tasks
 *
 * TASK-041: Search tasks MCP tool
 * REQ-005: Search & Filter
 * Searches tasks via Phase V /api/todos/search endpoint.
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

export interface SearchTasksInput {
  query: string;
  status?: "all" | "pending" | "completed";
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string;
  due_before?: string;
  due_after?: string;
  limit?: number;
}

export interface TaskResult {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  due_date: string | null;
  tags: Array<{ id: number; name: string }>;
  created_at: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateSearchInput(input: SearchTasksInput): void {
  if (!input.query || typeof input.query !== "string") {
    throw new ValidationError("Search query is required");
  }
  if (input.query.trim().length === 0) {
    throw new ValidationError("Search query cannot be empty");
  }
}

export async function executeSearchTasks(
  input: SearchTasksInput,
  context: Record<string, unknown>
): Promise<TaskResult[]> {
  validateSearchInput(input);

  const sessionToken = extractSessionToken(context);
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    const params = new URLSearchParams();
    params.append("q", input.query.trim());

    if (input.status && input.status !== "all") {
      params.append("status", input.status);
    }
    if (input.priority) {
      params.append("priority", input.priority);
    }
    if (input.tags) {
      params.append("tags", input.tags);
    }
    if (input.due_before) {
      params.append("due_before", input.due_before);
    }
    if (input.due_after) {
      params.append("due_after", input.due_after);
    }
    if (input.limit) {
      params.append("limit", input.limit.toString());
    }

    const response = await httpClient.get<TaskResult[]>(
      `/api/todos/search?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    if (error.status === 400) {
      throw new ValidationError(error.data?.detail || "Invalid search request");
    }
    if (error.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw new Error(error.message || "Failed to search tasks");
  }
}

export const searchTasksTool = {
  name: "search_tasks",
  description: "Search tasks by keyword with optional filters for status, priority, tags, and due dates.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string" as const,
        description: "Search keyword (required)",
      },
      status: {
        type: "string" as const,
        enum: ["all", "pending", "completed"],
        description: "Filter by status",
      },
      priority: {
        type: "string" as const,
        enum: ["low", "medium", "high", "critical"],
        description: "Filter by priority",
      },
      tags: {
        type: "string" as const,
        description: "Comma-separated tag names to filter by",
      },
      due_before: {
        type: "string" as const,
        description: "Filter tasks due before this date (ISO 8601)",
      },
      due_after: {
        type: "string" as const,
        description: "Filter tasks due after this date (ISO 8601)",
      },
      limit: {
        type: "number" as const,
        description: "Maximum results to return (default: 50)",
      },
    },
    required: ["query"],
  },
};
