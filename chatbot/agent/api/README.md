# Todo Chatbot Agent API

HTTP API for invoking the AI-powered todo chatbot agent.

## Endpoints

### POST /api/chat

Process a user message and return the agent's response.

**Request:**
```json
{
  "message": "Add a task to buy groceries",
  "session_token": "your-session-token-here"
}
```

**Response (Success):**
```json
{
  "response": "✓ Task created: [ID 5] buy groceries",
  "toolsUsed": ["add_task"]
}
```

**Response (Error - 400):**
```json
{
  "error": "BadRequest",
  "message": "Message is required",
  "statusCode": 400
}
```

**Response (Error - 401):**
```json
{
  "error": "Unauthorized",
  "message": "Session token is required for authentication",
  "statusCode": 401
}
```

**Response (Error - 500):**
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Please try again later.",
  "statusCode": 500
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "todo-chatbot-agent-api",
  "timestamp": "2025-12-31T18:00:00.000Z"
}
```

## Running the Server

### Development Mode
```bash
npm run dev:agent
```

The server will start on port 3001 (configurable via `PORT` environment variable) and will auto-reload on file changes.

### Production Mode
```bash
# Build first
npm run build

# Then start
npm run start:agent
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional:
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `PHASE_2_API_BASE_URL` - Phase II backend URL (default: http://localhost:8000)

## Configuration

The agent uses configuration from `agent/config/`:
- `system-prompt.ts` - Agent's system prompt and behavior rules
- `agent-config.ts` - Model settings, response format, error templates
- `training-examples.ts` - Intent detection examples

## Architecture

```
agent/
├── api/
│   ├── chat-endpoint.ts    # POST /api/chat handler
│   ├── server.ts            # Express server setup
│   └── README.md            # This file
├── runtime/
│   └── agent-runtime.ts     # OpenAI agent integration with MCP skills
└── config/
    ├── system-prompt.ts     # System prompt and rules
    ├── agent-config.ts      # Agent configuration
    └── training-examples.ts # Training data
```

## Request Flow

1. Client sends POST to `/api/chat` with message and session token
2. `chat-endpoint.ts` validates request
3. `TodoChatbotAgent` processes message using OpenAI API
4. Agent invokes MCP skills as needed (add_task, list_tasks, etc.)
5. MCP skills call Phase II backend with session token
6. Agent formats response based on skill results
7. Response returned to client as JSON

## Error Handling

The API handles errors at multiple levels:

### Request Validation (400)
- Missing message
- Missing session token
- Invalid types

### Authentication (401)
- Invalid session token (from Phase II backend)
- Expired session token

### Agent Errors (500)
- OpenAI API failures
- Skill execution errors
- Unexpected runtime errors

All errors return JSON with:
```json
{
  "error": "ErrorType",
  "message": "User-friendly error message",
  "statusCode": 400|401|500
}
```

## Testing

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Test the chat endpoint (requires valid session token):
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "List my tasks",
    "session_token": "your-session-token"
  }'
```

## Security

- Session tokens treated as opaque strings (not parsed)
- Tokens passed directly to Phase II backend for validation
- CORS configured to allow only frontend origin
- Request body size limited to 1MB
- No session token logging or exposure

## Stateless Design

Per spec requirements:
- No conversation history retained
- Each request processed independently
- No context carryover between messages
- Agent cannot reference previous messages

## Integration with Phase II

The agent API integrates with existing Phase II backend:
- Uses Phase II's `/api/todos` endpoints
- Respects Phase II's authentication via session tokens
- Honors Phase II's authorization rules
- Does not modify Phase II code
