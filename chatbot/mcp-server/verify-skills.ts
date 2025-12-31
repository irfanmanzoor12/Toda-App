/**
 * Verification script to confirm all 5 MCP skills are properly imported
 */
import { addTaskTool } from "./skills/add-task.js";
import { listTasksTool } from "./skills/list-tasks.js";
import { updateTaskTool } from "./skills/update-task.js";
import { completeTaskTool } from "./skills/complete-task.js";
import { deleteTaskTool } from "./skills/delete-task.js";
import { TodoChatbotMCPServer } from "./server.js";

function verifySkills() {
  console.log("Verifying MCP Skills Registration...\n");

  try {
    // Verify all skill tools are imported
    const skills = [
      { name: "add_task", tool: addTaskTool },
      { name: "list_tasks", tool: listTasksTool },
      { name: "update_task", tool: updateTaskTool },
      { name: "complete_task", tool: completeTaskTool },
      { name: "delete_task", tool: deleteTaskTool },
    ];

    console.log("Skill Tool Definitions:");
    console.log("======================");

    for (const skill of skills) {
      if (!skill.tool) {
        throw new Error(`Skill ${skill.name} is not defined`);
      }
      if (skill.tool.name !== skill.name) {
        throw new Error(
          `Skill name mismatch: expected ${skill.name}, got ${skill.tool.name}`
        );
      }
      if (!skill.tool.description) {
        throw new Error(`Skill ${skill.name} is missing description`);
      }
      if (!skill.tool.inputSchema) {
        throw new Error(`Skill ${skill.name} is missing inputSchema`);
      }

      console.log(`✓ ${skill.name}`);
      console.log(`  Description: ${skill.tool.description.substring(0, 60)}...`);
      console.log(
        `  Required params: ${skill.tool.inputSchema.required?.join(", ") || "none"}`
      );
      console.log();
    }

    // Verify server can be instantiated
    const server = new TodoChatbotMCPServer();
    console.log("✓ MCP Server instance created successfully");

    const metadata = server.getMetadata();
    console.log(`✓ Server: ${metadata.name} v${metadata.version}`);

    console.log(`\n✓ All 5 MCP skills verified successfully!`);
    console.log("\nSkills registered:");
    skills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Skill verification failed:", error);
    process.exit(1);
  }
}

verifySkills();
