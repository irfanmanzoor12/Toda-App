/**
 * Quick verification script for MCP server
 * Tests server initialization and metadata
 */
import { TodoChatbotMCPServer } from "./server.js";

async function testServer() {
  console.log("Testing MCP Server initialization...\n");

  try {
    // Create server instance
    const server = new TodoChatbotMCPServer();
    console.log("✓ Server instance created successfully");

    // Check metadata
    const metadata = server.getMetadata();
    console.log("✓ Server metadata:", metadata);

    if (metadata.name !== "todo-chatbot-mcp") {
      throw new Error(`Expected name 'todo-chatbot-mcp', got '${metadata.name}'`);
    }
    console.log("✓ Server name is correct");

    if (metadata.version !== "1.0.0") {
      throw new Error(`Expected version '1.0.0', got '${metadata.version}'`);
    }
    console.log("✓ Server version is correct");

    console.log("\n✓ All server initialization tests passed!");
    console.log("\nNote: Full server startup test requires stdio transport.");
    console.log("Use 'npm run start:mcp' to start the server with stdio transport.");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Server test failed:", error);
    process.exit(1);
  }
}

testServer();
