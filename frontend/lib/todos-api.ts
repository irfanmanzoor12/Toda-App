/**
 * Todo API functions.
 */

import { apiCall } from './api';

export interface Todo {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: number;
}

export interface TodoCreate {
  title: string;
  description?: string;
}

export interface TodoUpdate {
  title?: string;
  description?: string;
}

/**
 * Create a new todo.
 */
export async function createTodo(data: TodoCreate): Promise<Todo> {
  return apiCall<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * List all todos for the current user.
 */
export async function listTodos(): Promise<Todo[]> {
  return apiCall<Todo[]>('/api/todos', {
    method: 'GET',
  });
}

/**
 * Get a specific todo by ID.
 */
export async function getTodo(id: number): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}`, {
    method: 'GET',
  });
}

/**
 * Update a todo.
 */
export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Mark a todo as complete.
 */
export async function completeTodo(id: number): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}/complete`, {
    method: 'PATCH',
  });
}

/**
 * Delete a todo.
 */
export async function deleteTodo(id: number): Promise<void> {
  return apiCall<void>(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}
