'use client';

/**
 * TodoItem Component
 * TASK-048: Update TodoItem to show priority, tags, due date
 * Updated for Phase V features
 */

import { useState } from 'react';
import { Todo, Priority, Tag } from '@/lib/todos-api';
import TodoForm from './TodoForm';
import TaskPriority from './TaskPriority';
import TaskTags from './TaskTags';
import DueDatePicker from './DueDatePicker';

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onComplete, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(todo);

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

  const handlePriorityUpdate = (newPriority: Priority) => {
    setCurrentTodo(prev => ({ ...prev, priority: newPriority }));
  };

  const handleTagsUpdate = (newTags: Tag[]) => {
    setCurrentTodo(prev => ({ ...prev, tags: newTags }));
  };

  const handleDueDateUpdate = (newDueDate: string | null) => {
    setCurrentTodo(prev => ({ ...prev, due_date: newDueDate }));
  };

  const isCompleted = currentTodo.status === 'complete' || currentTodo.completed;

  if (isEditing) {
    return (
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '10px'
      }}>
        <TodoForm
          onSubmit={handleUpdate}
          initialTitle={currentTodo.title}
          initialDescription={currentTodo.description}
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
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      backgroundColor: isCompleted ? '#f8fdf8' : 'white',
      borderLeft: `4px solid ${
        currentTodo.priority === 'critical' ? '#7b1fa2' :
        currentTodo.priority === 'high' ? '#c62828' :
        currentTodo.priority === 'medium' ? '#ef6c00' : '#43a047'
      }`,
    }}>
      {/* Header row with title and actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '16px',
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? '#888' : '#333'
          }}>
            {currentTodo.title}
          </h3>
          {currentTodo.description && (
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              {currentTodo.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
          {!isCompleted && (
            <>
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
                ✓
              </button>
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
                ✎
              </button>
            </>
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
            ×
          </button>
        </div>
      </div>

      {/* Phase V metadata row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f0f0f0',
      }}>
        <TaskPriority
          taskId={todo.id}
          priority={currentTodo.priority || 'medium'}
          onUpdate={handlePriorityUpdate}
          disabled={isCompleted}
        />

        <DueDatePicker
          taskId={todo.id}
          dueDate={currentTodo.due_date}
          onUpdate={handleDueDateUpdate}
          disabled={isCompleted}
        />

        <TaskTags
          taskId={todo.id}
          tags={currentTodo.tags || []}
          onUpdate={handleTagsUpdate}
          disabled={isCompleted}
        />
      </div>

      {/* Footer with dates */}
      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
        Created: {new Date(currentTodo.created_at).toLocaleDateString()}
        {currentTodo.updated_at && currentTodo.updated_at !== currentTodo.created_at && (
          <> | Updated: {new Date(currentTodo.updated_at).toLocaleDateString()}</>
        )}
      </div>
    </div>
  );
}
