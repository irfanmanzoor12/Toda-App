'use client';

import { useState } from 'react';
import { Todo } from '@/lib/todos-api';
import TodoForm from './TodoForm';

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onComplete, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(todo.id);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (title: string, description: string) => {
    await onUpdate(todo.id, title, description);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(todo.id);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '15px',
        marginBottom: '10px'
      }}>
        <TodoForm
          onSubmit={handleUpdate}
          initialTitle={todo.title}
          initialDescription={todo.description}
          submitLabel="Save"
        />
        <button
          onClick={() => setIsEditing(false)}
          style={{
            padding: '5px 10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '10px',
      backgroundColor: todo.status === 'complete' ? '#f0f8f0' : 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 5px 0',
            textDecoration: todo.status === 'complete' ? 'line-through' : 'none',
            color: todo.status === 'complete' ? '#666' : 'black'
          }}>
            {todo.title}
          </h3>
          {todo.description && (
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
              {todo.description}
            </p>
          )}
          <div style={{ fontSize: '12px', color: '#999' }}>
            Status: <strong>{todo.status}</strong> | Created: {new Date(todo.created_at).toLocaleDateString()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
          {todo.status !== 'complete' && (
            <button
              onClick={handleComplete}
              disabled={loading}
              style={{
                padding: '5px 10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              ✓ Complete
            </button>
          )}

          {todo.status !== 'complete' && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              style={{
                padding: '5px 10px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              ✎ Edit
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            × Delete
          </button>
        </div>
      </div>
    </div>
  );
}
