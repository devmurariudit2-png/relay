import { test, expect } from '@playwright/test';

test.describe('Authentication & Routing Flow', () => {

    test('should redirect unauthenticated users away from secure dashboard', async ({ page }) => {
        // Attempt to access a protected route
        await page.goto('/app/dashboard');

        // The App.jsx routing logic should force a redirect to the signin page
        await expect(page).toHaveURL(/.*\/signin/);
    });

    test('should render the signin form correctly', async ({ page }) => {
        await page.goto('/signin');

        // Verify core UI elements exist on the page
        // Note: Adjust the accessible names (name/placeholder) based on your actual AuthPage.jsx UI
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
});
