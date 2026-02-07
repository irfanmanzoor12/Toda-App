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
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="form-input"
            style={{ paddingRight: loading ? '36px' : undefined }}
          />
          {loading && (
            <span style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              border: '2px solid #e5e7eb',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '11px 16px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: showFilters ? '#4f46e5' : '#f3f4f6',
            color: showFilters ? 'white' : '#374151',
            border: showFilters ? 'none' : '1.5px solid #e5e7eb',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          Filters
        </button>

        {query && (
          <button
            onClick={handleClear}
            style={{
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
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
          padding: '14px 16px',
          marginTop: '8px',
          backgroundColor: 'white',
          borderRadius: '10px',
          flexWrap: 'wrap',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="create-form-select"
              style={{ fontSize: '12px', padding: '7px 10px', minWidth: '100px' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
              className="create-form-select"
              style={{ fontSize: '12px', padding: '7px 10px', minWidth: '100px' }}
            >
              <option value="">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent"
              className="form-input"
              style={{ fontSize: '12px', padding: '7px 10px', width: '140px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
