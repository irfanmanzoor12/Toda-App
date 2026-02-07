/**
 * TASK-044: TaskPriority component tests
 * REQ-003: Task Priorities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskPriority from '../TaskPriority';

// Mock the API
vi.mock('@/lib/todos-api', () => ({
  setTodoPriority: vi.fn().mockResolvedValue({ id: 1, priority: 'high' }),
}));

import { setTodoPriority } from '@/lib/todos-api';

describe('TaskPriority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current priority label', () => {
    render(<TaskPriority taskId={1} priority="medium" />);
    expect(screen.getByText('Medium')).toBeDefined();
  });

  it('renders all priority options', () => {
    render(<TaskPriority taskId={1} priority="low" />);
    expect(screen.getByText('Low')).toBeDefined();
  });

  it('shows dropdown when clicked', () => {
    render(<TaskPriority taskId={1} priority="medium" />);
    fireEvent.click(screen.getByText('Medium'));
    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText('Critical')).toBeDefined();
  });

  it('does not show dropdown when disabled', () => {
    render(<TaskPriority taskId={1} priority="medium" disabled />);
    fireEvent.click(screen.getByText('Medium'));
    // Should not show other options as separate dropdown buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1); // Only the main button
  });

  it('calls setTodoPriority on selection', async () => {
    render(<TaskPriority taskId={1} priority="medium" />);

    // Open dropdown
    fireEvent.click(screen.getByText('Medium'));

    // Select High
    fireEvent.click(screen.getByText('High'));

    await waitFor(() => {
      expect(setTodoPriority).toHaveBeenCalledWith(1, 'high');
    });
  });

  it('calls onUpdate callback after priority change', async () => {
    const onUpdate = vi.fn();
    render(<TaskPriority taskId={1} priority="medium" onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Medium'));
    fireEvent.click(screen.getByText('High'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('high');
    });
  });

  it('does not call API when selecting same priority', () => {
    render(<TaskPriority taskId={1} priority="medium" />);

    fireEvent.click(screen.getByText('Medium'));

    // Click on Medium again (same priority)
    const mediumOptions = screen.getAllByText('Medium');
    fireEvent.click(mediumOptions[mediumOptions.length - 1]);

    expect(setTodoPriority).not.toHaveBeenCalled();
  });

  it('displays correct colors for each priority', () => {
    const { rerender } = render(<TaskPriority taskId={1} priority="low" />);
    let button = screen.getByText('Low');
    expect(button.style.backgroundColor).toBe('rgb(232, 245, 233)'); // #e8f5e9

    rerender(<TaskPriority taskId={1} priority="critical" />);
    button = screen.getByText('Critical');
    expect(button.style.backgroundColor).toBe('rgb(243, 229, 245)'); // #f3e5f5
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(setTodoPriority).mockRejectedValueOnce(new Error('Network error'));

    render(<TaskPriority taskId={1} priority="medium" />);

    fireEvent.click(screen.getByText('Medium'));
    fireEvent.click(screen.getByText('High'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
