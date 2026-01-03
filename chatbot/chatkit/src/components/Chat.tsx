/**
 * Chat Component
 *
 * Main chat interface for the Todo Chatbot
 * Implements stateless conversation per spec Section 6.1
 */

import { useState, useEffect } from 'react';
import { sendMessage, ChatAPIError } from '../utils/api-client';
import { CHAT_CONFIG } from '../config';
import './Chat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('demo-token');

  // Fetch session from Better Auth API
  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/get-session', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        // Extract session token from Better Auth
        // The backend uses the session token as the user_id (opaque token)
        if (data?.session?.token) {
          console.log('✓ Using Better Auth session token');
          setSessionToken(data.session.token);
        } else {
          console.warn('⚠ No session found, using demo-token');
        }
      } else {
        console.warn('⚠ Not authenticated, using demo-token');
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      console.warn('Falling back to demo-token');
    }
  };

  // Fetch session on component mount
  useEffect(() => {
    fetchSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Validate message length
    if (trimmedMessage.length > CHAT_CONFIG.maxMessageLength) {
      addMessage(
        'assistant',
        `Message is too long. Maximum ${CHAT_CONFIG.maxMessageLength} characters allowed.`,
        true
      );
      return;
    }

    // Add user message
    const userMessageId = addMessage('user', trimmedMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to API
      const response = await sendMessage(trimmedMessage, sessionToken);

      // Add assistant response
      addMessage('assistant', response.response);
    } catch (error) {
      if (error instanceof ChatAPIError) {
        // Handle specific error types
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
      // Stateless mode: only keep last few messages for display
      // Not for context - each request is independent
      const newMessages = [...prev, newMessage];
      return newMessages.slice(-10); // Keep last 10 for UI only
    });

    return id;
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>{CHAT_CONFIG.ui.title}</h1>
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
            <p>Welcome to Todo Chatbot! 👋</p>
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
          placeholder={CHAT_CONFIG.placeholder}
          disabled={isLoading}
          className="chat-input"
          maxLength={CHAT_CONFIG.maxMessageLength}
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
          ⓘ Stateless mode: Each message is independent. Use explicit task IDs.
        </p>
      </div>
    </div>
  );
}
