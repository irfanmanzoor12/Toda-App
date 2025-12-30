'use client';

import { useState } from 'react';

interface TodoFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  initialTitle?: string;
  initialDescription?: string;
  submitLabel?: string;
}

export default function TodoForm({
  onSubmit,
  initialTitle = '',
  initialDescription = '',
  submitLabel = 'Add Todo'
}: TodoFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(title, description);
      // Reset form if creating new todo
      if (!initialTitle) {
        setTitle('');
        setDescription('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Todo title..."
          required
          maxLength={500}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          maxLength={2000}
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        style={{
          padding: '10px 20px',
          backgroundColor: loading || !title.trim() ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
