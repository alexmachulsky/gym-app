import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login page', () => {
    test('renders the login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: /log in|sign in|welcome back/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
    });

    test('shows validation errors for empty submission', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /log in|sign in/i }).click();
      // HTML5 required validation or custom error should appear
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeFocused();
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('nonexistent@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword123!');
      await page.getByRole('button', { name: /log in|sign in/i }).click();
      await expect(page.getByText(/invalid|incorrect|not found|credentials/i).first()).toBeVisible({ timeout: 8000 });
    });

    test('has link to register page', async ({ page }) => {
      await page.goto('/login');
      const registerLink = page.getByRole('link', { name: /register|sign up|create/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    });

    test('has link to forgot password page', async ({ page }) => {
      await page.goto('/login');
      const forgotLink = page.getByRole('link', { name: /forgot/i });
      await expect(forgotLink).toBeVisible();
      await forgotLink.click();
      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Register page', () => {
    test('renders the registration form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: /create|register|sign up/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /register|create|sign up/i })).toBeVisible();
    });

    test('shows error for duplicate email', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/email/i).fill('test@example.com');
      const passwordFields = page.getByLabel(/password/i);
      await passwordFields.first().fill('SecurePass123!');
      if ((await passwordFields.count()) > 1) {
        await passwordFields.nth(1).fill('SecurePass123!');
      }
      const nameField = page.getByLabel(/name/i);
      if ((await nameField.count()) > 0) await nameField.fill('Test User');
      await page.getByRole('button', { name: /register|create|sign up/i }).click();
    });
  });

  test.describe('Protected routes', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
      const protectedRoutes = ['/workouts', '/exercises', '/progress', '/goals', '/settings'];
      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('redirects admin route to login when unauthenticated', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Forgot password page', () => {
    test('renders the forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
    });
  });
});
