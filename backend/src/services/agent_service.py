"""Agent Service for Phase III.

Uses OpenAI SDK to process chat messages with MCP tool integration.
Implements stateless agent that uses conversation history for context.
"""

import os
import json
from typing import List, Dict, Any, Optional
import httpx
from openai import OpenAI


class MCPToolError(Exception):
    """Exception raised when MCP tool execution fails."""
    pass


class AgentService:
    """Service for AI agent processing with MCP tools."""

    def __init__(self):
        """Initialize OpenAI client and MCP configuration."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = OpenAI(api_key=api_key)
        self.mcp_server_url = os.getenv("MCP_SERVER_URL", "http://localhost:3003")

        # MCP Tools configuration (matching spec requirements)
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "add_task",
                    "description": "Create a new task with a title and optional description",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Task title (1-200 characters)"
                            },
                            "description": {
                                "type": "string",
                                "description": "Task description (optional, 0-1000 characters)"
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "Retrieve tasks from the list",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["all", "pending", "completed"],
                                "description": "Filter tasks by status (default: all)"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as complete",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "ID of the task to complete"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Remove a task from the list",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "ID of the task to delete"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_task",
                    "description": "Modify task title or description",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "ID of the task to update"
                            },
                            "title": {
                                "type": "string",
                                "description": "New task title (optional)"
                            },
                            "description": {
                                "type": "string",
                                "description": "New task description (optional)"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            }
        ]

    async def process_message(
        self,
        user_id: str,
        message: str,
        conversation_history: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Process user message with AI agent.

        Args:
            user_id: User identifier for MCP tool calls
            message: User's message
            conversation_history: Previous messages in conversation

        Returns:
            Dict with 'response' and 'tool_calls' keys
        """
        # Build messages array: history + new user message
        messages = conversation_history + [{"role": "user", "content": message}]

        # Add system message if this is the start of conversation
        if len(conversation_history) == 0:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful todo assistant. You can help users manage their tasks "
                        "through natural language. Use the available tools to create, list, complete, "
                        "delete, and update tasks. Always confirm actions with friendly responses."
                    )
                }
            ] + messages

        # Call OpenAI with tools
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
            )

            assistant_message = response.choices[0].message
            tool_calls_made = []

            # Handle tool calls if any
            if assistant_message.tool_calls:
                # Execute each tool call via MCP server
                for tool_call in assistant_message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)

                    # Add user_id to tool arguments
                    tool_args["user_id"] = user_id

                    # Execute tool via MCP server
                    tool_result = await self._execute_mcp_tool(tool_name, tool_args)

                    tool_calls_made.append({
                        "tool": tool_name,
                        "arguments": tool_args,
                        "result": tool_result
                    })

                # Get final response from agent after tool execution
                # Add tool results to conversation
                messages.append({
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in assistant_message.tool_calls
                    ]
                })

                for idx, tool_call in enumerate(assistant_message.tool_calls):
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_calls_made[idx]["result"])
                    })

                # Get natural language response
                final_response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=messages,
                )

                response_text = final_response.choices[0].message.content

            else:
                # No tool calls, just use the assistant's response
                response_text = assistant_message.content

            return {
                "response": response_text or "I'm here to help with your tasks!",
                "tool_calls": [tc["tool"] for tc in tool_calls_made] if tool_calls_made else []
            }

        except Exception as e:
            print(f"Error in agent processing: {e}")
            raise

    async def _execute_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP tool via HTTP.

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments including user_id

        Returns:
            Tool execution result

        Raises:
            MCPToolError: If tool execution fails
        """
        async with httpx.AsyncClient() as client:
            try:
                # Call MCP server endpoint
                # The MCP server should expose endpoints for each tool
                response = await client.post(
                    f"{self.mcp_server_url}/tools/{tool_name}",
                    json=arguments,
                    timeout=30.0
                )

                if response.status_code != 200:
                    raise MCPToolError(
                        f"Tool {tool_name} failed with status {response.status_code}: {response.text}"
                    )

                return response.json()

            except httpx.RequestError as e:
                raise MCPToolError(f"Failed to call MCP tool {tool_name}: {str(e)}")
