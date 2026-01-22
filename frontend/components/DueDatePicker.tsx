'use client';

/**
 * DueDatePicker Component
 * TASK-047: Create DueDatePicker component
 * REQ-002: Due Dates & Time Reminders
 */

import { useState } from 'react';
import { setTodoDueDate } from '@/lib/todos-api';

interface DueDatePickerProps {
  taskId: number;
  dueDate: string | null;
  onUpdate?: (newDueDate: string | null) => void;
  disabled?: boolean;
}

export default function DueDatePicker({ taskId, dueDate, onUpdate, disabled }: DueDatePickerProps) {
  const [currentDueDate, setCurrentDueDate] = useState<string | null>(dueDate);
  const [showPicker, setShowPicker] = useState(false);
  const [dateInput, setDateInput] = useState(dueDate ? dueDate.slice(0, 16) : '');
  const [reminderSchedule, setReminderSchedule] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isOverdue = currentDueDate && new Date(currentDueDate) < new Date();

  const handleSave = async () => {
    if (!dateInput || loading) return;

    setLoading(true);
    try {
      const isoDate = new Date(dateInput).toISOString();
      const schedule = reminderSchedule.length > 0 ? reminderSchedule.join(',') : undefined;

      await setTodoDueDate(taskId, isoDate, schedule);
      setCurrentDueDate(isoDate);
      onUpdate?.(isoDate);
      setShowPicker(false);
    } catch (error) {
      console.error('Failed to set due date:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = (time: string) => {
    setReminderSchedule(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setShowPicker(!showPicker)}
        disabled={disabled}
        style={{
          padding: '3px 8px',
          fontSize: '11px',
          backgroundColor: isOverdue ? '#ffebee' : currentDueDate ? '#e8f5e9' : '#f5f5f5',
          color: isOverdue ? '#c62828' : currentDueDate ? '#2e7d32' : '#666',
          border: `1px solid ${isOverdue ? '#ef9a9a' : currentDueDate ? '#a5d6a7' : '#ddd'}`,
          borderRadius: '4px',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {currentDueDate ? formatDate(currentDueDate) : '+ Due Date'}
        {isOverdue && ' (Overdue)'}
      </button>

      {showPicker && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            width: '220px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Remind me
            </label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['1h', '1d', '1w'].map((time) => (
                <button
                  key={time}
                  onClick={() => toggleReminder(time)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: reminderSchedule.includes(time) ? '#1976d2' : '#f5f5f5',
                    color: reminderSchedule.includes(time) ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {time === '1h' ? '1 hour' : time === '1d' ? '1 day' : '1 week'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={loading || !dateInput}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowPicker(false)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
