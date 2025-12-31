# Agent Configuration

This directory contains the system prompt, conversation rules, and agent configuration for the Todo Chatbot AI agent.

## Files

### `system-prompt.ts`
Contains the comprehensive system prompt that defines:
- Agent's role and purpose
- Supported capabilities (5 core operations)
- Unsupported/refused intents
- Conversation rules (statelessness, clarification, no assumptions)
- Error handling guidelines
- Parameter extraction rules

### `agent-config.ts`
Main configuration file that includes:
- Model settings (GPT-4 mini, temperature 0.3)
- System prompt integration
- MCP skill mapping
- Intent detection configuration
- Parameter extraction rules
- Error templates
- Clarification prompts
- Response formatting utilities

### `index.ts`
Exports all configuration and helper utilities.

## Usage

### Import System Prompt
```typescript
import { SYSTEM_PROMPT } from './agent/config';
```

### Import Full Configuration
```typescript
import AGENT_CONFIG from './agent/config';
```

### Use Helper Functions
```typescript
import {
  getClarificationPrompt,
  getErrorMessage,
  formatTaskList
} from './agent/config';

// Get clarification message
const message = getClarificationPrompt('missingTaskId', { action: 'complete' });
// Returns: "I need a task ID to complete. Which task should I complete?"

// Format task list
const formatted = formatTaskList(tasks);
// Returns formatted task list with IDs and status
```

## Configuration Details

### Model Settings
- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Temperature**: `0.3` (low for consistent responses)
- **Max Tokens**: `500` (concise responses)

### Conversation Rules
- **Stateless**: Each message processed independently
- **Explicit Task IDs**: No assumptions about which task user means
- **No Context Carryover**: Cannot reference previous messages
- **Ask for Clarification**: When information is missing or ambiguous

### Supported Intents
1. **add_task**: Create new task
2. **list_tasks**: Show all tasks
3. **update_task**: Modify task title/description
4. **complete_task**: Mark task as done
5. **delete_task**: Permanently remove task

### Refused Intents
- Authentication operations (login, register, etc.)
- Data export/import
- Bulk operations (complete all, delete all)
- External knowledge requests (weather, web search)
- Autonomous actions (reminders, suggestions)
- Analytics/reporting

### Error Handling
All errors are translated into user-friendly messages:
- **400 (Missing Info)**: Specify what's missing with example
- **404 (Not Found)**: Suggest listing tasks to see IDs
- **401 (Auth)**: Direct to web app to re-authenticate
- **500 (Server)**: Generic "try again" message

### Response Format
Tasks are displayed in consistent format:
```
Here are your tasks:
1. [ID 3] Buy groceries (Pending)
2. [ID 5] Finish report (Completed)
3. [ID 8] Call dentist (Pending)
```

## Compliance

This configuration implements all requirements from:
- **Spec Section 2**: Supported User Intents
- **Spec Section 3**: Unsupported/Refused Intents
- **Spec Section 4**: Agent Responsibilities
- **Spec Section 6**: Conversation Rules
- **Spec Section 7**: Error Handling Model

## Testing

To verify the configuration:
```bash
npm run test:config
```

This will validate:
- System prompt is properly formatted
- All intent patterns are defined
- Error templates have required placeholders
- Helper functions work correctly
