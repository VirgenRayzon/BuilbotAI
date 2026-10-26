import { expect, test } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:9002';

test('desktop prebuilt filters use compact option rows and popover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/pre-builts`);
  await page.getByRole('button', { name: /^Filters and sort/ }).click();

  await expect(page.getByRole('switch', { name: 'Show component specs' })).toBeVisible();

  const tierRowHeight = await page.getByRole('checkbox', { name: 'Entry' }).evaluate((element) =>
    element.closest('.mantine-Checkbox-root')?.getBoundingClientRect().height
  );
  const sortRowHeight = await page.getByRole('radio', { name: 'Newest first' }).evaluate((element) =>
    element.closest('.mantine-Radio-root')?.getBoundingClientRect().height
  );

  expect(tierRowHeight).toBeLessThanOrEqual(32);
  expect(sortRowHeight).toBeLessThanOrEqual(32);

  // Toggle Entry tier off
  await page.getByRole('checkbox', { name: 'Entry' }).click();
  await page.getByRole('button', { name: /^Show \d+ systems$/ }).click();

  // Active chip should be visible showing active tiers count
  const activeChip = page.getByRole('button', { name: /Remove .* filter/ });
  await expect(activeChip).toBeVisible();
});

test('mobile prebuilt filters retain touch targets and open bottom drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/pre-builts`);
  const filterButton = page.getByRole('button', { name: /^Filters and sort/ });
  await expect(filterButton).toBeVisible();
  expect((await filterButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);

  await filterButton.click();

  const specsToggle = page.getByRole('switch', { name: 'Show component specs' });
  await expect(specsToggle).toBeVisible();
  await specsToggle.check();

  await page.getByRole('button', { name: /^Show \d+ systems$/ }).click();

  const activeChip = page.getByRole('button', { name: 'Remove Specs expanded filter' });
  await expect(activeChip).toBeVisible();
  expect((await activeChip.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
