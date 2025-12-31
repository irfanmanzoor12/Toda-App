/**
 * Intent Detection Training Examples
 *
 * Provides diverse natural language examples for each intent
 * to improve agent's ability to recognize user requests.
 *
 * Reference: Spec Section 2 (Supported User Intents)
 * Acceptance Criteria: AC-1 through AC-5 (minimum 5 examples per intent)
 */

export interface TrainingExample {
  input: string;
  intent: string;
  parameters?: Record<string, any>;
  description?: string;
}

/**
 * Add Task Intent Training Examples
 * AC-1: Agent correctly identifies "add task" intent from natural language variations
 */
export const ADD_TASK_EXAMPLES: TrainingExample[] = [
  {
    input: "Add a task to buy groceries",
    intent: "add_task",
    parameters: { title: "buy groceries" },
    description: "Simple add with 'to' preposition",
  },
  {
    input: "Create a new task: finish the quarterly report",
    intent: "add_task",
    parameters: { title: "finish the quarterly report" },
    description: "Explicit 'create' with colon separator",
  },
  {
    input: "Remind me to call the dentist tomorrow",
    intent: "add_task",
    parameters: { title: "call the dentist tomorrow" },
    description: "Natural reminder phrasing (not actual reminder system)",
  },
  {
    input: "Add task: review pull request #42, description: check for security issues",
    intent: "add_task",
    parameters: {
      title: "review pull request #42",
      description: "check for security issues",
    },
    description: "Explicit title and description with labels",
  },
  {
    input: "New task buy milk",
    intent: "add_task",
    parameters: { title: "buy milk" },
    description: "Minimal phrasing without prepositions",
  },
  {
    input: "I need to schedule a meeting with the team",
    intent: "add_task",
    parameters: { title: "schedule a meeting with the team" },
    description: "'I need to' variant",
  },
  {
    input: "Add: Deploy to production",
    intent: "add_task",
    parameters: { title: "Deploy to production" },
    description: "Short form with colon",
  },
  {
    input: "Can you add a task called 'Update documentation'?",
    intent: "add_task",
    parameters: { title: "Update documentation" },
    description: "Polite question form",
  },
  {
    input: "Create task 'Fix login bug' with note: affects mobile users",
    intent: "add_task",
    parameters: { title: "Fix login bug", description: "affects mobile users" },
    description: "Title in quotes with note keyword",
  },
  {
    input: "Add write unit tests for the API",
    intent: "add_task",
    parameters: { title: "write unit tests for the API" },
    description: "Direct verb form",
  },
];

/**
 * List Tasks Intent Training Examples
 * AC-2: Agent correctly identifies "list tasks" intent from natural language variations
 */
export const LIST_TASKS_EXAMPLES: TrainingExample[] = [
  {
    input: "Show me my tasks",
    intent: "list_tasks",
    description: "Common 'show me' phrasing",
  },
  {
    input: "What's on my todo list?",
    intent: "list_tasks",
    description: "Question form with 'todo list'",
  },
  {
    input: "List all my tasks",
    intent: "list_tasks",
    description: "Explicit 'list' command",
  },
  {
    input: "What do I need to do?",
    intent: "list_tasks",
    description: "Natural question about pending work",
  },
  {
    input: "Display my todos",
    intent: "list_tasks",
    description: "'Display' variant",
  },
  {
    input: "Show tasks",
    intent: "list_tasks",
    description: "Minimal form",
  },
  {
    input: "What tasks do I have?",
    intent: "list_tasks",
    description: "Question about task inventory",
  },
  {
    input: "Can you show me what's on my list?",
    intent: "list_tasks",
    description: "Polite question form",
  },
  {
    input: "View my task list",
    intent: "list_tasks",
    description: "'View' variant",
  },
  {
    input: "What are my current tasks?",
    intent: "list_tasks",
    description: "Question with 'current' modifier",
  },
];

/**
 * Update Task Intent Training Examples
 * AC-3: Agent correctly identifies "update task" intent from natural language variations
 */
