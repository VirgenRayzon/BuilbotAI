import { expect, test } from '@playwright/test';
import { config } from 'dotenv';

config();
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';
const rolloutTestsEnabled = process.env.E2E_SCALING_ROLLOUT === 'true';
test.setTimeout(90000);

test('public catalog pages and searches beyond page one', async ({ page }) => {
  test.skip(!rolloutTestsEnabled, 'Set E2E_SCALING_ROLLOUT=true for the indexed deployment.');
  await page.goto(`${baseURL}/parts`);
  const products = page.locator('a[aria-label^="View "]');
  await expect(products).toHaveCount(8, { timeout: 30000 });
  const firstPage = await products.evaluateAll(links => links.map(link => link.getAttribute('href')));
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(products).toHaveCount(8);
  const nextHref = await products.first().getAttribute('href');
  const nextName = (await products.first().getAttribute('aria-label'))?.replace(/^View /, '');
  expect(nextHref).toBeTruthy();
  expect(nextName).toBeTruthy();
  expect(firstPage).not.toContain(nextHref);
  await page.getByRole('textbox', { name: 'Search parts by name, brand, SKU, or product ID' }).fill(nextName!);
  await expect(page.locator(`a[href="${nextHref}"]`).first()).toBeVisible({ timeout: 30000 });
});

test('staff inventory pages and preserves full search', async ({ page }) => {
  const email = process.env.E2E_SUPER_ADMIN_EMAIL;
  const password = process.env.E2E_SUPER_ADMIN_PASSWORD;
  const accessKey = process.env.E2E_SUPER_ADMIN_ACCESS_KEY;
  test.skip(!rolloutTestsEnabled || !email || !password || !accessKey, 'Set the rollout flag and super-admin test credentials.');
  await page.goto(`${baseURL}/system-access`);
  await page.getByText('SUPER ADMIN', { exact: true }).click();
  await page.getByLabel('Email Address').fill(email!);
  await page.locator('form input[type="password"]').first().fill(password!);
  await page.locator('form input[type="password"]').nth(1).fill(accessKey!);
  await page.locator('form').getByRole('button', { name: 'Authenticate Session' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 45000 });
  const cards = page.locator('div[class*="group/card-wrapper"]');
  await expect(cards).toHaveCount(8, { timeout: 45000 });
  const firstPageNames = await cards.locator('img[alt]').evaluateAll(images => images.map(image => image.getAttribute('alt')));
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(cards).toHaveCount(8, { timeout: 45000 });
  const nextName = await cards.first().locator('img[alt]').first().getAttribute('alt');
  expect(nextName).toBeTruthy();
  expect(firstPageNames).not.toContain(nextName);
  await page.getByRole('textbox', { name: 'Search parts by name, brand, or SKU...' }).fill(nextName!);
  await expect(page.getByText(nextName!, { exact: true }).first()).toBeVisible({ timeout: 45000 });
});
