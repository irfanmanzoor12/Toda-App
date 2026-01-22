/**
 * MCP Skill: add_recurring_task
 *
 * TASK-039: Add recurring task MCP tool
 * REQ-001: Recurring Tasks
 * Creates a task with recurrence pattern via Task Service and Recurrence Service.
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

export interface AddRecurringTaskInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  frequency: "daily" | "weekly" | "monthly";
  interval?: number;
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  end_date?: string;
  max_occurrences?: number;
}

export interface RecurringTaskOutput {
  task: {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    created_at: string;
  };
  recurrence: {
    id: number;
    frequency: string;
    interval: number;
    next_occurrence: string;
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateAddRecurringTaskInput(input: AddRecurringTaskInput): void {
  if (!input.title || typeof input.title !== "string") {
    throw new ValidationError("Title is required");
  }
  if (input.title.trim().length === 0) {
    throw new ValidationError("Title cannot be empty");
  }
  if (input.title.length > 200) {
    throw new ValidationError("Title must be 200 characters or less");
  }

  const validFrequencies = ["daily", "weekly", "monthly"];
  if (!input.frequency || !validFrequencies.includes(input.frequency)) {
    throw new ValidationError(`Frequency must be one of: ${validFrequencies.join(", ")}`);
  }

  if (input.frequency === "weekly" && input.day_of_week !== undefined) {
    if (input.day_of_week < 0 || input.day_of_week > 6) {
      throw new ValidationError("Day of week must be 0-6 (0=Monday, 6=Sunday)");
    }
  }

  if (input.frequency === "monthly" && input.day_of_month !== undefined) {
    if (input.day_of_month < 1 || input.day_of_month > 31) {
      throw new ValidationError("Day of month must be 1-31");
    }
  }
}

export async function executeAddRecurringTask(
  input: AddRecurringTaskInput,
  context: Record<string, unknown>
): Promise<RecurringTaskOutput> {
  validateAddRecurringTaskInput(input);

  const sessionToken = extractSessionToken(context);
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    // Step 1: Create the task
    const taskResponse = await httpClient.post<{ id: number; title: string; description: string | null; priority: string; created_at: string }>(
      `/api/todos`,
      {
        title: input.title.trim(),
        description: input.description || null,
        priority: input.priority || "medium",
      }
    );

    const task = taskResponse.data;

    // Step 2: Create recurrence pattern (via Dapr service invocation in production)
    // For now, call the recurrence service directly
    const recurrenceResponse = await httpClient.post<{ id: number; frequency: string; interval: number; next_occurrence: string }>(
      `/api/recurrence/patterns`,
      {
        task_id: task.id,
        frequency: input.frequency,
        interval: input.interval || 1,
        day_of_week: input.day_of_week,
        day_of_month: input.day_of_month,
        end_date: input.end_date,
        max_occurrences: input.max_occurrences,
      }
    );

    return {
      task: task,
      recurrence: recurrenceResponse.data,
    };
  } catch (error: any) {
    if (error.status === 400) {
      throw new ValidationError(error.data?.detail || "Invalid request");
    }
    if (error.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (error.status === 409) {
      throw new ValidationError("A recurrence pattern already exists for this task");
    }
    throw new Error(error.message || "Failed to create recurring task");
  }
}

export const addRecurringTaskTool = {
  name: "add_recurring_task",
  description: "Create a new recurring task that automatically spawns new instances on a schedule.",
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string" as const,
        description: "Task title (required, 1-200 characters)",
      },
      description: {
        type: "string" as const,
        description: "Task description (optional)",
      },
      priority: {
        type: "string" as const,
        enum: ["low", "medium", "high", "critical"],
        description: "Task priority (default: medium)",
      },
      frequency: {
        type: "string" as const,
        enum: ["daily", "weekly", "monthly"],
        description: "Recurrence frequency (required)",
      },
      interval: {
        type: "number" as const,
        description: "Every N days/weeks/months (default: 1)",
      },
      day_of_week: {
        type: "number" as const,
        description: "Day of week for weekly recurrence (0=Monday, 6=Sunday)",
      },
      day_of_month: {
        type: "number" as const,
        description: "Day of month for monthly recurrence (1-31)",
      },
      end_date: {
        type: "string" as const,
        description: "End date for recurrence (ISO 8601 format)",
      },
      max_occurrences: {
        type: "number" as const,
        description: "Maximum number of occurrences",
      },
    },
    required: ["title", "frequency"],
  },
};
