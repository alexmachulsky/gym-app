import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads and displays hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ForgeMode/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has working navigation links to auth pages', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /log in/i });
    const registerLink = page.getByRole('link', { name: /get started|sign up|register/i }).first();
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /pricing|plan/i }).first()).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL('/terms');
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL('/privacy');
  });

  test('unknown routes show 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });
});
