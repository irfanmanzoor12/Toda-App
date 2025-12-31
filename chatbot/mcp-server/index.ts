#!/usr/bin/env node

import { TodoChatbotMCPServer } from "./server.js";

/**
 * Entry point for Todo Chatbot MCP Server
 * Handles server lifecycle and graceful shutdown
 */

let server: TodoChatbotMCPServer;

async function main() {
  try {
    // Initialize server
    server = new TodoChatbotMCPServer();

    // Setup graceful shutdown handlers
    setupShutdownHandlers();

    // Start the server
    await server.start();

    // Server is now running and will handle requests via stdio
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

/**
 * Setup handlers for graceful shutdown on SIGTERM and SIGINT
 */
function setupShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      if (server) {
        await server.shutdown();
      }
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  // Handle SIGTERM (docker stop, kubernetes)
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
    shutdown("unhandledRejection");
  });
}

// Start the server
main();
