import { expect, test } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:9002';

test('desktop parts filters use compact option rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/parts`);
  await page.getByRole('button', { name: /^Filters and sort/ }).click();

  await expect(page.getByRole('switch', { name: 'Hide out of stock' })).toBeVisible();

  const categoryRowHeight = await page.getByRole('checkbox', { name: 'CPU' }).evaluate((element) =>
    element.closest('.mantine-Checkbox-root')?.getBoundingClientRect().height
  );
  const sortRowHeight = await page.getByRole('radio', { name: 'Newest first' }).evaluate((element) =>
    element.closest('.mantine-Radio-root')?.getBoundingClientRect().height
  );

  expect(categoryRowHeight).toBeLessThanOrEqual(32);
  expect(sortRowHeight).toBeLessThanOrEqual(32);
});

test('mobile parts filters retain touch targets and filter stock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/parts`);
  await page.getByRole('button', { name: /^Filters and sort/ }).click();

  const stockToggle = page.getByRole('switch', { name: 'Hide out of stock' });
  await expect(stockToggle).toBeVisible();
  await stockToggle.check();
  if (process.env.PARTS_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.PARTS_SCREENSHOT_PATH });
  }
  await page.getByRole('button', { name: /^Show \d+ parts$/ }).click();

  const activeChip = page.getByRole('button', { name: 'Remove In stock only filter' });
  await expect(activeChip).toBeVisible();
  const filterButton = page.getByRole('button', { name: /Filters and sort, 1 active/ });
  expect((await filterButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect((await activeChip.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
