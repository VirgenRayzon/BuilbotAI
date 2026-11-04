import { test, expect } from '@playwright/test';
import { config } from 'dotenv';

config();
const baseURL = 'http://localhost:9002';

test('public pages never show guest actions while restoring a customer session', async ({ page }) => {
  test.setTimeout(90000);
  const hydrationErrors: string[] = [];
  page.on('pageerror', error => { if (/hydration|server rendered HTML/i.test(error.message)) hydrationErrors.push(error.message); });
  await page.goto(`${baseURL}/signin`);
  await page.getByLabel('Email Address').fill(process.env.E2E_USER_EMAIL || 'user@test.com');
  await page.locator('form input[type="password"]').first().fill(process.env.E2E_USER_PASSWORD || '123456');
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/builder(?:\?|$)/, { timeout: 45000 });

  await page.addInitScript(() => {
    (window as Window & { __guestActionSeen?: boolean }).__guestActionSeen = false;
    new MutationObserver(() => {
      const header = document.querySelector('header');
      if (['/parts', '/pre-builts', '/ai-build-advisor'].includes(location.pathname) && header?.querySelector('a[href="/signin"]')) {
        (window as Window & { __guestActionSeen?: boolean }).__guestActionSeen = true;
      }
    }).observe(document, { childList: true, subtree: true });
  });

  for (const route of ['/parts', '/pre-builts', '/ai-build-advisor']) {
    await page.goto(`${baseURL}${route}`);
    await expect(page.getByRole('button', { name: 'User account menu' })).toBeVisible({ timeout: 30000 });
    expect(await page.evaluate(() => (window as Window & { __guestActionSeen?: boolean }).__guestActionSeen)).toBe(false);
  }
  expect(hydrationErrors).toEqual([]);
});

test('guest public pages show sign-in actions and catalog content', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('pageerror', error => { if (/hydration|server rendered HTML/i.test(error.message)) hydrationErrors.push(error.message); });
  for (const route of ['/parts', '/pre-builts']) {
    await page.goto(`${baseURL}${route}`);
    await expect(page.locator('header a[href="/signin"]').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator(`a[href^="${route}/"]`).first()).toBeVisible({ timeout: 30000 });
  }
  expect(hydrationErrors).toEqual([]);
});

test('staff public page refresh never exposes customer navigation', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(`${baseURL}/system-access`);
  await page.getByLabel('Email Address').fill(process.env.E2E_MANAGER_EMAIL || 'manager@test.com');
  await page.locator('form input[type="password"]').first().fill(process.env.E2E_MANAGER_PASSWORD || '123456');
  await page.locator('form input[type="password"]').nth(1).fill(process.env.E2E_MANAGER_ACCESS_KEY || '00216764');
  await page.locator('form').getByRole('button', { name: 'Authenticate Session' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 45000 });

  await page.addInitScript(() => {
    (window as Window & { __customerNavSeen?: boolean }).__customerNavSeen = false;
    new MutationObserver(() => {
      if (location.pathname === '/parts' && document.querySelector('header nav a[href="/builder"]')) {
        (window as Window & { __customerNavSeen?: boolean }).__customerNavSeen = true;
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`${baseURL}/parts`);
  await expect(page.locator('header nav a[href="/admin"]')).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => (window as Window & { __customerNavSeen?: boolean }).__customerNavSeen)).toBe(false);
});

test('builder hard refresh hydrates without a header mismatch', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('pageerror', error => { if (/hydration|server rendered HTML/i.test(error.message)) hydrationErrors.push(error.message); });
  await page.goto(`${baseURL}/builder`);
  await expect(page.getByRole('heading', { name: /Select PC Components/i })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('header a[href="/signin"]').first()).toBeVisible({ timeout: 30000 });
  expect(hydrationErrors).toEqual([]);
});

test('guest advisor redirects without showing account navigation', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('pageerror', error => { if (/hydration|server rendered HTML/i.test(error.message)) hydrationErrors.push(error.message); });
  await page.goto(`${baseURL}/ai-build-advisor`);
  await expect(page).toHaveURL(/\/signin(?:\?|$)/, { timeout: 30000 });
  expect(hydrationErrors).toEqual([]);
});

