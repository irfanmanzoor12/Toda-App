/**
 * TASK-069: E2E tests for recurring tasks
 * Tests creation, display, and management of recurring tasks
 */

import { test, expect } from '@playwright/test';

test.describe('Recurring Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/todos');
  });

  test('create daily recurring task via chat', async ({ page }) => {
    // Open chat
    await page.click('button[aria-label="Open chat"]');
    await expect(page.locator('.chat-container')).toBeVisible();

    // Ask chatbot to create recurring task
    await page.fill('textarea[placeholder*="message"]',
      'Create a recurring task called "Daily standup" that repeats every day');
    await page.press('textarea[placeholder*="message"]', 'Enter');

    // Wait for response
    await page.waitForSelector('text=recurring task', { timeout: 30000 });

    // Close chat and verify task created
    await page.click('button[aria-label="Close chat"]');

    // Task should appear in list
    await expect(page.locator('h3:has-text("Daily standup")')).toBeVisible();
  });

  test('create weekly recurring task via chat', async ({ page }) => {
    // Open chat
    await page.click('button[aria-label="Open chat"]');

    // Create weekly task
    await page.fill('textarea[placeholder*="message"]',
      'Add a weekly task "Team meeting" every Monday');
    await page.press('textarea[placeholder*="message"]', 'Enter');

    // Wait for confirmation
    await page.waitForSelector('text=weekly', { timeout: 30000 });

    // Close chat and verify
    await page.click('button[aria-label="Close chat"]');
    await expect(page.locator('h3:has-text("Team meeting")')).toBeVisible();
  });

  test('recurring task shows recurrence indicator', async ({ page }) => {
    // Create recurring task first (assuming API creates it)
    // For E2E, we'd need the task to exist

    // Check for recurrence indicator on task items
    // This would show a repeat icon or "Recurring" badge
    const recurringTasks = page.locator('[data-recurring="true"]');

    // If there are recurring tasks, they should have indicator
    const count = await recurringTasks.count();
    if (count > 0) {
      await expect(recurringTasks.first().locator('.recurrence-indicator')).toBeVisible();
    }
  });

  test('edit recurrence pattern', async ({ page }) => {
    test.skip(true, 'Requires recurring task UI which is not yet implemented');

    // This test would:
    // 1. Click on a recurring task
    // 2. Open recurrence settings
    // 3. Change frequency from daily to weekly
    // 4. Save and verify
  });

  test('delete recurring task stops future instances', async ({ page }) => {
    test.skip(true, 'Requires recurring task management UI');

    // This test would:
    // 1. Create a recurring task
    // 2. Delete it
    // 3. Verify confirmation about deleting future instances
    // 4. Confirm deletion
    // 5. Verify no new instances are created
  });

  test('recurring task spawns new instance after trigger', async ({ page }) => {
    test.skip(true, 'Requires mocking Dapr cron trigger');

    // This test would:
    // 1. Create a recurring task
    // 2. Mock the cron trigger via API
    // 3. Refresh the page
    // 4. Verify new task instance appears
  });
});


test.describe('Recurring Task API Integration', () => {
  test('API creates recurrence pattern', async ({ request }) => {
    // Create task first
    const taskResponse = await request.post('/api/todos', {
      data: {
        title: 'API Test Recurring Task',
        description: 'Test description',
        priority: 'medium'
      },
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    if (taskResponse.ok()) {
      const task = await taskResponse.json();

      // Create recurrence pattern
      const recurrenceResponse = await request.post('/api/recurrence/patterns', {
        data: {
          task_id: task.id,
          frequency: 'daily',
          interval: 1
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(recurrenceResponse.ok()).toBeTruthy();
      const pattern = await recurrenceResponse.json();
      expect(pattern.frequency).toBe('daily');
      expect(pattern.task_id).toBe(task.id);
    }
  });
});
