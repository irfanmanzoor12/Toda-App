/**
 * HTTP Server for MCP Tools
 *
 * Exposes MCP tools via HTTP endpoints for Python backend integration.
 * Phase III requirement: Python FastAPI backend calls MCP tools via HTTP.
 *
 * Endpoints:
 * - POST /tools/add_task
 * - POST /tools/list_tasks
 * - POST /tools/complete_task
 * - POST /tools/delete_task
 * - POST /tools/update_task
 * - GET /health
 */

import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

// Import MCP skill executors
import {
  executeAddTask,
  ValidationError as AddTaskValidationError,
} from "./skills/add-task.js";
import { executeListTasks } from "./skills/list-tasks.js";
import {
  executeUpdateTask,
  ValidationError as UpdateTaskValidationError,
} from "./skills/update-task.js";
import {
  executeCompleteTask,
  ValidationError as CompleteTaskValidationError,
} from "./skills/complete-task.js";
import {
  executeDeleteTask,
  ValidationError as DeleteTaskValidationError,
} from "./skills/delete-task.js";

const PORT = parseInt(process.env.MCP_HTTP_PORT || "3003", 10);

/**
 * Create Express app with MCP tool endpoints
 */
export function createMCPHttpServer(): Express {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: "*", // Allow Python backend to call
      credentials: false,
    })
  );

  // Request logging
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "mcp-http-server",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // MCP Tool Endpoints

  /**
   * POST /tools/add_task
   * Body: { user_id: string, title: string, description?: string }
   */
  app.post("/tools/add_task", async (req: Request, res: Response) => {
    try {
      const { user_id, title, description } = req.body;

      // Build context with session token (user_id)
      const context = {
        sessionToken: user_id,
        user_id: user_id,
      };

      // Execute tool
      const result = await executeAddTask({ title, description }, context);

      res.json(result);
    } catch (error: any) {
      handleToolError(error, res);
    }
  });

  /**
   * POST /tools/list_tasks
   * Body: { user_id: string, status?: "all" | "pending" | "completed" }
   */
  app.post("/tools/list_tasks", async (req: Request, res: Response) => {
    try {
      const { user_id, status } = req.body;

      // Build context
      const context = {
        sessionToken: user_id,
        user_id: user_id,
        status: status || "all",
      };

      // Execute tool
      const result = await executeListTasks(context);

      res.json(result);
    } catch (error: any) {
      handleToolError(error, res);
    }
  });

  /**
   * POST /tools/complete_task
   * Body: { user_id: string, task_id: number }
   */
  app.post("/tools/complete_task", async (req: Request, res: Response) => {
    try {
      const { user_id, task_id } = req.body;

      // Build context
      const context = {
        sessionToken: user_id,
        user_id: user_id,
      };

      // Execute tool
      const result = await executeCompleteTask({ task_id }, context);

      res.json(result);
    } catch (error: any) {
      handleToolError(error, res);
    }
  });

  /**
   * POST /tools/delete_task
   * Body: { user_id: string, task_id: number }
   */
  app.post("/tools/delete_task", async (req: Request, res: Response) => {
    try {
      const { user_id, task_id } = req.body;

      // Build context
      const context = {
        sessionToken: user_id,
        user_id: user_id,
      };

      // Execute tool
      const result = await executeDeleteTask({ task_id }, context);

      res.json(result);
    } catch (error: any) {
      handleToolError(error, res);
    }
  });

  /**
   * POST /tools/update_task
   * Body: { user_id: string, task_id: number, title?: string, description?: string }
   */
  app.post("/tools/update_task", async (req: Request, res: Response) => {
    try {
      const { user_id, task_id, title, description } = req.body;

      // Build context
      const context = {
        sessionToken: user_id,
        user_id: user_id,
      };

      // Execute tool
      const result = await executeUpdateTask(
        { task_id, title, description },
        context
      );

      res.json(result);
    } catch (error: any) {
      handleToolError(error, res);
    }
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: "NotFound",
      message: `Endpoint ${req.method} ${req.path} not found`,
      statusCode: 404,
    });
  });

  return app;
}

/**
 * Handle tool execution errors
 */
function handleToolError(error: any, res: Response): void {
  console.error("Tool execution error:", error);

  // Validation errors
  if (
    error instanceof AddTaskValidationError ||
    error instanceof UpdateTaskValidationError ||
    error instanceof CompleteTaskValidationError ||
    error instanceof DeleteTaskValidationError ||
    error.name === "ValidationError"
  ) {
    res.status(400).json({
      error: "ValidationError",
      message: error.message,
      statusCode: 400,
    });
    return;
  }

  // Authentication errors
  if (error.name === "AuthenticationError") {
    res.status(401).json({
      error: "AuthenticationError",
      message: error.message,
      statusCode: 401,
    });
    return;
  }

  // Generic errors
  res.status(500).json({
    error: error.name || "InternalServerError",
    message: error.message || "An unexpected error occurred",
    statusCode: 500,
  });
}

/**
 * Start the HTTP server
 */
export function startMCPHttpServer(): void {
  const app = createMCPHttpServer();

  app.listen(PORT, () => {
    console.log(`✅ MCP HTTP Server started on http://localhost:${PORT}`);
    console.log(`   Available endpoints:`);
    console.log(`   - POST /tools/add_task`);
    console.log(`   - POST /tools/list_tasks`);
    console.log(`   - POST /tools/complete_task`);
    console.log(`   - POST /tools/delete_task`);
    console.log(`   - POST /tools/update_task`);
    console.log(`   - GET  /health`);
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMCPHttpServer();
}
