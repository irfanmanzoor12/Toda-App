/**
 * TASK-047: DueDatePicker component tests
 * REQ-002: Due Dates & Time Reminders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DueDatePicker from '../DueDatePicker';

// Mock the API
vi.mock('@/lib/todos-api', () => ({
  setTodoDueDate: vi.fn().mockResolvedValue({
    id: 1,
    due_date: '2026-03-01T10:00:00.000Z',
  }),
}));

import { setTodoDueDate } from '@/lib/todos-api';

describe('DueDatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "+ Due Date" when no date set', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    expect(screen.getByText('+ Due Date')).toBeDefined();
  });

  it('renders formatted date when due date is set', () => {
    render(<DueDatePicker taskId={1} dueDate="2026-03-01T10:00:00.000Z" />);
    // Should display formatted date (not raw ISO)
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Mar');
  });

  it('shows overdue indicator for past dates', () => {
    render(<DueDatePicker taskId={1} dueDate="2026-01-01T10:00:00.000Z" />);
    expect(screen.getByText(/Overdue/)).toBeDefined();
  });

  it('does not show overdue for future dates', () => {
    render(<DueDatePicker taskId={1} dueDate="2026-12-01T10:00:00.000Z" />);
    expect(screen.queryByText(/Overdue/)).toBeNull();
  });

  it('shows picker when clicked', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));
    expect(screen.getByText('Due Date & Time')).toBeDefined();
  });

  it('does not open picker when disabled', () => {
    render(<DueDatePicker taskId={1} dueDate={null} disabled />);
    fireEvent.click(screen.getByText('+ Due Date'));
    expect(screen.queryByText('Due Date & Time')).toBeNull();
  });

  it('shows reminder schedule options', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));
    expect(screen.getByText('1 hour')).toBeDefined();
    expect(screen.getByText('1 day')).toBeDefined();
    expect(screen.getByText('1 week')).toBeDefined();
  });

  it('toggles reminder selection', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));

    const hourBtn = screen.getByText('1 hour');
    fireEvent.click(hourBtn);
    // Check it's selected (blue background)
    expect(hourBtn.style.backgroundColor).toBe('rgb(25, 118, 210)'); // #1976d2

    // Toggle off
    fireEvent.click(hourBtn);
    expect(hourBtn.style.backgroundColor).toBe('rgb(245, 245, 245)'); // #f5f5f5
  });

  it('closes picker on Cancel', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));
    expect(screen.getByText('Due Date & Time')).toBeDefined();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Due Date & Time')).toBeNull();
  });

  it('calls setTodoDueDate on Save', async () => {
    vi.useRealTimers(); // Need real timers for date parsing
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));

    // Set date input
    const dateInput = screen.getByLabelText('Due Date & Time');
    fireEvent.change(dateInput, { target: { value: '2026-03-01T10:00' } });

    // Click save
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(setTodoDueDate).toHaveBeenCalled();
      const args = vi.mocked(setTodoDueDate).mock.calls[0];
      expect(args[0]).toBe(1); // taskId
    });
  });

  it('calls onUpdate after saving', async () => {
    vi.useRealTimers();
    const onUpdate = vi.fn();
    render(<DueDatePicker taskId={1} dueDate={null} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('+ Due Date'));

    const dateInput = screen.getByLabelText('Due Date & Time');
    fireEvent.change(dateInput, { target: { value: '2026-03-01T10:00' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('Save is disabled without date input', () => {
    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));

    const saveBtn = screen.getByText('Save');
    expect(saveBtn.disabled).toBe(true);
  });

  it('handles API error gracefully', async () => {
    vi.useRealTimers();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(setTodoDueDate).mockRejectedValueOnce(new Error('Network error'));

    render(<DueDatePicker taskId={1} dueDate={null} />);
    fireEvent.click(screen.getByText('+ Due Date'));

    const dateInput = screen.getByLabelText('Due Date & Time');
    fireEvent.change(dateInput, { target: { value: '2026-03-01T10:00' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('applies overdue styling (red background)', () => {
    render(<DueDatePicker taskId={1} dueDate="2026-01-01T10:00:00.000Z" />);
    const button = screen.getByRole('button');
    expect(button.style.backgroundColor).toBe('rgb(255, 235, 238)'); // #ffebee
  });

  it('applies normal styling for future dates', () => {
    render(<DueDatePicker taskId={1} dueDate="2026-12-01T10:00:00.000Z" />);
    const button = screen.getByRole('button');
    expect(button.style.backgroundColor).toBe('rgb(232, 245, 233)'); // #e8f5e9
  });
});
