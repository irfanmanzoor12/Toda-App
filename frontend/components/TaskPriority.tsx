'use client';

/**
 * TaskPriority Component
 * TASK-044: Create TaskPriority component
 * REQ-003: Task Priorities
 */

import { useState } from 'react';
import { Priority, setTodoPriority } from '@/lib/todos-api';

interface TaskPriorityProps {
  taskId: number;
  priority: Priority;
  onUpdate?: (newPriority: Priority) => void;
  disabled?: boolean;
}

const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  low: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  medium: { bg: '#fff3e0', text: '#ef6c00', border: '#ffcc80' },
  high: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
  critical: { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' },
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function TaskPriority({ taskId, priority, onUpdate, disabled }: TaskPriorityProps) {
  const [currentPriority, setCurrentPriority] = useState<Priority>(priority);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePriorityChange = async (newPriority: Priority) => {
    if (newPriority === currentPriority || loading) return;

    setLoading(true);
    try {
      await setTodoPriority(taskId, newPriority);
      setCurrentPriority(newPriority);
      onUpdate?.(newPriority);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const colors = priorityColors[currentPriority];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled || loading}
        style={{
          padding: '3px 8px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          cursor: disabled ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {priorityLabels[currentPriority]}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: '100px',
          }}
        >
          {(Object.keys(priorityLabels) as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePriorityChange(p)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: p === currentPriority ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                color: priorityColors[p].text,
              }}
            >
              {priorityLabels[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
