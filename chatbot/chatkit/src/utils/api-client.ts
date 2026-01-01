/**
 * API Client for Chat Endpoint
 *
 * Handles communication with the agent API
 */

import axios, { AxiosError } from 'axios';
import { CHAT_CONFIG } from '../config';

export interface ChatRequest {
  message: string;
  session_token: string;
}

export interface ChatResponse {
  response: string;
  toolsUsed?: string[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export class ChatAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: string
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

/**
 * Send a message to the chat API
 */
export async function sendMessage(
  message: string,
  sessionToken: string
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(
      CHAT_CONFIG.apiEndpoint,
      {
        message,
        session_token: sessionToken,
      } as ChatRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;

      if (axiosError.response) {
        // Server responded with error
        const errorData = axiosError.response.data;
        throw new ChatAPIError(
          errorData.message || 'An error occurred',
          errorData.statusCode || axiosError.response.status,
          errorData.error || 'UnknownError'
        );
      } else if (axiosError.request) {
        // Request made but no response
        throw new ChatAPIError(
          'Cannot connect to chat server. Please check your connection.',
          0,
          'NetworkError'
        );
      }
    }

    // Unexpected error
    throw new ChatAPIError(
      'An unexpected error occurred',
      500,
      'UnexpectedError'
    );
  }
}
