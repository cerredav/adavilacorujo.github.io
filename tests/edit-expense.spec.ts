import { test, expect } from '@playwright/test';

test('editing an expense updates list', async ({ page }) => {
  await page.goto('/expenses');
  const firstRow = page.locator('tbody tr').first();
  await firstRow.click();

  await page.getByTestId('vendor-input').fill('Updated Vendor LLC');
  await page.getByRole('button', { name: 'Save & Mark Reviewed' }).click();

  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByText('Updated Vendor LLC').first()).toBeVisible();
});
