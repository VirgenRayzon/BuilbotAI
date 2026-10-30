import { expect, test, type Page } from '@playwright/test';
import { config } from 'dotenv';

config();

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';
test.setTimeout(90_000);

async function addFirstAvailableCase(page: Page) {
  await page.getByRole('button', { name: /^Filters and sort/ }).click();
  await page.getByRole('checkbox', { name: 'Case', exact: true }).click();
  await page.keyboard.press('Escape');
  const buttons = await page.getByRole('button', { name: 'Add to Build', exact: true }).all();
  for (const button of buttons) {
    if (await button.isEnabled()) {
      await button.click();
      return;
    }
  }
  throw new Error('No in-stock case was available for the builder smoke test.');
}

test('customer builder respects the safeguard and shows two distinct roles when enabled', async ({ page }) => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD, 'Set E2E_USER_* in .env');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/signin`);
  await page.getByLabel('Email Address').fill(process.env.E2E_USER_EMAIL!);
  await page.locator('form input[type="password"]').fill(process.env.E2E_USER_PASSWORD!);
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/builder(?:\?|$)/, { timeout: 45_000 });
  await page.evaluate(() => localStorage.removeItem('pc_builder_state'));
  await page.reload();
  const recommendationTab = page.getByRole('tab', { name: 'Recommendation', exact: true });
  await expect(page.getByText('Buildbot recommendations', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View recommendation' })).toHaveCount(0);
  if (await recommendationTab.count() === 0) {
    await expect(page.locator('.buildbot-recommendation-card--match')).toHaveCount(0);
    await expect(page.locator('.buildbot-recommendation-card--value')).toHaveCount(0);
    return;
  }
  await recommendationTab.click();
  await expect(page.getByLabel('Budget in PHP')).toBeVisible();
  const autoRecommendation = page.getByRole('switch', { name: 'Enable Auto Recommendation' });
  await expect(autoRecommendation).toBeChecked();
  await expect(page.getByRole('radio', { name: 'AAA gaming', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: '3D rendering', exact: true }).check();
  await expect(page.getByText(/Prioritizes GPU compute/)).toBeVisible();
  await addFirstAvailableCase(page);
  await expect(page.locator('.buildbot-recommendation-card--match')).toHaveCount(1);
  await expect(page.locator('.buildbot-recommendation-card--value')).toHaveCount(1);
  await expect(page.getByText('Best match', { exact: true })).toBeVisible();
  await expect(page.getByText('Best value', { exact: true })).toBeVisible();
  await recommendationTab.click();
  await autoRecommendation.uncheck();
  await expect(page.locator('.buildbot-recommendation-card--match')).toHaveCount(0);
  await expect(page.locator('.buildbot-recommendation-card--value')).toHaveCount(0);
  await autoRecommendation.check();
  await expect(page.locator('.buildbot-recommendation-card--match')).toHaveCount(1);
  await page.getByLabel('Budget in PHP').fill('1');
  await page.getByRole('tab', { name: /^Parts/ }).click();
  await expect(page.getByText('Budget set', { exact: true })).toBeVisible();
  await expect(page.getByText('Shortfall', { exact: true })).toBeVisible();
});

test('manager prebuilt builder respects the same recommendation safeguard', async ({ page }) => {
  test.skip(!process.env.E2E_MANAGER_EMAIL || !process.env.E2E_MANAGER_PASSWORD || !process.env.E2E_MANAGER_ACCESS_KEY,
    'Set E2E_MANAGER_* in .env');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/system-access`);
  await page.getByLabel('Email Address').fill(process.env.E2E_MANAGER_EMAIL!);
  await page.locator('form input[type="password"]').first().fill(process.env.E2E_MANAGER_PASSWORD!);
  await page.locator('form input[type="password"]').nth(1).fill(process.env.E2E_MANAGER_ACCESS_KEY!);
  await page.locator('form').getByRole('button', { name: 'Authenticate Session' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 45_000 });
  await page.goto(`${baseURL}/admin/prebuilt-builder`);
  await expect(page.getByText('Buildbot recommendations', { exact: true })).toHaveCount(0);
  const recommendationTab = page.getByRole('tab', { name: 'Recommendation', exact: true });
  if (await recommendationTab.count() === 0) {
    await expect(page.locator('.buildbot-recommendation-card--match')).toHaveCount(0);
    await expect(page.locator('.buildbot-recommendation-card--value')).toHaveCount(0);
  } else {
    await recommendationTab.click();
    await expect(page.getByLabel('Budget in PHP')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Enable Auto Recommendation' })).toBeChecked();
  }
});
