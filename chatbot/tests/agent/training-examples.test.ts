/**
 * Unit tests for Intent Detection Training Examples
 *
 * Validates:
 * - Minimum 5 examples per intent (AC-1 through AC-5)
 * - Examples have required fields
 * - Examples cover diverse phrasings
 * - Edge cases are included
 * - Parameter extraction examples are valid
 */

import { describe, it, expect } from "vitest";
import {
  ADD_TASK_EXAMPLES,
  LIST_TASKS_EXAMPLES,
  UPDATE_TASK_EXAMPLES,
  COMPLETE_TASK_EXAMPLES,
  DELETE_TASK_EXAMPLES,
  EDGE_CASE_EXAMPLES,
  ALL_TRAINING_EXAMPLES,
  getExamplesByIntent,
  getExampleStats,
  validateExampleCoverage,
  type TrainingExample,
} from "../../agent/config/training-examples.js";

describe("Intent Detection Training Examples", () => {
  describe("Example Structure", () => {
    it("should have input and intent for all examples", () => {
      ALL_TRAINING_EXAMPLES.forEach((example) => {
        expect(example).toHaveProperty("input");
        expect(example).toHaveProperty("intent");
        expect(typeof example.input).toBe("string");
        expect(typeof example.intent).toBe("string");
        expect(example.input.length).toBeGreaterThan(0);
      });
    });

    it("should have descriptions for all examples", () => {
      ALL_TRAINING_EXAMPLES.forEach((example) => {
        expect(example).toHaveProperty("description");
        expect(typeof example.description).toBe("string");
        expect(example.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Add Task Examples (AC-1)", () => {
    it("should have at least 5 examples", () => {
      expect(ADD_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have at least 10 examples for good coverage", () => {
      expect(ADD_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should all have add_task intent", () => {
      ADD_TASK_EXAMPLES.forEach((example) => {
        expect(example.intent).toBe("add_task");
      });
    });

    it("should include diverse phrasings", () => {
      const inputs = ADD_TASK_EXAMPLES.map((e) => e.input.toLowerCase());

      // Should include "add" variant
      expect(inputs.some((i) => i.includes("add"))).toBe(true);

      // Should include "create" variant
      expect(inputs.some((i) => i.includes("create"))).toBe(true);

      // Should include "remind" variant
      expect(inputs.some((i) => i.includes("remind"))).toBe(true);

      // Should include "new task" variant
      expect(inputs.some((i) => i.includes("new task"))).toBe(true);
    });

    it("should include examples with title only", () => {
      const titleOnly = ADD_TASK_EXAMPLES.filter(
        (e) => e.parameters?.title && !e.parameters?.description
      );
      expect(titleOnly.length).toBeGreaterThan(0);
    });

    it("should include examples with title and description", () => {
      const withDescription = ADD_TASK_EXAMPLES.filter(
        (e) => e.parameters?.title && e.parameters?.description
      );
      expect(withDescription.length).toBeGreaterThan(0);
    });
  });

  describe("List Tasks Examples (AC-2)", () => {
    it("should have at least 5 examples", () => {
      expect(LIST_TASKS_EXAMPLES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have at least 10 examples for good coverage", () => {
      expect(LIST_TASKS_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should all have list_tasks intent", () => {
      LIST_TASKS_EXAMPLES.forEach((example) => {
        expect(example.intent).toBe("list_tasks");
      });
    });

    it("should include diverse phrasings", () => {
      const inputs = LIST_TASKS_EXAMPLES.map((e) => e.input.toLowerCase());

      // Should include "show" variant
      expect(inputs.some((i) => i.includes("show"))).toBe(true);

      // Should include "list" variant
      expect(inputs.some((i) => i.includes("list"))).toBe(true);

      // Should include "what" question variant
      expect(inputs.some((i) => i.includes("what"))).toBe(true);

      // Should include "todo" or "tasks" variant
      expect(inputs.some((i) => i.includes("todo") || i.includes("tasks"))).toBe(true);
    });

    it("should not require parameters", () => {
      LIST_TASKS_EXAMPLES.forEach((example) => {
        expect(example.parameters).toBeUndefined();
      });
    });
  });

  describe("Update Task Examples (AC-3)", () => {
    it("should have at least 5 examples", () => {
      expect(UPDATE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have at least 10 examples for good coverage", () => {
      expect(UPDATE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should all have update_task intent", () => {
      UPDATE_TASK_EXAMPLES.forEach((example) => {
        expect(example.intent).toBe("update_task");
      });
    });

    it("should include diverse phrasings", () => {
      const inputs = UPDATE_TASK_EXAMPLES.map((e) => e.input.toLowerCase());

      // Should include "update" variant
      expect(inputs.some((i) => i.includes("update"))).toBe(true);

      // Should include "change" variant
      expect(inputs.some((i) => i.includes("change"))).toBe(true);

      // Should include "edit" variant
      expect(inputs.some((i) => i.includes("edit"))).toBe(true);

      // Should include "rename" variant
      expect(inputs.some((i) => i.includes("rename"))).toBe(true);
    });

    it("should all have task_id parameter", () => {
      UPDATE_TASK_EXAMPLES.forEach((example) => {
        expect(example.parameters).toBeDefined();
        expect(example.parameters?.task_id).toBeDefined();
        expect(typeof example.parameters?.task_id).toBe("number");
      });
    });

    it("should include title-only updates", () => {
      const titleOnly = UPDATE_TASK_EXAMPLES.filter(
        (e) => e.parameters?.title && !e.parameters?.description
      );
      expect(titleOnly.length).toBeGreaterThan(0);
    });

    it("should include description-only updates", () => {
      const descOnly = UPDATE_TASK_EXAMPLES.filter(
        (e) => !e.parameters?.title && e.parameters?.description
      );
      expect(descOnly.length).toBeGreaterThan(0);
    });

    it("should include updates with both title and description", () => {
      const both = UPDATE_TASK_EXAMPLES.filter(
        (e) => e.parameters?.title && e.parameters?.description
      );
      expect(both.length).toBeGreaterThan(0);
    });
  });

  describe("Complete Task Examples (AC-4)", () => {
    it("should have at least 5 examples", () => {
      expect(COMPLETE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have at least 10 examples for good coverage", () => {
      expect(COMPLETE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should all have complete_task intent", () => {
      COMPLETE_TASK_EXAMPLES.forEach((example) => {
        expect(example.intent).toBe("complete_task");
      });
    });

    it("should include diverse phrasings", () => {
      const inputs = COMPLETE_TASK_EXAMPLES.map((e) => e.input.toLowerCase());

      // Should include "complete" variant
      expect(inputs.some((i) => i.includes("complete"))).toBe(true);

      // Should include "done" variant
      expect(inputs.some((i) => i.includes("done"))).toBe(true);

      // Should include "finish" variant
      expect(inputs.some((i) => i.includes("finish"))).toBe(true);

      // Should include "mark" variant
      expect(inputs.some((i) => i.includes("mark"))).toBe(true);
    });

    it("should all have task_id parameter", () => {
      COMPLETE_TASK_EXAMPLES.forEach((example) => {
        expect(example.parameters).toBeDefined();
        expect(example.parameters?.task_id).toBeDefined();
        expect(typeof example.parameters?.task_id).toBe("number");
      });
    });
  });

  describe("Delete Task Examples (AC-5)", () => {
    it("should have at least 5 examples", () => {
      expect(DELETE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have at least 10 examples for good coverage", () => {
      expect(DELETE_TASK_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should all have delete_task intent", () => {
      DELETE_TASK_EXAMPLES.forEach((example) => {
        expect(example.intent).toBe("delete_task");
      });
    });

    it("should include diverse phrasings", () => {
      const inputs = DELETE_TASK_EXAMPLES.map((e) => e.input.toLowerCase());

      // Should include "delete" variant
      expect(inputs.some((i) => i.includes("delete"))).toBe(true);

      // Should include "remove" variant
      expect(inputs.some((i) => i.includes("remove"))).toBe(true);

      // Should include "cancel" variant
      expect(inputs.some((i) => i.includes("cancel"))).toBe(true);

      // Should include informal variants
      expect(
        inputs.some((i) => i.includes("trash") || i.includes("get rid"))
      ).toBe(true);
    });

    it("should all have task_id parameter", () => {
      DELETE_TASK_EXAMPLES.forEach((example) => {
        expect(example.parameters).toBeDefined();
        expect(example.parameters?.task_id).toBeDefined();
        expect(typeof example.parameters?.task_id).toBe("number");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should include clarification needed examples", () => {
      const clarificationExamples = EDGE_CASE_EXAMPLES.filter((e) =>
        e.intent.includes("clarification")
      );
      expect(clarificationExamples.length).toBeGreaterThan(0);
    });

    it("should include refused intent examples", () => {
      const refusedExamples = EDGE_CASE_EXAMPLES.filter((e) =>
        e.intent.includes("refused")
      );
      expect(refusedExamples.length).toBeGreaterThan(0);
    });

    it("should cover all refused categories", () => {
      const intents = EDGE_CASE_EXAMPLES.map((e) => e.intent);

      expect(intents).toContain("refused_bulk_operation");
      expect(intents).toContain("refused_data_export");
      expect(intents).toContain("refused_authentication");
      expect(intents).toContain("refused_external_knowledge");
      expect(intents).toContain("refused_autonomous");
      expect(intents).toContain("refused_analytics");
    });

    it("should include statelessness tests", () => {
      const statelessTests = EDGE_CASE_EXAMPLES.filter(
        (e) =>
          e.input.includes("it") ||
          e.input.includes("the first") ||
          e.input.includes("the last")
      );
      expect(statelessTests.length).toBeGreaterThan(0);
    });
  });

  describe("Helper Functions", () => {
    it("should get examples by intent", () => {
      const addExamples = getExamplesByIntent("add_task");
      expect(addExamples.length).toBeGreaterThan(0);
      addExamples.forEach((example) => {
        expect(example.intent).toBe("add_task");
      });
    });

    it("should calculate example stats", () => {
      const stats = getExampleStats();
      expect(stats).toHaveProperty("add_task");
      expect(stats).toHaveProperty("list_tasks");
      expect(stats).toHaveProperty("update_task");
      expect(stats).toHaveProperty("complete_task");
      expect(stats).toHaveProperty("delete_task");

      expect(stats.add_task).toBeGreaterThanOrEqual(5);
      expect(stats.list_tasks).toBeGreaterThanOrEqual(5);
      expect(stats.update_task).toBeGreaterThanOrEqual(5);
      expect(stats.complete_task).toBeGreaterThanOrEqual(5);
      expect(stats.delete_task).toBeGreaterThanOrEqual(5);
    });

    it("should validate example coverage", () => {
      const validation = validateExampleCoverage();
      expect(validation.valid).toBe(true);
      expect(validation.message).toContain("at least 5 examples");
    });
  });

  describe("Overall Coverage", () => {
    it("should have at least 50 total examples", () => {
      expect(ALL_TRAINING_EXAMPLES.length).toBeGreaterThanOrEqual(50);
    });

    it("should have examples for all 5 core intents", () => {
      const intents = new Set(
        ALL_TRAINING_EXAMPLES.map((e) => e.intent).filter(
          (i) => !i.includes("refused") && !i.includes("clarification")
        )
      );

      expect(intents.has("add_task")).toBe(true);
      expect(intents.has("list_tasks")).toBe(true);
      expect(intents.has("update_task")).toBe(true);
      expect(intents.has("complete_task")).toBe(true);
      expect(intents.has("delete_task")).toBe(true);
    });

    it("should have unique inputs (no duplicates)", () => {
      const inputs = ALL_TRAINING_EXAMPLES.map((e) => e.input);
      const uniqueInputs = new Set(inputs);
      expect(uniqueInputs.size).toBe(inputs.length);
    });
  });
});
