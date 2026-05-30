import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Mak-TIC/);
});

test('get started link points to register', async ({ page }) => {
  await page.goto('/');

  // Verify the Get Started link has the correct href
  const getStartedLink = page.locator('a', { hasText: 'Get Started' }).first();
  await expect(getStartedLink).toHaveAttribute('href', '/register');
});
