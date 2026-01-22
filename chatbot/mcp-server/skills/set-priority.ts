/**
 * MCP Skill: set_priority
 *
 * TASK-043: Set priority MCP tool
 * REQ-003: Task Priorities
 * Sets task priority via Phase V /api/todos/{id}/priority endpoint.
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

export interface SetPriorityInput {
  task_id: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface TaskOutput {
  id: number;
  title: string;
  priority: string;
  updated_at: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateSetPriorityInput(input: SetPriorityInput): void {
  if (!input.task_id || typeof input.task_id !== "number") {
    throw new ValidationError("Task ID is required and must be a number");
  }
  if (!input.priority) {
    throw new ValidationError("Priority is required");
  }
  const validPriorities = ["low", "medium", "high", "critical"];
  if (!validPriorities.includes(input.priority)) {
    throw new ValidationError(`Priority must be one of: ${validPriorities.join(", ")}`);
  }
}

export async function executeSetPriority(
  input: SetPriorityInput,
  context: Record<string, unknown>
): Promise<TaskOutput> {
  validateSetPriorityInput(input);

  const sessionToken = extractSessionToken(context);
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    const response = await httpClient.put<TaskOutput>(
      `/api/todos/${input.task_id}/priority?priority=${input.priority}`,
      {}
    );
    return response.data;
  } catch (error: any) {
    if (error.status === 404) {
      throw new ValidationError(`Task ${input.task_id} not found`);
    }
    if (error.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw new Error(error.message || "Failed to set priority");
  }
}

export const setPriorityTool = {
  name: "set_priority",
  description: "Set the priority level of a task (low, medium, high, or critical).",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task to update (required)",
      },
      priority: {
        type: "string" as const,
        enum: ["low", "medium", "high", "critical"],
        description: "Priority level (required)",
      },
    },
    required: ["task_id", "priority"],
  },
};