export const UPDATE_TASK_EXAMPLES: TrainingExample[] = [
  {
    input: "Update task 5 to 'Buy organic groceries'",
    intent: "update_task",
    parameters: { task_id: 5, title: "Buy organic groceries" },
    description: "Standard update with 'to' preposition",
  },
  {
    input: "Change the description of task 3 to 'Include unit tests'",
    intent: "update_task",
    parameters: { task_id: 3, description: "Include unit tests" },
    description: "Update description only",
  },
  {
    input: "Edit task 12: new title 'Deploy to staging', new description 'After code review'",
    intent: "update_task",
    parameters: {
      task_id: 12,
      title: "Deploy to staging",
      description: "After code review",
    },
    description: "Update both title and description",
  },
  {
    input: "Rename task 7 to 'Call dentist at 2pm'",
    intent: "update_task",
    parameters: { task_id: 7, title: "Call dentist at 2pm" },
    description: "'Rename' variant for title update",
  },
  {
    input: "Update task 4 description: add security review step",
    intent: "update_task",
    parameters: { task_id: 4, description: "add security review step" },
    description: "Description update with colon",
  },
  {
    input: "Modify task 9 title to 'Complete quarterly report'",
    intent: "update_task",
    parameters: { task_id: 9, title: "Complete quarterly report" },
    description: "'Modify' variant",
  },
  {
    input: "Change task 2 to 'Review PR #123'",
    intent: "update_task",
    parameters: { task_id: 2, title: "Review PR #123" },
    description: "Simple 'change' form",
  },
  {
    input: "Update the title of task 6 to 'Fix authentication bug'",
    intent: "update_task",
    parameters: { task_id: 6, title: "Fix authentication bug" },
    description: "Explicit 'title' specification",
  },
  {
    input: "Edit task 8's description to 'Needs testing on staging'",
    intent: "update_task",
    parameters: { task_id: 8, description: "Needs testing on staging" },
    description: "Possessive form with description",
  },
  {
    input: "Set task 11 title as 'Prepare demo'",
    intent: "update_task",
    parameters: { task_id: 11, title: "Prepare demo" },
    description: "'Set' variant with 'as'",
  },
];

/**
 * Complete Task Intent Training Examples
 * AC-4: Agent correctly identifies "complete task" intent from natural language variations
 */
export const COMPLETE_TASK_EXAMPLES: TrainingExample[] = [
  {
    input: "Mark task 3 as done",
    intent: "complete_task",
    parameters: { task_id: 3 },
    description: "Common 'mark as done' phrasing",
  },
  {
    input: "Complete task 8",
    intent: "complete_task",
    parameters: { task_id: 8 },
    description: "Direct 'complete' command",
  },
  {
    input: "I finished task 15",
    intent: "complete_task",
    parameters: { task_id: 15 },
    description: "Past tense 'finished'",
  },
  {
    input: "Task 2 is complete",
    intent: "complete_task",
    parameters: { task_id: 2 },
    description: "Declarative statement",
  },
  {
    input: "Done with task 10",
    intent: "complete_task",
    parameters: { task_id: 10 },
    description: "'Done with' variant",
  },
  {
    input: "Mark 5 as completed",
    intent: "complete_task",
    parameters: { task_id: 5 },
    description: "Minimal with 'completed'",
  },
  {
    input: "I'm done with task 7",
    intent: "complete_task",
    parameters: { task_id: 7 },
    description: "Conversational 'I'm done'",
  },
  {
    input: "Finish task 12",
    intent: "complete_task",
    parameters: { task_id: 12 },
    description: "'Finish' variant",
  },
  {
    input: "Set task 9 as done",
    intent: "complete_task",
    parameters: { task_id: 9 },
    description: "'Set as done' variant",
  },
  {
    input: "Task 4 completed",
    intent: "complete_task",
    parameters: { task_id: 4 },
    description: "Minimal declarative",
  },
];

/**
 * Delete Task Intent Training Examples
 * AC-5: Agent correctly identifies "delete task" intent from natural language variations
 */
