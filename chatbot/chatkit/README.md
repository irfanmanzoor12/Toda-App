# Todo Chatbot ChatKit

React-based chat interface for the AI-powered Todo Chatbot.

## Features

- ✓ Clean, modern chat UI
- ✓ Stateless conversation (per spec Section 6.1)
- ✓ Real-time message display
- ✓ Error handling and user feedback
- ✓ Responsive design
- ✓ Integration with agent API endpoint
- ✓ Loading states and typing indicators

## Getting Started

### Installation

From the `chatkit` directory:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The UI will be available at `http://localhost:3300`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Configuration

Configuration is in `src/config.ts`:

```typescript
export const CHAT_CONFIG = {
  apiEndpoint: '/api/chat',      // Agent API endpoint
  stateless: true,               // No conversation history
  maxMessageLength: 500,         // Max chars per message
  placeholder: '...',            // Input placeholder text
  ui: {
    title: 'Todo Chatbot',
    showTimestamps: false,       // Stateless - no history
    autoScroll: true,
    theme: 'light',
  }
};
```

## Architecture

```
chatkit/
├── src/
│   ├── components/
│   │   ├── Chat.tsx        # Main chat component
│   │   └── Chat.css        # Chat styling
│   ├── utils/
│   │   └── api-client.ts   # API communication
│   ├── config.ts           # Configuration
│   ├── App.tsx             # Root component
│   ├── App.css             # Global styles
│   └── main.tsx            # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
└── package.json
```

## Stateless Mode

Per spec Section 6.1, the chatbot operates in stateless mode:

- ✓ Each message is independent
- ✓ No conversation history retained
- ✓ No context carryover between messages
- ✓ Users must provide complete information in each message

**Example:**
```
User: "Add a task to buy milk"
Bot: "✓ Task created: [ID 5] buy milk"

User: "Delete it"
Bot: "I need a task ID to delete. Which task should I remove?"
```

The UI displays recent messages for user convenience, but they are NOT sent to the backend as conversation context.

## API Integration

The ChatKit communicates with the agent API endpoint:

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "message": "Add a task to buy groceries",
  "session_token": "user-session-token"
}
```

**Response:**
```json
{
  "response": "✓ Task created: [ID 5] buy groceries",
  "toolsUsed": ["add_task"]
}
```

The API is proxied through Vite during development (see `vite.config.ts`).

## Session Token

**Note:** Currently uses a demo token (`demo-token`).

**T321 (next task)** will implement:
- Better Auth integration
- Real session token extraction
- Authentication flow
- Token refresh handling

## User Interface

### Chat Header
- Title: "Todo Chatbot"
- Clear button to reset UI

### Message Display
- User messages: Blue background, right-aligned
- Assistant messages: White background, left-aligned
- Error messages: Red background
- Loading indicator: Animated typing dots

### Input Area
- Text input with character limit
- Send button (disabled when loading)
- Stateless mode notice

### Welcome Screen
Shows helpful examples when no messages:
- "Add a task to buy groceries"
- "List my tasks"
- "Complete task 5"
- "Delete task 3"

## Error Handling

The UI handles errors gracefully:

**Network Errors:**
```
Cannot connect to the server. Please check your connection.
```

**Authentication Errors (401):**
```
Your session has expired. Please log in again.
```

**Server Errors (500):**
```
An unexpected error occurred. Please try again.
```

**Validation Errors:**
Displays the specific error message from the API.

## Styling

Uses modern CSS with:
- Flexbox layout
- Smooth animations
- Responsive design
- Custom scrollbars
- Focus states for accessibility

Colors:
- Primary: `#2563eb` (Blue)
- Background: `#f9fafb` (Light gray)
- White: `#ffffff`
- Error: `#fee2e2` (Light red)

## Development

### Proxy Configuration

Development server proxies `/api/*` requests to agent API:

```typescript
// vite.config.ts
server: {
  port: 3300,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

### TypeScript

Full TypeScript support with strict mode enabled.

Type definitions in `src/utils/api-client.ts`:
- `ChatRequest`
- `ChatResponse`
- `ErrorResponse`
- `ChatAPIError`

## Acceptance Criteria

From T320:

- ✓ ChatKit SDK installed and imported (React + Vite)
- ✓ ChatKit configured to call `/api/chat` endpoint
- ✓ Default UI renders conversational interface
- ✓ Stateless mode enforced (no conversation history)
- ✓ User can send messages and receive responses
- ✓ Basic error display for failed requests

## Future Enhancements (T321-T322)

**T321: Better Auth Integration**
- Extract real session token
- Handle authentication flow
- Token refresh
- Login/logout

**T322: Response Formatting**
- Format task lists with checkboxes
- Highlight task IDs
- Visual distinction for completed tasks
- Rich text formatting

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest

## Performance

- Lightweight bundle (~200KB gzipped)
- Fast initial load
- Smooth animations (60fps)
- Efficient re-renders with React
