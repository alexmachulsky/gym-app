import { test, expect } from '@playwright/test';

// Helpers
async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/(workouts|exercises|dashboard)/, { timeout: 10000 });
}

// These tests require a running backend with a seeded test account.
// Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars to run authenticated flows.
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

test.describe('Authenticated app flows', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipped: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('exercises page loads and shows library', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page.getByRole('heading', { name: /exercise/i })).toBeVisible();
  });

  test('workouts page loads', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page.getByRole('heading', { name: /workout/i })).toBeVisible();
  });

  test('progress page loads', async ({ page }) => {
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible();
  });

  test('body metrics page loads', async ({ page }) => {
    await page.goto('/body-metrics');
    await expect(page.getByRole('heading', { name: /metric|body/i })).toBeVisible();
  });

  test('goals page loads', async ({ page }) => {
    await page.goto('/goals');
    await expect(page.getByRole('heading', { name: /goal/i })).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /setting/i })).toBeVisible();
  });

  test('layout has navigation links', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page.getByRole('link', { name: /workout/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /exercise/i })).toBeVisible();
  });

  test('logout clears session and redirects', async ({ page }) => {
    await page.goto('/workouts');
    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    await logoutButton.click();
    await expect(page).toHaveURL(/\/(login|$)/);
    await page.goto('/workouts');
    await expect(page).toHaveURL('/login');
  });
});
