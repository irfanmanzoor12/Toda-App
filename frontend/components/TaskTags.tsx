'use client';

/**
 * TaskTags Component
 * TASK-045: Create TaskTags component
 * REQ-004: Task Tags
 */

import { useState } from 'react';
import { Tag, addTodoTag, removeTodoTag } from '@/lib/todos-api';

interface TaskTagsProps {
  taskId: number;
  tags: Tag[];
  onUpdate?: (newTags: Tag[]) => void;
  disabled?: boolean;
}

export default function TaskTags({ taskId, tags, onUpdate, disabled }: TaskTagsProps) {
  const [currentTags, setCurrentTags] = useState<Tag[]>(tags);
  const [newTagInput, setNewTagInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddTag = async () => {
    const tagName = newTagInput.trim().toLowerCase();
    if (!tagName || loading) return;

    // Check if tag already exists
    if (currentTags.some(t => t.name === tagName)) {
      setNewTagInput('');
      setShowInput(false);
      return;
    }

    setLoading(true);
    try {
      const result = await addTodoTag(taskId, tagName);
      setCurrentTags(result.tags);
      onUpdate?.(result.tags);
      setNewTagInput('');
      setShowInput(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await removeTodoTag(taskId, tagName);
      setCurrentTags(result.tags);
      onUpdate?.(result.tags);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setNewTagInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
      {currentTags.map((tag) => (
        <span
          key={tag.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            fontSize: '11px',
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
            borderRadius: '12px',
            gap: '4px',
          }}
        >
          {tag.name}
          {!disabled && (
            <button
              onClick={() => handleRemoveTag(tag.name)}
              disabled={loading}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px',
                color: '#1565c0',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </span>
      ))}

      {!disabled && (
        showInput ? (
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => !newTagInput && setShowInput(false)}
            placeholder="Add tag..."
            autoFocus
            style={{
              padding: '2px 6px',
              fontSize: '11px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '80px',
            }}
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            style={{
              padding: '2px 6px',
              fontSize: '11px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px dashed #ccc',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            + Tag
          </button>
        )
      )}
    </div>
  );
}