export const DELETE_TASK_EXAMPLES: TrainingExample[] = [
  {
    input: "Delete task 6",
    intent: "delete_task",
    parameters: { task_id: 6 },
    description: "Direct 'delete' command",
  },
  {
    input: "Remove task 9",
    intent: "delete_task",
    parameters: { task_id: 9 },
    description: "'Remove' variant",
  },
  {
    input: "Get rid of task 4",
    intent: "delete_task",
    parameters: { task_id: 4 },
    description: "Informal 'get rid of'",
  },
  {
    input: "Cancel task 11",
    intent: "delete_task",
    parameters: { task_id: 11 },
    description: "'Cancel' variant",
  },
  {
    input: "Trash task 7",
    intent: "delete_task",
    parameters: { task_id: 7 },
    description: "'Trash' variant",
  },
  {
    input: "Delete 3",
    intent: "delete_task",
    parameters: { task_id: 3 },
    description: "Minimal form with just ID",
  },
  {
    input: "Remove task number 15",
    intent: "delete_task",
    parameters: { task_id: 15 },
    description: "Explicit 'task number'",
  },
  {
    input: "Discard task 8",
    intent: "delete_task",
    parameters: { task_id: 8 },
    description: "'Discard' variant",
  },
  {
    input: "Drop task 2",
    intent: "delete_task",
    parameters: { task_id: 2 },
    description: "'Drop' variant",
  },
  {
    input: "I don't need task 5 anymore, delete it",
    intent: "delete_task",
    parameters: { task_id: 5 },
    description: "Conversational with context",
  },
];

/**
 * Edge Cases and Ambiguous Examples
 * These examples test clarification and error handling
 */
export const EDGE_CASE_EXAMPLES: TrainingExample[] = [
  {
    input: "Update task 5",
    intent: "clarification_needed",
    description: "Missing what to update - should ask for clarification",
  },
  {
    input: "Delete it",
    intent: "clarification_needed",
    description: "No task ID - stateless, cannot reference 'it'",
  },
  {
    input: "Mark the first task as done",
    intent: "clarification_needed",
    description: "Relative reference - requires explicit task ID",
  },
  {
    input: "Add task",
    intent: "clarification_needed",
    description: "Missing title - should ask for title",
  },
  {
    input: "Complete all my tasks",
    intent: "refused_bulk_operation",
    description: "Bulk operation - should refuse politely",
  },
  {
    input: "Export my tasks to CSV",
    intent: "refused_data_export",
    description: "Data export - should refuse with message",
  },
  {
    input: "Log me out",
    intent: "refused_authentication",
    description: "Authentication - should refuse and redirect to web app",
  },
  {
    input: "What's the weather tomorrow?",
    intent: "refused_external_knowledge",
    description: "External knowledge - should refuse",
  },
  {
    input: "Remind me about task 5 tomorrow",
    intent: "refused_autonomous",
    description: "Autonomous action - should refuse (but 'remind me to X' for new task is OK)",
  },
  {
    input: "How many tasks did I complete this week?",
    intent: "refused_analytics",
    description: "Analytics - should refuse",
  },
];

/**
 * All training examples combined
 */
export const ALL_TRAINING_EXAMPLES: TrainingExample[] = [
  ...ADD_TASK_EXAMPLES,
  ...LIST_TASKS_EXAMPLES,
  ...UPDATE_TASK_EXAMPLES,
  ...COMPLETE_TASK_EXAMPLES,
  ...DELETE_TASK_EXAMPLES,
  ...EDGE_CASE_EXAMPLES,
];

/**
 * Get training examples by intent
 */
export function getExamplesByIntent(intent: string): TrainingExample[] {
  return ALL_TRAINING_EXAMPLES.filter((example) => example.intent === intent);
}

/**
 * Get count of examples per intent
 */
export function getExampleStats() {
  const stats: Record<string, number> = {};
  ALL_TRAINING_EXAMPLES.forEach((example) => {
    stats[example.intent] = (stats[example.intent] || 0) + 1;
  });
  return stats;
}

/**
 * Validate that we have minimum required examples
 * Per AC-1 through AC-5: minimum 5 test cases per intent
 */
export function validateExampleCoverage(): {
  valid: boolean;
  message: string;
} {
  const stats = getExampleStats();
  const requiredIntents = [
    "add_task",
    "list_tasks",
    "update_task",
    "complete_task",
    "delete_task",
  ];
  const minExamplesPerIntent = 5;

  for (const intent of requiredIntents) {
    const count = stats[intent] || 0;
    if (count < minExamplesPerIntent) {
      return {
        valid: false,
        message: `Intent '${intent}' has only ${count} examples, requires ${minExamplesPerIntent}`,
      };
    }
  }

  return {
    valid: true,
    message: `All intents have at least ${minExamplesPerIntent} examples`,
  };
}
