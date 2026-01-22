/**
 * MCP Skill: set_due_date
 *
 * TASK-040: Set due date MCP tool
 * REQ-002: Due Dates & Time Reminders
 * Sets task due date via Phase V /api/todos/{id}/due-date endpoint.
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

export interface SetDueDateInput {
  task_id: number;
  due_date: string; // ISO 8601 format
  reminder_schedule?: string; // "1h,1d,1w"
}

export interface TaskOutput {
  id: number;
  title: string;
  due_date: string;
  reminder_schedule: { reminders: string[] } | null;
  updated_at: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateSetDueDateInput(input: SetDueDateInput): void {
  if (!input.task_id || typeof input.task_id !== "number") {
    throw new ValidationError("Task ID is required and must be a number");
  }
  if (!input.due_date || typeof input.due_date !== "string") {
    throw new ValidationError("Due date is required");
  }

  // Validate date format
  const date = new Date(input.due_date);
  if (isNaN(date.getTime())) {
    throw new ValidationError("Invalid date format. Use ISO 8601 format (e.g., 2024-01-15T10:00:00Z)");
  }
}

export async function executeSetDueDate(
  input: SetDueDateInput,
  context: Record<string, unknown>
): Promise<TaskOutput> {
  validateSetDueDateInput(input);

  const sessionToken = extractSessionToken(context);
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    const params = new URLSearchParams();
    params.append("due_date", input.due_date);
    if (input.reminder_schedule) {
      params.append("reminder_schedule", input.reminder_schedule);
    }

    const response = await httpClient.put<TaskOutput>(
      `/api/todos/${input.task_id}/due-date?${params.toString()}`,
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
    throw new Error(error.message || "Failed to set due date");
  }
}

export const setDueDateTool = {
  name: "set_due_date",
  description: "Set a due date for a task with optional reminder schedule.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task (required)",
      },
      due_date: {
        type: "string" as const,
        description: "Due date in ISO 8601 format (required, e.g., 2024-01-15T10:00:00Z)",
      },
      reminder_schedule: {
        type: "string" as const,
        description: "Comma-separated reminder times before due date (e.g., '1h,1d,1w' for 1 hour, 1 day, 1 week)",
      },
    },
    required: ["task_id", "due_date"],
  },
};
