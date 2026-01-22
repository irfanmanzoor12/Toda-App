'use client';

/**
 * TaskSearch Component
 * TASK-046: Create TaskSearch component
 * REQ-005: Search & Filter
 */

import { useState, useEffect, useCallback } from 'react';
import { Todo, Priority, searchTodos, SearchParams } from '@/lib/todos-api';

interface TaskSearchProps {
  onResults: (results: Todo[] | null) => void;
  onClear: () => void;
}

export default function TaskSearch({ onResults, onClear }: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [tags, setTags] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      onResults(null);
      return;
    }

    setLoading(true);
    try {
      const params: SearchParams = {
        q: query.trim(),
        status: status !== 'all' ? status : undefined,
        priority: priority || undefined,
        tags: tags || undefined,
      };

      const results = await searchTodos(params);
      onResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      onResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, status, priority, tags, onResults]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleClear = () => {
    setQuery('');
    setStatus('all');
    setPriority('');
    setTags('');
    onClear();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            style={{
              width: '100%',
              padding: '10px 12px',
              paddingRight: '40px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          />
          {loading && (
            <span style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: '12px',
            }}>
              ...
            </span>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            backgroundColor: showFilters ? '#1976d2' : '#f5f5f5',
            color: showFilters ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Filters
        </button>

        {query && (
          <button
            onClick={handleClear}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '150px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
