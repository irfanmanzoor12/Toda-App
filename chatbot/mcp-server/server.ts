import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import all MCP skills
import {
  addTaskTool,
  executeAddTask,
  ValidationError as AddTaskValidationError,
} from "./skills/add-task.js";
import { listTasksTool, executeListTasks } from "./skills/list-tasks.js";
import {
  updateTaskTool,
  executeUpdateTask,
  ValidationError as UpdateTaskValidationError,
} from "./skills/update-task.js";
import {
  completeTaskTool,
  executeCompleteTask,
  ValidationError as CompleteTaskValidationError,
} from "./skills/complete-task.js";
import {
  deleteTaskTool,
  executeDeleteTask,
  ValidationError as DeleteTaskValidationError,
} from "./skills/delete-task.js";

/**
 * MCP Server for Todo Chatbot
 * Implements 5 skills: add_task, list_tasks, update_task, complete_task, delete_task
 */
export class TodoChatbotMCPServer {
  private server: Server;
  private readonly serverName = "todo-chatbot-mcp";
  private readonly serverVersion = "1.0.0";

  constructor() {
    this.server = new Server(
      {
        name: this.serverName,
        version: this.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup request handlers for MCP server
   */
  private setupHandlers(): void {
    // List available tools (skills)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "health",
            description: "Health check endpoint",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          addTaskTool,
          listTasksTool,
          updateTaskTool,
          completeTaskTool,
          deleteTaskTool,
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Health check endpoint
        if (name === "health") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "healthy",
                  server: this.serverName,
                  version: this.serverVersion,
                  timestamp: new Date().toISOString(),
                }),
              },
            ],
          };
        }

        // Extract context from request metadata
        const context = request.params._meta || {};

        // Execute skills
        let result;
        switch (name) {
          case "add_task":
            result = await executeAddTask(args as any, context);
            break;

          case "list_tasks":
            result = await executeListTasks(context);
            break;

          case "update_task":
            result = await executeUpdateTask(args as any, context);
            break;

          case "complete_task":
            result = await executeCompleteTask(args as any, context);
            break;

          case "delete_task":
            result = await executeDeleteTask(args as any, context);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Return result as MCP response
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        // Handle validation errors
        if (
          error instanceof AddTaskValidationError ||
          error instanceof UpdateTaskValidationError ||
          error instanceof CompleteTaskValidationError ||
          error instanceof DeleteTaskValidationError ||
          error.name === "ValidationError"
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "ValidationError",
                  message: error.message,
                }),
              },
            ],
            isError: true,
          };
        }

        // Handle authentication errors
        if (error.name === "AuthenticationError") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "AuthenticationError",
                  message: error.message,
                }),
              },
            ],
            isError: true,
          };
        }

        // Handle all other errors
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.name || "Error",
                message: error.message || "An unexpected error occurred",
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error(
      `${this.serverName} v${this.serverVersion} started successfully`
    );
    console.error("Server is ready to accept requests via stdio");
  }

  /**
   * Graceful shutdown handler
   */
  async shutdown(): Promise<void> {
    console.error("Shutting down MCP server...");
    await this.server.close();
    console.error("Server shut down gracefully");
  }

  /**
   * Get server metadata
   */
  getMetadata() {
    return {
      name: this.serverName,
      version: this.serverVersion,
    };
  }
}
