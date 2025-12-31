/**
 * Agent API Server
 *
 * Express server that hosts the chat endpoint for agent invocation
 *
 * Reference: T319 (Implement Chat API Endpoint)
 */

import express, { Express } from "express";
import cors from "cors";
import { handleChatRequest, handleHealthCheck } from "./chat-endpoint.js";

/**
 * Create and configure Express app
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Request logging middleware
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.get("/api/health", handleHealthCheck);
  app.post("/api/chat", handleChatRequest);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "NotFound",
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    });
  });

  return app;
}

/**
 * Start the server
 */
export function startServer(port: number = 3001): void {
  const app = createApp();

  app.listen(port, () => {
    console.log(`\n✓ Todo Chatbot Agent API Server started`);
    console.log(`✓ Port: ${port}`);
    console.log(`✓ Health check: http://localhost:${port}/api/health`);
    console.log(`✓ Chat endpoint: POST http://localhost:${port}/api/chat`);
    console.log(`\nServer is ready to accept requests\n`);
  });
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || "3001", 10);
  startServer(port);
}
