/**
 * Chat API Endpoint
 *
 * HTTP endpoint that accepts user messages, invokes the agent,
 * and returns responses.
 *
 * Reference: Spec Section 8.1 (Opaque Token Handling)
 */

import { Request, Response } from "express";
import { TodoChatbotAgent, AgentRuntimeError } from "../runtime/agent-runtime.js";

/**
 * Chat request body schema
 */
export interface ChatRequestBody {
  message: string;
  session_token: string;
}

/**
 * Chat response schema
 */
export interface ChatResponseBody {
  response: string;
  toolsUsed?: string[];
}

/**
 * Error response schema
 */
export interface ErrorResponseBody {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Chat endpoint handler
 *
 * POST /api/chat
 * Body: { message: string, session_token: string }
 * Returns: { response: string }
 */
export async function handleChatRequest(
  req: Request<{}, ChatResponseBody | ErrorResponseBody, ChatRequestBody>,
  res: Response<ChatResponseBody | ErrorResponseBody>
): Promise<void> {
  try {
    // Validate request body
    const { message, session_token } = req.body;

    if (!message) {
      res.status(400).json({
        error: "BadRequest",
        message: "Message is required",
        statusCode: 400,
      });
      return;
    }

    if (!session_token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Session token is required for authentication",
        statusCode: 401,
      });
      return;
    }

    // Validate types
    if (typeof message !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Message must be a string",
        statusCode: 400,
      });
      return;
    }

    if (typeof session_token !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Session token must be a string",
        statusCode: 400,
      });
      return;
    }

    // Create agent and process message
    const agent = new TodoChatbotAgent();
    const result = await agent.processMessage({
      message: message.trim(),
      sessionToken: session_token,
    });

    // Return response
    res.status(200).json({
      response: result.response,
      toolsUsed: result.toolsUsed,
    });
  } catch (error: any) {
    // Handle agent runtime errors
    if (error instanceof AgentRuntimeError) {
      res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
      return;
    }

    // Handle unexpected errors
    console.error("Unexpected error in chat endpoint:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    });
  }
}

/**
 * Health check endpoint
 *
 * GET /api/health
 * Returns: { status: "healthy", timestamp: string }
 */
export function handleHealthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    status: "healthy",
    service: "todo-chatbot-agent-api",
    timestamp: new Date().toISOString(),
  });
}
