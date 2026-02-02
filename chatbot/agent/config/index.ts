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
  ERROR_TEMPLATES_URDU,
  RESPONSE_TEMPLATES_URDU,
} from "./system-prompt.js";

export {
  AGENT_CONFIG,
  getClarificationPrompt,
  getErrorMessage,
  formatTask,
  formatTaskList,
  default,
} from "./agent-config.js";

export {
  ADD_TASK_EXAMPLES,
  LIST_TASKS_EXAMPLES,
  UPDATE_TASK_EXAMPLES,
  COMPLETE_TASK_EXAMPLES,
  DELETE_TASK_EXAMPLES,
  EDGE_CASE_EXAMPLES,
  // Urdu language examples
  URDU_ADD_TASK_EXAMPLES,
  URDU_LIST_TASKS_EXAMPLES,
  URDU_COMPLETE_TASK_EXAMPLES,
  URDU_UPDATE_TASK_EXAMPLES,
  URDU_DELETE_TASK_EXAMPLES,
  ALL_TRAINING_EXAMPLES,
  getExamplesByIntent,
  getExampleStats,
  validateExampleCoverage,
  type TrainingExample,
} from "./training-examples.js";
