/**
 * Todo API functions.
 * Updated for Phase V with priority, tags, due dates.
 */

import { apiCall } from './api';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Tag {
  id: number;
  name: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  status: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  reminder_schedule: { reminders: string[] } | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TodoCreate {
  title: string;
  description?: string;
  priority?: Priority;
  tags?: string[];
  due_date?: string;
  reminder_schedule?: string;
}

export interface TodoUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  tags?: string[];
  due_date?: string;
  reminder_schedule?: string;
}

export interface SearchParams {
  q: string;
  status?: 'pending' | 'completed';
  priority?: Priority;
  tags?: string;
  due_before?: string;
  due_after?: string;
  limit?: number;
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

// Phase V API functions

/**
 * Search todos with filters.
 */
export async function searchTodos(params: SearchParams): Promise<Todo[]> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.tags) searchParams.append('tags', params.tags);
  if (params.due_before) searchParams.append('due_before', params.due_before);
  if (params.due_after) searchParams.append('due_after', params.due_after);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  return apiCall<Todo[]>(`/api/todos/search?${searchParams.toString()}`, {
    method: 'GET',
  });
}

/**
 * Set task priority.
 */
export async function setTodoPriority(id: number, priority: Priority): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}/priority?priority=${priority}`, {
    method: 'PUT',
  });
}

/**
 * Set task due date.
 */
export async function setTodoDueDate(
  id: number,
  dueDate: string,
  reminderSchedule?: string
): Promise<Todo> {
  const params = new URLSearchParams();
  params.append('due_date', dueDate);
  if (reminderSchedule) params.append('reminder_schedule', reminderSchedule);

  return apiCall<Todo>(`/api/todos/${id}/due-date?${params.toString()}`, {
    method: 'PUT',
  });
}

/**
 * Add tag to a task.
 */
export async function addTodoTag(id: number, tagName: string): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ name: tagName }),
  });
}

/**
 * Remove tag from a task.
 */
export async function removeTodoTag(id: number, tagName: string): Promise<Todo> {
  return apiCall<Todo>(`/api/todos/${id}/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
}

/**
 * List all user tags.
 */
export async function listTags(sortBy: 'usage' | 'name' = 'usage'): Promise<Array<Tag & { usage_count: number }>> {
  return apiCall<Array<Tag & { usage_count: number }>>(`/api/tags?sort_by=${sortBy}`, {
    method: 'GET',
  });
}
