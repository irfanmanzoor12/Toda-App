/**
 * Agent Configuration Module
 *
 * Exports all agent configuration, system prompts, and helper utilities
 */

export {
  SYSTEM_PROMPT,
  CONVERSATION_RULES,
  INTENT_PATTERNS,
  REFUSED_INTENTS,
  ERROR_TEMPLATES,
} from "./system-prompt.js";

export {
  AGENT_CONFIG,
  getClarificationPrompt,
  getErrorMessage,
  formatTask,
  formatTaskList,
  default,
} from "./agent-config.js";
