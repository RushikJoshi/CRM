import { test, expect } from '@playwright/test';

test('application root is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/(login|assessment|superadmin|company|branch|sales)/);
});
