/**
 * TASK-070: E2E tests for search and filter functionality
 * Tests search, priority filter, tag filter, and due date range
 */

import { test, expect } from '@playwright/test';

test.describe('Task Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/todos');
  });

  test('search for task by keyword', async ({ page }) => {
    // Create a task with specific keyword
    await page.fill('input[placeholder="Task title"]', 'Buy groceries for dinner');
    await page.click('button:has-text("Add Todo")');
    await expect(page.locator('h3:has-text("Buy groceries")')).toBeVisible();

    // Search for the task
    await page.fill('input[placeholder="Search tasks..."]', 'groceries');
    await page.waitForTimeout(600); // Wait for debounce

    // Verify search results
    await expect(page.locator('h3:has-text("Buy groceries")')).toBeVisible();
    await expect(page.locator('text=1 search result')).toBeVisible();
  });

  test('filter by priority', async ({ page }) => {
    // Create tasks with different priorities
    await page.fill('input[placeholder="Task title"]', 'Low priority task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add Todo")');

    await page.fill('input[placeholder="Task title"]', 'Critical priority task');
    await page.selectOption('select', 'critical');
    await page.click('button:has-text("Add Todo")');

    // Open filters
    await page.click('button:has-text("Filters")');

    // Filter by critical priority
    await page.selectOption('select:near(:text("Priority"))', 'critical');

    // Enter search query to trigger search
    await page.fill('input[placeholder="Search tasks..."]', 'task');
    await page.waitForTimeout(600);

    // Verify only critical task is shown
    await expect(page.locator('h3:has-text("Critical priority")')).toBeVisible();
    await expect(page.locator('h3:has-text("Low priority")')).not.toBeVisible();
  });

  test('filter by tags', async ({ page }) => {
    // Create a task and add tags
    await page.fill('input[placeholder="Task title"]', 'Work meeting prep');
    await page.click('button:has-text("Add Todo")');

    // Add tag to the task
    await page.click('button:has-text("+ Tag")');
    await page.fill('input[placeholder="Add tag..."]', 'work');
    await page.press('input[placeholder="Add tag..."]', 'Enter');

    // Open filters and filter by tag
    await page.click('button:has-text("Filters")');
    await page.fill('input[placeholder="work, urgent"]', 'work');

    // Search
    await page.fill('input[placeholder="Search tasks..."]', 'meeting');
    await page.waitForTimeout(600);

    // Verify task with tag is shown
    await expect(page.locator('h3:has-text("Work meeting")')).toBeVisible();
  });

  test('filter by status - pending', async ({ page }) => {
    // Create and complete a task
    await page.fill('input[placeholder="Task title"]', 'Completed task');
    await page.click('button:has-text("Add Todo")');
    await page.click('button:has-text("✓")');

    // Create pending task
    await page.fill('input[placeholder="Task title"]', 'Pending task');
    await page.click('button:has-text("Add Todo")');

    // Filter by pending status
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:near(:text("Status"))', 'pending');

    // Search
    await page.fill('input[placeholder="Search tasks..."]', 'task');
    await page.waitForTimeout(600);

    // Verify only pending task shown
    await expect(page.locator('h3:has-text("Pending task")')).toBeVisible();
    await expect(page.locator('h3:has-text("Completed task")')).not.toBeVisible();
  });

  test('combine multiple filters', async ({ page }) => {
    // Create tasks with various attributes
    await page.fill('input[placeholder="Task title"]', 'High priority work task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add Todo")');

    // Add work tag
    await page.click('button:has-text("+ Tag")');
    await page.fill('input[placeholder="Add tag..."]', 'work');
    await page.press('input[placeholder="Add tag..."]', 'Enter');

    await page.fill('input[placeholder="Task title"]', 'Low priority personal task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add Todo")');

    // Open filters
    await page.click('button:has-text("Filters")');

    // Set multiple filters
    await page.selectOption('select:near(:text("Priority"))', 'high');
    await page.fill('input[placeholder="work, urgent"]', 'work');

    // Search
    await page.fill('input[placeholder="Search tasks..."]', 'task');
    await page.waitForTimeout(600);

    // Verify only high priority work task shown
    await expect(page.locator('h3:has-text("High priority work")')).toBeVisible();
    await expect(page.locator('h3:has-text("Low priority personal")')).not.toBeVisible();
  });

  test('clear search returns to full list', async ({ page }) => {
    // Create multiple tasks
    await page.fill('input[placeholder="Task title"]', 'First task');
    await page.click('button:has-text("Add Todo")');

    await page.fill('input[placeholder="Task title"]', 'Second task');
    await page.click('button:has-text("Add Todo")');

    // Search for one
    await page.fill('input[placeholder="Search tasks..."]', 'First');
    await page.waitForTimeout(600);
    await expect(page.locator('h3:has-text("Second task")')).not.toBeVisible();

    // Clear search
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(300);

    // Both tasks should be visible
    await expect(page.locator('h3:has-text("First task")')).toBeVisible();
    await expect(page.locator('h3:has-text("Second task")')).toBeVisible();
  });

  test('search with no results shows message', async ({ page }) => {
    // Search for non-existent task
    await page.fill('input[placeholder="Search tasks..."]', 'xyznonexistent123');
    await page.waitForTimeout(600);

    // Verify no results message
    await expect(page.locator('text=No matching tasks found')).toBeVisible();
  });
});
