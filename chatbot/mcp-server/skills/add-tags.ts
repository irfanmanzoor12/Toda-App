/**
 * MCP Skill: add_tags
 *
 * TASK-042: Add tags MCP tool
 * REQ-004: Task Tags
 * Adds tags to a task via Phase V /api/todos/{id}/tags endpoint.
 */

import { createAuthenticatedClient } from "../utils/http-client.js";
import { extractSessionToken } from "../middleware/auth.js";

export interface AddTagsInput {
  task_id: number;
  tag: string;
}

export interface TaskOutput {
  id: number;
  title: string;
  tags: Array<{ id: number; name: string }>;
  updated_at: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateAddTagsInput(input: AddTagsInput): void {
  if (!input.task_id || typeof input.task_id !== "number") {
    throw new ValidationError("Task ID is required and must be a number");
  }
  if (!input.tag || typeof input.tag !== "string") {
    throw new ValidationError("Tag name is required");
  }
  if (input.tag.trim().length === 0) {
    throw new ValidationError("Tag name cannot be empty");
  }
  if (input.tag.trim().length > 50) {
    throw new ValidationError("Tag name must be 50 characters or less");
  }
}

export async function executeAddTags(
  input: AddTagsInput,
  context: Record<string, unknown>
): Promise<TaskOutput> {
  validateAddTagsInput(input);

  const sessionToken = extractSessionToken(context);
  const httpClient = createAuthenticatedClient(sessionToken);

  try {
    const response = await httpClient.post<TaskOutput>(
      `/api/todos/${input.task_id}/tags`,
      { name: input.tag.trim().toLowerCase() }
    );
    return response.data;
  } catch (error: any) {
    if (error.status === 404) {
      throw new ValidationError(`Task ${input.task_id} not found`);
    }
    if (error.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw new Error(error.message || "Failed to add tag");
  }
}

export const addTagsTool = {
  name: "add_tags",
  description: "Add a tag to a task for organization and filtering.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_id: {
        type: "number" as const,
        description: "ID of the task to tag (required)",
      },
      tag: {
        type: "string" as const,
        description: "Tag name to add (required, 1-50 characters)",
      },
    },
    required: ["task_id", "tag"],
  },
};
