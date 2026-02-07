/**
 * TASK-045: TaskTags component tests
 * REQ-004: Task Tags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskTags from '../TaskTags';

// Mock the API
vi.mock('@/lib/todos-api', () => ({
  addTodoTag: vi.fn().mockResolvedValue({
    tags: [
      { id: 1, name: 'work' },
      { id: 2, name: 'urgent' },
    ],
  }),
  removeTodoTag: vi.fn().mockResolvedValue({
    tags: [{ id: 1, name: 'work' }],
  }),
}));

import { addTodoTag, removeTodoTag } from '@/lib/todos-api';

const sampleTags = [
  { id: 1, name: 'work' },
  { id: 2, name: 'urgent' },
];

describe('TaskTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing tags', () => {
    render(<TaskTags taskId={1} tags={sampleTags} />);
    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getByText('urgent')).toBeDefined();
  });

  it('renders add tag button', () => {
    render(<TaskTags taskId={1} tags={[]} />);
    expect(screen.getByText('+ Tag')).toBeDefined();
  });

  it('shows input when add tag button is clicked', () => {
    render(<TaskTags taskId={1} tags={[]} />);
    fireEvent.click(screen.getByText('+ Tag'));
    expect(screen.getByPlaceholderText('Add tag...')).toBeDefined();
  });

  it('does not show add button when disabled', () => {
    render(<TaskTags taskId={1} tags={sampleTags} disabled />);
    expect(screen.queryByText('+ Tag')).toBeNull();
  });

  it('does not show remove buttons when disabled', () => {
    render(<TaskTags taskId={1} tags={sampleTags} disabled />);
    // No × buttons should be rendered
    const removeButtons = screen.queryAllByText('\u00d7');
    expect(removeButtons.length).toBe(0);
  });

  it('calls addTodoTag when Enter is pressed', async () => {
    render(<TaskTags taskId={1} tags={[{ id: 1, name: 'work' }]} />);

    fireEvent.click(screen.getByText('+ Tag'));

    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: 'urgent' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(addTodoTag).toHaveBeenCalledWith(1, 'urgent');
    });
  });

  it('does not add duplicate tags', () => {
    render(<TaskTags taskId={1} tags={sampleTags} />);

    fireEvent.click(screen.getByText('+ Tag'));

    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(addTodoTag).not.toHaveBeenCalled();
  });

  it('hides input on Escape', () => {
    render(<TaskTags taskId={1} tags={[]} />);

    fireEvent.click(screen.getByText('+ Tag'));
    const input = screen.getByPlaceholderText('Add tag...');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText('Add tag...')).toBeNull();
  });

  it('calls removeTodoTag when remove button clicked', async () => {
    render(<TaskTags taskId={1} tags={sampleTags} />);

    // Click the × button on the first tag
    const removeButtons = screen.getAllByText('\u00d7');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(removeTodoTag).toHaveBeenCalledWith(1, 'work');
    });
  });

  it('calls onUpdate after adding tag', async () => {
    const onUpdate = vi.fn();
    render(<TaskTags taskId={1} tags={[{ id: 1, name: 'work' }]} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('+ Tag'));
    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: 'urgent' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully on add', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(addTodoTag).mockRejectedValueOnce(new Error('Network error'));

    render(<TaskTags taskId={1} tags={[]} />);

    fireEvent.click(screen.getByText('+ Tag'));
    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles API error gracefully on remove', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(removeTodoTag).mockRejectedValueOnce(new Error('Network error'));

    render(<TaskTags taskId={1} tags={sampleTags} />);

    const removeButtons = screen.getAllByText('\u00d7');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('trims and lowercases tag input', async () => {
    render(<TaskTags taskId={1} tags={[]} />);

    fireEvent.click(screen.getByText('+ Tag'));
    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: '  MyTag  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(addTodoTag).toHaveBeenCalledWith(1, 'mytag');
    });
  });

  it('does not submit empty tag', () => {
    render(<TaskTags taskId={1} tags={[]} />);

    fireEvent.click(screen.getByText('+ Tag'));
    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(addTodoTag).not.toHaveBeenCalled();
  });
});
