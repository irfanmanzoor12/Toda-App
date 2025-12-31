/**
 * Agent Configuration for OpenAI-powered Todo Chatbot
 *
 * Configures the OpenAI agent runtime with:
 * - System prompt and behavior rules
 * - MCP skill integration
 * - Response formatting
 * - Error handling templates
 *
 * Reference: Spec Sections 4, 6, 7
 */

import {
  SYSTEM_PROMPT,
  CONVERSATION_RULES,
  INTENT_PATTERNS,
  REFUSED_INTENTS,
  ERROR_TEMPLATES,
} from "./system-prompt.js";

/**
 * Agent configuration for OpenAI runtime
 */
export const AGENT_CONFIG = {
  /**
   * Model configuration
   */
  model: "gpt-4o-mini",
  temperature: 0.3, // Low temperature for consistent, deterministic responses

  /**
   * System prompt defines agent behavior
   */
  systemPrompt: SYSTEM_PROMPT,

  /**
   * Conversation rules
   */
  conversationRules: CONVERSATION_RULES,

  /**
   * Response configuration
   */
  responseConfig: {
    maxTokens: 500, // Keep responses concise
    format: "conversational",
    includeTaskDetails: true, // Always include task ID and title in confirmations
  },

  /**
   * MCP Skills configuration
   * Maps intents to skill names
   */
  skillMapping: {
    add_task: "add_task",
    list_tasks: "list_tasks",
    update_task: "update_task",
    complete_task: "complete_task",
    delete_task: "delete_task",
  },

  /**
   * Intent detection configuration
   */
  intentDetection: {
    patterns: INTENT_PATTERNS,
    refusedIntents: REFUSED_INTENTS,
    requireConfidenceThreshold: 0.7,
  },

  /**
   * Parameter extraction rules
   */
  parameterExtraction: {
    taskId: {
      patterns: ["task (\\d+)", "id (\\d+)", "number (\\d+)", "#(\\d+)"],
      type: "integer",
      required: ["update_task", "complete_task", "delete_task"],
    },
    title: {
      maxLength: 200,
      minLength: 1,
      required: ["add_task"],
      trimWhitespace: true,
    },
    description: {
      maxLength: 1000,
      minLength: 0,
      optional: true,
      trimWhitespace: false,
    },
  },

  /**
   * Error handling templates
   */
  errorHandling: {
    templates: ERROR_TEMPLATES,
    showFriendlyMessages: true,
    hideStackTraces: true,
    logErrors: true,
  },

  /**
   * Clarification prompts
   */
  clarificationPrompts: {
    missingTaskId: {
      message: "I need a task ID to {action}. Which task should I {action}?",
      actions: ["update", "complete", "delete"],
    },
    ambiguousIntent: {
      message:
        "I can help you with that, but I need more information. Could you please clarify what you'd like to do?",
      offerOptions: true,
    },
    missingUpdateFields: {
      message:
        "I can update task {taskId}, but I need to know what to change. Would you like to update the title, description, or both? For example: 'Update task {taskId} title to...' or 'Change task {taskId} description to...'",
    },
    relativeReference: {
      message:
        "Please provide the specific task ID you want to {action}. Use 'list my tasks' to see all task IDs.",
      actions: ["update", "complete", "delete"],
    },
  },

  /**
   * Response formatting guidelines
   */
  responseFormat: {
    taskList: {
      template: "{index}. [ID {id}] {title} ({status})",
      emptyMessage: "You don't have any tasks yet. Create one by saying 'Add task: [your task title]'.",
      header: "Here are your tasks:",
    },
    taskCreated: {
      template: "✓ Task created: [ID {id}] {title}",
      includeDescription: true,
    },
    taskUpdated: {
      template: "✓ Task updated: [ID {id}] {title}",
      showChanges: true,
    },
    taskCompleted: {
      template: "✓ Task completed: [ID {id}] {title}",
    },
    taskDeleted: {
      template: "✓ Task deleted: [ID {id}] {title}",
    },
  },

  /**
   * Validation rules
   */
  validation: {
    enforceStatelessness: true,
    rejectRelativeReferences: true,
    requireExplicitTaskIds: true,
    validateBeforeExecution: true,
  },
};

/**
 * Helper function to get clarification prompt
 */
export function getClarificationPrompt(
  type: keyof typeof AGENT_CONFIG.clarificationPrompts,
  params: Record<string, string> = {}
): string {
  const prompt = AGENT_CONFIG.clarificationPrompts[type];
  if (!prompt) return "Could you please provide more information?";

  let message = prompt.message;
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, "g"), value);
  });

  return message;
}

/**
 * Helper function to get error template
 */
export function getErrorMessage(
  errorType: keyof typeof ERROR_TEMPLATES,
  params: Record<string, string> = {}
): string {
  let message = ERROR_TEMPLATES[errorType];
  if (!message) return "An error occurred. Please try again.";

  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, "g"), value);
  });

  return message;
}

/**
 * Helper function to format task for display
 */
export function formatTask(task: {
  id: number;
  title: string;
  description?: string | null;
  is_completed: boolean;
}) {
  const status = task.is_completed ? "Completed" : "Pending";
  return `[ID ${task.id}] ${task.title} (${status})`;
}

/**
 * Helper function to format task list
 */
export function formatTaskList(tasks: Array<{
  id: number;
  title: string;
  description?: string | null;
  is_completed: boolean;
}>): string {
  if (tasks.length === 0) {
    return AGENT_CONFIG.responseFormat.taskList.emptyMessage;
  }

  const header = AGENT_CONFIG.responseFormat.taskList.header;
  const taskLines = tasks.map((task, index) => {
    const status = task.is_completed ? "Completed" : "Pending";
    return `${index + 1}. [ID ${task.id}] ${task.title} (${status})`;
  });

  return `${header}\n${taskLines.join("\n")}`;
}

export default AGENT_CONFIG;
