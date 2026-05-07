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
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
    });
});