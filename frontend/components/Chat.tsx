'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { apiCall } from '@/lib/api';
import './Chat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls?: string[];
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

class ChatAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: string
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

async function sendMessage(
  userId: string,
  message: string,
  conversationId?: number
): Promise<ChatResponse> {
  try {
    // Use apiCall which automatically adds JWT Authorization header
    return await apiCall<ChatResponse>(`/api/${userId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });
  } catch (error: any) {
    throw new ChatAPIError(
      error.message || 'An error occurred',
      500,
      'ServerError'
    );
  }
}

export default function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    if (trimmedMessage.length > 500) {
      addMessage(
        'assistant',
        'Message is too long. Maximum 500 characters allowed.',
        true
      );
      return;
    }

    addMessage('user', trimmedMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use session.user.id as the user identifier (same as /todos page)
      const userId = session?.user?.id || 'demo-user';
      const response = await sendMessage(userId, trimmedMessage, conversationId);

      // Store conversation_id for subsequent messages
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Add assistant response
      let assistantMessage = response.response;

      // Append tool calls if any
      if (response.tool_calls && response.tool_calls.length > 0) {
        assistantMessage += `\n\n🔧 Tools used: ${response.tool_calls.join(', ')}`;
      }

      addMessage('assistant', assistantMessage);
    } catch (error) {
      if (error instanceof ChatAPIError) {
        let errorMessage = error.message;

        if (error.statusCode === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.statusCode === 0) {
          errorMessage = 'Cannot connect to the server. Please check your connection.';
        }

        addMessage('assistant', errorMessage, true);
      } else {
        addMessage(
          'assistant',
          'An unexpected error occurred. Please try again.',
          true
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (
    role: 'user' | 'assistant',
    content: string,
    error: boolean = false
  ): string => {
    const id = `msg-${Date.now()}-${Math.random()}`;
    const newMessage: Message = {
      id,
      role,
      content,
      error,
    };

    setMessages((prev) => {
      const newMessages = [...prev, newMessage];
      return newMessages.slice(-10);
    });

    return id;
  };

  const clearMessages = () => {
    setMessages([]);
    setConversationId(undefined); // Start new conversation
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Todo Chatbot</h1>
        <button
          onClick={clearMessages}
          className="clear-button"
          title="Clear messages"
        >
          Clear
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Welcome to Todo Chatbot!</p>
            <p>I can help you manage your tasks. Try saying:</p>
            <ul>
              <li>"Add a task to buy groceries"</li>
              <li>"List my tasks"</li>
              <li>"Complete task 5"</li>
              <li>"Delete task 3"</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role} ${message.error ? 'error' : ''}`}
          >
            <div className="message-role">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="message-role">Assistant</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder='Type a message... (e.g., "Add task: buy groceries" or "List my tasks")'
          disabled={isLoading}
          className="chat-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>

      <div className="chat-footer">
        <p className="stateless-notice">
          Stateless mode: Each message is independent. Use explicit task IDs.
        </p>
      </div>
    </div>
  );
}
