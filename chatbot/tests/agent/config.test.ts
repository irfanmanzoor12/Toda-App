/**
 * Unit tests for Agent Configuration
 *
 * Validates:
 * - System prompt is defined and comprehensive
 * - All intent patterns are configured
 * - Error templates have required placeholders
 * - Helper functions work correctly
 * - Configuration complies with spec requirements
 */

import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  CONVERSATION_RULES,
  INTENT_PATTERNS,
  REFUSED_INTENTS,
  ERROR_TEMPLATES,
  AGENT_CONFIG,
  getClarificationPrompt,
  getErrorMessage,
  formatTask,
  formatTaskList,
} from "../../agent/config/index.js";

describe("Agent Configuration", () => {
  describe("System Prompt", () => {
    it("should have comprehensive system prompt", () => {
      expect(SYSTEM_PROMPT).toBeTruthy();
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(500);
    });

    it("should define agent role", () => {
      expect(SYSTEM_PROMPT).toContain("todo list assistant");
      expect(SYSTEM_PROMPT).toContain("YOUR ROLE");
    });

    it("should list all 5 capabilities", () => {
      expect(SYSTEM_PROMPT).toContain("Add Task");
      expect(SYSTEM_PROMPT).toContain("List Tasks");
      expect(SYSTEM_PROMPT).toContain("Update Task");
      expect(SYSTEM_PROMPT).toContain("Complete Task");
      expect(SYSTEM_PROMPT).toContain("Delete Task");
    });

    it("should define unsupported operations", () => {
      expect(SYSTEM_PROMPT).toContain("WHAT YOU CANNOT DO");
      expect(SYSTEM_PROMPT).toContain("Authentication Operations");
      expect(SYSTEM_PROMPT).toContain("Data Export/Import");
      expect(SYSTEM_PROMPT).toContain("Bulk/Batch Operations");
      expect(SYSTEM_PROMPT).toContain("External Knowledge");
      expect(SYSTEM_PROMPT).toContain("Autonomous/Proactive Behavior");
      expect(SYSTEM_PROMPT).toContain("Analytics/Reporting");
    });

    it("should define conversation rules", () => {
      expect(SYSTEM_PROMPT).toContain("CONVERSATION RULES");
      expect(SYSTEM_PROMPT).toContain("Statelessness");
      expect(SYSTEM_PROMPT).toContain("Explicit Clarification");
      expect(SYSTEM_PROMPT).toContain("No Assumptions");
      expect(SYSTEM_PROMPT).toContain("Response Format");
    });

    it("should define error handling", () => {
      expect(SYSTEM_PROMPT).toContain("ERROR HANDLING");
      expect(SYSTEM_PROMPT).toContain("404");
      expect(SYSTEM_PROMPT).toContain("401");
      expect(SYSTEM_PROMPT).toContain("500");
    });

    it("should define parameter extraction rules", () => {
      expect(SYSTEM_PROMPT).toContain("PARAMETER EXTRACTION");
      expect(SYSTEM_PROMPT).toContain("Task IDs");
      expect(SYSTEM_PROMPT).toContain("Titles");
      expect(SYSTEM_PROMPT).toContain("Descriptions");
    });

    it("should list available MCP tools", () => {
      expect(SYSTEM_PROMPT).toContain("AVAILABLE TOOLS");
      expect(SYSTEM_PROMPT).toContain("add_task");
      expect(SYSTEM_PROMPT).toContain("list_tasks");
      expect(SYSTEM_PROMPT).toContain("update_task");
      expect(SYSTEM_PROMPT).toContain("complete_task");
      expect(SYSTEM_PROMPT).toContain("delete_task");
    });
  });

  describe("Conversation Rules", () => {
    it("should enforce statelessness", () => {
      expect(CONVERSATION_RULES.stateless).toBe(true);
    });

    it("should require explicit task IDs", () => {
      expect(CONVERSATION_RULES.requireExplicitTaskIds).toBe(true);
    });

    it("should have no context carryover", () => {
      expect(CONVERSATION_RULES.noContextCarryover).toBe(true);
    });

    it("should ask for clarification when ambiguous", () => {
      expect(CONVERSATION_RULES.askClarificationWhenAmbiguous).toBe(true);
    });

    it("should make no assumptions", () => {
      expect(CONVERSATION_RULES.noAssumptions).toBe(true);
    });
  });

  describe("Intent Patterns", () => {
    it("should define patterns for all 5 intents", () => {
      expect(INTENT_PATTERNS).toHaveProperty("add_task");
      expect(INTENT_PATTERNS).toHaveProperty("list_tasks");
      expect(INTENT_PATTERNS).toHaveProperty("update_task");
      expect(INTENT_PATTERNS).toHaveProperty("complete_task");
      expect(INTENT_PATTERNS).toHaveProperty("delete_task");
    });

    it("should have multiple patterns per intent", () => {
      expect(INTENT_PATTERNS.add_task.length).toBeGreaterThanOrEqual(3);
      expect(INTENT_PATTERNS.list_tasks.length).toBeGreaterThanOrEqual(3);
      expect(INTENT_PATTERNS.update_task.length).toBeGreaterThanOrEqual(3);
      expect(INTENT_PATTERNS.complete_task.length).toBeGreaterThanOrEqual(3);
      expect(INTENT_PATTERNS.delete_task.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Refused Intents", () => {
    it("should define all 6 refused intent categories", () => {
      expect(REFUSED_INTENTS).toHaveProperty("authentication");
      expect(REFUSED_INTENTS).toHaveProperty("dataExport");
      expect(REFUSED_INTENTS).toHaveProperty("bulkOperations");
      expect(REFUSED_INTENTS).toHaveProperty("externalKnowledge");
      expect(REFUSED_INTENTS).toHaveProperty("autonomous");
      expect(REFUSED_INTENTS).toHaveProperty("analytics");
    });

    it("should have patterns and responses for each category", () => {
      Object.values(REFUSED_INTENTS).forEach((category) => {
        expect(category).toHaveProperty("patterns");
        expect(category).toHaveProperty("response");
        expect(Array.isArray(category.patterns)).toBe(true);
        expect(typeof category.response).toBe("string");
      });
    });
  });

  describe("Error Templates", () => {
    it("should define all required error templates", () => {
      expect(ERROR_TEMPLATES).toHaveProperty("missingTaskId");
      expect(ERROR_TEMPLATES).toHaveProperty("missingTitle");
      expect(ERROR_TEMPLATES).toHaveProperty("taskNotFound");
      expect(ERROR_TEMPLATES).toHaveProperty("sessionExpired");
      expect(ERROR_TEMPLATES).toHaveProperty("serverError");
      expect(ERROR_TEMPLATES).toHaveProperty("ambiguousIntent");
      expect(ERROR_TEMPLATES).toHaveProperty("noFieldsToUpdate");
    });
  });

  describe("Agent Config", () => {
    it("should have model configuration", () => {
      expect(AGENT_CONFIG).toHaveProperty("model");
      expect(AGENT_CONFIG).toHaveProperty("temperature");
      expect(AGENT_CONFIG.temperature).toBeLessThanOrEqual(0.5);
    });

    it("should include system prompt", () => {
      expect(AGENT_CONFIG.systemPrompt).toBe(SYSTEM_PROMPT);
    });

    it("should map all 5 skills", () => {
      expect(AGENT_CONFIG.skillMapping).toHaveProperty("add_task");
      expect(AGENT_CONFIG.skillMapping).toHaveProperty("list_tasks");
      expect(AGENT_CONFIG.skillMapping).toHaveProperty("update_task");
      expect(AGENT_CONFIG.skillMapping).toHaveProperty("complete_task");
      expect(AGENT_CONFIG.skillMapping).toHaveProperty("delete_task");
    });

    it("should have response configuration", () => {
      expect(AGENT_CONFIG).toHaveProperty("responseConfig");
      expect(AGENT_CONFIG.responseConfig.maxTokens).toBeLessThanOrEqual(1000);
    });

    it("should enforce validation rules", () => {
      expect(AGENT_CONFIG.validation.enforceStatelessness).toBe(true);
      expect(AGENT_CONFIG.validation.requireExplicitTaskIds).toBe(true);
      expect(AGENT_CONFIG.validation.rejectRelativeReferences).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    describe("getClarificationPrompt", () => {
      it("should return prompt for missing task ID", () => {
        const prompt = getClarificationPrompt("missingTaskId", {
          action: "complete",
        });
        expect(prompt).toContain("task ID");
        expect(prompt).toContain("complete");
      });

      it("should return prompt for ambiguous intent", () => {
        const prompt = getClarificationPrompt("ambiguousIntent");
        expect(prompt).toContain("more information");
      });

      it("should return default for unknown type", () => {
        const prompt = getClarificationPrompt("unknown" as any);
        expect(prompt).toContain("more information");
      });
    });

    describe("getErrorMessage", () => {
      it("should return error message for missing task ID", () => {
        const message = getErrorMessage("missingTaskId", {
          action: "delete",
        });
        expect(message).toContain("task ID");
        expect(message).toContain("delete");
      });

      it("should return error message for task not found", () => {
        const message = getErrorMessage("taskNotFound", { taskId: "42" });
        expect(message).toContain("42");
        expect(message).toContain("not found");
      });

      it("should return default for unknown error", () => {
        const message = getErrorMessage("unknown" as any);
        expect(message).toContain("error");
      });
    });

    describe("formatTask", () => {
      it("should format pending task", () => {
        const formatted = formatTask({
          id: 5,
          title: "Buy groceries",
          is_completed: false,
        });
        expect(formatted).toContain("[ID 5]");
        expect(formatted).toContain("Buy groceries");
        expect(formatted).toContain("Pending");
      });

      it("should format completed task", () => {
        const formatted = formatTask({
          id: 10,
          title: "Finish report",
          is_completed: true,
        });
        expect(formatted).toContain("[ID 10]");
        expect(formatted).toContain("Finish report");
        expect(formatted).toContain("Completed");
      });
    });

    describe("formatTaskList", () => {
      it("should format empty task list", () => {
        const formatted = formatTaskList([]);
        expect(formatted).toContain("don't have any tasks");
      });

      it("should format list with multiple tasks", () => {
        const tasks = [
          { id: 1, title: "Task 1", is_completed: false },
          { id: 2, title: "Task 2", is_completed: true },
          { id: 3, title: "Task 3", is_completed: false },
        ];
        const formatted = formatTaskList(tasks);

        expect(formatted).toContain("Here are your tasks:");
        expect(formatted).toContain("[ID 1]");
        expect(formatted).toContain("[ID 2]");
        expect(formatted).toContain("[ID 3]");
        expect(formatted).toContain("Pending");
        expect(formatted).toContain("Completed");
      });

      it("should number tasks sequentially", () => {
        const tasks = [
          { id: 5, title: "Task A", is_completed: false },
          { id: 10, title: "Task B", is_completed: false },
        ];
        const formatted = formatTaskList(tasks);

        expect(formatted).toContain("1.");
        expect(formatted).toContain("2.");
      });
    });
  });
});
