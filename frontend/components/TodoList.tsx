'use client';

import { Todo } from '@/lib/todos-api';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onComplete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoList({ todos, onComplete, onUpdate, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
      }}>
        No todos yet. Create one above!
      </div>
    );
  }

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onComplete={onComplete}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
