import { test, expect } from '@playwright/test';

const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=';

test('upload flow creates an expense', async ({ page }) => {
  await page.route('**/api/infer', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filename: 'receipt-a.png',
        content_type: 'image/png',
        text: 'Sample OCR text',
        confidence: 0.93,
        structured: { vendor_name: 'Sample OCR Vendor', total_amount: 9.99, line_items: [{ description: 'Item A', qty: 1, unit_price: 9.99, total: 9.99 }] },
      }),
    });
  });

  await page.goto('/upload');
  await page.getByTestId('file-input').setInputFiles({
    name: 'receipt-a.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png1x1, 'base64'),
  });

  await expect(page.getByText('receipt-a.png')).toBeVisible();
  await expect(page.getByText(/Open extracted expense/)).toBeVisible({ timeout: 6000 });
});
