/**
 * Agent Runtime
 *
 * Integrates OpenAI API with MCP skills to process user messages
 * and execute task operations.
 *
 * Reference: Spec Section 4 (Agent Responsibilities)
 */

import OpenAI from "openai";
import { AGENT_CONFIG } from "../config/index.js";
import { executeAddTask } from "../../mcp-server/skills/add-task.js";
import { executeListTasks } from "../../mcp-server/skills/list-tasks.js";
import { executeUpdateTask } from "../../mcp-server/skills/update-task.js";
import { executeCompleteTask } from "../../mcp-server/skills/complete-task.js";
import { executeDeleteTask } from "../../mcp-server/skills/delete-task.js";

/**
 * Agent request input
 */
export interface AgentRequest {
  message: string;
  sessionToken: string;
}

/**
 * Agent response output
 */
export interface AgentResponse {
  response: string;
  toolsUsed?: string[];
}

/**
 * Agent Runtime Error
 */
export class AgentRuntimeError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AgentRuntimeError";
  }
}

/**
 * Todo Chatbot Agent Runtime
 *
 * Processes user messages using OpenAI with access to MCP skills
 */
export class TodoChatbotAgent {
  private openai: OpenAI;
  private model: string;
  private systemPrompt: string;

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      throw new AgentRuntimeError(
        "OpenAI API key is required. Set OPENAI_API_KEY environment variable.",
        500
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    this.model = AGENT_CONFIG.model;
    this.systemPrompt = AGENT_CONFIG.systemPrompt;
  }

  /**
   * Process a user message and return agent response
   */
  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    // Validate session token
    if (!request.sessionToken || request.sessionToken.trim().length === 0) {
      throw new AgentRuntimeError(
        "Session token is required for authentication",
        401
      );
    }

    // Validate message
    if (!request.message || request.message.trim().length === 0) {
      throw new AgentRuntimeError("Message cannot be empty", 400);
    }

    try {
      // Create MCP context with session token
      const mcpContext = {
        sessionToken: request.sessionToken,
      };

      // Define available tools for OpenAI
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "add_task",
            description:
              "Create a new task with a title and optional description. The task will be added to the authenticated user's todo list.",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description:
                    "The title of the task (required, 1-200 characters)",
                },
                description: {
                  type: "string",
                  description:
                    "Optional description for the task (0-1000 characters)",
                },
              },
              required: ["title"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "list_tasks",
            description:
              "Retrieve all tasks for the authenticated user. Returns a list of tasks with their IDs, titles, descriptions, completion status, and timestamps.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "update_task",
            description:
              "Update the title and/or description of an existing task. At least one of title or description must be provided. The task must belong to the authenticated user.",
            parameters: {
              type: "object",
              properties: {
                task_id: {
                  type: "number",
                  description: "The ID of the task to update (required)",
                },
                title: {
                  type: "string",
                  description: "New title for the task (optional, 1-200 characters)",
                },
                description: {
                  type: "string",
                  description:
                    "New description for the task (optional, 0-1000 characters)",
                },
              },
              required: ["task_id"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "complete_task",
            description:
              "Mark a task as completed. Sets the is_completed status to true. The task must belong to the authenticated user.",
            parameters: {
              type: "object",
              properties: {
                task_id: {
                  type: "number",
                  description: "The ID of the task to complete (required)",
                },
              },
              required: ["task_id"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "delete_task",
            description:
              "Permanently delete a task. The task cannot be recovered after deletion. The task must belong to the authenticated user.",
            parameters: {
              type: "object",
              properties: {
                task_id: {
                  type: "number",
                  description: "The ID of the task to delete (required)",
                },
              },
              required: ["task_id"],
            },
          },
        },
      ];

      // Call OpenAI with tools
      let response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: request.message },
        ],
        tools: tools,
        tool_choice: "auto",
        temperature: AGENT_CONFIG.temperature,
        max_tokens: AGENT_CONFIG.responseConfig.maxTokens,
      });

      const toolsUsed: string[] = [];
      let assistantMessage = response.choices[0].message;

      // Handle tool calls (may require multiple rounds)
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: request.message },
          assistantMessage,
        ];

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          // Only handle function tool calls
          if (toolCall.type !== "function") continue;

          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          toolsUsed.push(functionName);

          let result: any;
          try {
            // Execute MCP skill
            result = await this.executeSkill(
              functionName,
              functionArgs,
              mcpContext
            );
          } catch (error: any) {
            // Return error to agent so it can provide user-friendly message
            result = {
              error: true,
              message: error.message || "An error occurred",
            };
          }

          // Add tool result to messages
          toolMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // Get agent's response after tool execution
        response = await this.openai.chat.completions.create({
          model: this.model,
          messages: toolMessages,
          tools: tools,
          tool_choice: "auto",
          temperature: AGENT_CONFIG.temperature,
          max_tokens: AGENT_CONFIG.responseConfig.maxTokens,
        });

        assistantMessage = response.choices[0].message;
      }

      // Return final response
      return {
        response: assistantMessage.content || "I apologize, but I couldn't generate a response.",
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      };
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error.status === 401) {
        throw new AgentRuntimeError("Invalid OpenAI API key", 500);
      }

      if (error.status === 429) {
        throw new AgentRuntimeError(
          "Rate limit exceeded. Please try again later.",
          429
        );
      }

      // Re-throw if already AgentRuntimeError
      if (error instanceof AgentRuntimeError) {
        throw error;
      }

      // Generic error
      throw new AgentRuntimeError(
        error.message || "Failed to process message",
        500
      );
    }
  }

  /**
   * Execute an MCP skill
   */
  private async executeSkill(
    skillName: string,
    args: any,
    context: Record<string, unknown>
  ): Promise<any> {
    switch (skillName) {
      case "add_task":
        return await executeAddTask(args, context);

      case "list_tasks":
        return await executeListTasks(context);

      case "update_task":
        return await executeUpdateTask(args, context);

      case "complete_task":
        return await executeCompleteTask(args, context);

      case "delete_task":
        return await executeDeleteTask(args, context);

      default:
        throw new Error(`Unknown skill: ${skillName}`);
    }
  }
}