test('advisor to pre-builts does not show the previous page after navigation', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(`${baseURL}/signin`);
  await page.getByLabel('Email Address').fill(process.env.E2E_USER_EMAIL || 'user@test.com');
  await page.locator('form input[type="password"]').first().fill(process.env.E2E_USER_PASSWORD || '123456');
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/builder(?:\?|$)/, { timeout: 45000 });
  await page.goto(`${baseURL}/ai-build-advisor`);
  await expect(page.getByRole('button', { name: 'User account menu' })).toBeVisible({ timeout: 30000 });

  await page.evaluate(() => {
    (window as Window & { __staleAdvisorSeen?: boolean }).__staleAdvisorSeen = false;
    (window as Window & { __headerSequence?: string[] }).__headerSequence = [];
    new MutationObserver(() => {
      const header = document.querySelector('header');
      const variant = header?.getAttribute('aria-label') === 'Account loading' ? 'neutral' : header?.querySelector('[aria-label="User account menu"]') ? 'account' : header?.querySelector('a[href="/signin"]') ? 'guest' : 'other';
      const sequence = (window as Window & { __headerSequence?: string[] }).__headerSequence;
      if (sequence?.at(-1) !== `${location.pathname}:${variant}`) sequence?.push(`${location.pathname}:${variant}`);
      if (location.pathname === '/pre-builts' && document.querySelector('main')?.textContent?.includes('Create New Build')) {
        (window as Window & { __staleAdvisorSeen?: boolean }).__staleAdvisorSeen = true;
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.locator('header nav a[href="/pre-builts"]').click();
  await expect(page).toHaveURL(/\/pre-builts(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /Pre-Built Systems/i })).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => (window as Window & { __staleAdvisorSeen?: boolean }).__staleAdvisorSeen)).toBe(false);
  expect(await page.evaluate(() => (window as Window & { __headerSequence?: string[] }).__headerSequence)).not.toContain('/pre-builts:guest');
  await page.goBack();
  await expect(page).toHaveURL(/\/ai-build-advisor(?:\?|$)/);
  await expect(page.getByRole('button', { name: 'User account menu' })).toBeVisible({ timeout: 30000 });
  await page.goForward();
  await expect(page).toHaveURL(/\/pre-builts(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /Pre-Built Systems/i })).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => (window as Window & { __staleAdvisorSeen?: boolean }).__staleAdvisorSeen)).toBe(false);
});

for (const role of ['manager', 'super admin'] as const) {
  test(`${role} guarded pages show a loading shell before content`, async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(`${baseURL}/system-access`);
    if (role === 'super admin') await page.getByText('SUPER ADMIN', { exact: true }).click();
    await page.getByLabel('Email Address').fill(role === 'manager' ? (process.env.E2E_MANAGER_EMAIL || 'manager@test.com') : (process.env.E2E_SUPER_ADMIN_EMAIL || 'admin@test.com'));
    await page.locator('form input[type="password"]').first().fill(role === 'manager' ? (process.env.E2E_MANAGER_PASSWORD || '123456') : (process.env.E2E_SUPER_ADMIN_PASSWORD || '123456'));
    await page.locator('form input[type="password"]').nth(1).fill(role === 'manager' ? (process.env.E2E_MANAGER_ACCESS_KEY || '00216764') : (process.env.E2E_SUPER_ADMIN_ACCESS_KEY || 'SUPER_ADMIN_123'));
    await page.locator('form').getByRole('button', { name: 'Authenticate Session' }).click();
    await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 45000 });
    await page.addInitScript(() => {
      (window as Window & { __adminStates?: string[] }).__adminStates = [];
      const sample = () => {
        const state = `${location.pathname}:${document.querySelector('[aria-label="Page loading"]') ? 'loading-shell' : document.querySelector('[data-sidebar="sidebar"]') ? 'sidebar' : document.querySelector('main')?.textContent?.trim() ? 'content' : 'empty'}`;
        const states = (window as Window & { __adminStates?: string[] }).__adminStates;
        if (states?.at(-1) !== state) states?.push(state);
      };
      new MutationObserver(sample).observe(document, { childList: true, subtree: true });
      document.addEventListener('DOMContentLoaded', sample);
    });
    for (const route of ['/admin', '/admin/prebuilt-builder', '/profile']) {
      await page.goto(`${baseURL}${route}`);
      if (route === '/profile') await expect(page.locator('main').first()).toContainText(/Back to Dashboard/i, { timeout: 30000 });
      else await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible({ timeout: 30000 });
      const states = await page.evaluate(() => (window as Window & { __adminStates?: string[] }).__adminStates || []);
      expect(states).toContain(`${route}:loading-shell`);
    }
  });
}
