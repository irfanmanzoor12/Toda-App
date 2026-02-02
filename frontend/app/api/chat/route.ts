import { NextRequest, NextResponse } from 'next/server';

/**
 * Chat API Proxy - Phase III
 *
 * Forwards chat requests to Python FastAPI backend with conversation persistence.
 * Backend: http://localhost:8000/api/{user_id}/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, message, conversation_id } = body;

    if (!user_id || !message) {
      return NextResponse.json(
        {
          error: 'BadRequest',
          message: 'user_id and message are required',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Forward to Python FastAPI backend (Phase III)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/${user_id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversation_id || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'UnknownError',
        message: 'Failed to get response from chatbot',
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'ServerError',
        message: 'An error occurred while processing your request',
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
