import { test, expect } from '@playwright/test';

test.describe('Authentication and Routing', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('admin dashboard redirects unauthenticated users to login', async ({ page }) => {
    // Navigate directly to protected admin route
    await page.goto('/admin/dashboard');

    // Wait for redirect to occur
    await page.waitForURL('**/login*');
    
    // Assert we landed on the login page
    await expect(page).toHaveURL(/.*login/);
  });
});
