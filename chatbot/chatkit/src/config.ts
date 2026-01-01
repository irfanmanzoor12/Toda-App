/**
 * ChatKit Configuration
 *
 * Configuration for the Todo Chatbot chat interface
 */

export const CHAT_CONFIG = {
  /**
   * API endpoint for chat requests
   */
  apiEndpoint: '/api/chat',

  /**
   * Stateless mode - no conversation history
   * Per spec Section 6.1
   */
  stateless: true,

  /**
   * Maximum message length
   */
  maxMessageLength: 500,

  /**
   * Placeholder text for input
   */
  placeholder: 'Type a message... (e.g., "Add task: buy groceries" or "List my tasks")',

  /**
   * UI settings
   */
  ui: {
    title: 'Todo Chatbot',
    showTimestamps: false, // Stateless - no history
    autoScroll: true,
    theme: 'light',
  },

  /**
   * Session token configuration
   * Token will be extracted from Better Auth session
   */
  auth: {
    tokenSource: 'better-auth', // Will implement in T321
    requireAuth: true,
  },
};

export default CHAT_CONFIG;
