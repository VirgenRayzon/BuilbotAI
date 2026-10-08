import { test, expect, type Page } from '@playwright/test';
import { config } from 'dotenv';

config();

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';
test.setTimeout(90000);
const credentials = {
  user: {
    email: process.env.E2E_USER_EMAIL,
    password: process.env.E2E_USER_PASSWORD,
  },
  manager: {
    email: process.env.E2E_MANAGER_EMAIL,
    password: process.env.E2E_MANAGER_PASSWORD,
    key: process.env.E2E_MANAGER_ACCESS_KEY,
  },
  superAdmin: {
    email: process.env.E2E_SUPER_ADMIN_EMAIL,
    password: process.env.E2E_SUPER_ADMIN_PASSWORD,
    key: process.env.E2E_SUPER_ADMIN_ACCESS_KEY,
  },
};

async function signIn(page: Page, role: keyof typeof credentials) {
  const account = credentials[role];
  await page.goto(`${baseURL}/${role === 'user' ? 'signin' : 'system-access'}`);
  if (role === 'superAdmin') {
    await page.getByText('SUPER ADMIN', { exact: true }).click();
  }
  await page.getByLabel('Email Address').fill(account.email!);
  await page.locator('form input[type="password"]').first().fill(account.password!);
  if ('key' in account) {
    await page.locator('form input[type="password"]').nth(1).fill(account.key!);
  }
  if (role === 'user') {
    await page.evaluate(() => {
      (window as any).__signInInterrupted = false;
      (window as any).__legacyLoaderSeen = false;
      const observer = new MutationObserver(() => {
        if (location.pathname === '/signin') {
          if (document.body.textContent?.includes('Verifying your account...')) {
            (window as any).__signInInterrupted = true;
          }
          if (document.body.textContent?.includes('Architecting Experience')) {
            (window as any).__legacyLoaderSeen = true;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  await page.locator('form').getByRole('button', { name: role === 'user' ? 'Sign In' : 'Authenticate Session' }).click();
  await expect(page).toHaveURL(role === 'user' ? /\/builder(?:\?|$)/ : /\/admin(?:\?|$)/, { timeout: 45000 });
  if (role === 'user') {
    expect(await page.evaluate(() => (window as any).__signInInterrupted)).toBe(false);
    expect(await page.evaluate(() => (window as any).__legacyLoaderSeen)).toBe(false);
  }
}

async function recordCustomerNavigation(page: Page) {
  await page.addInitScript(() => {
    (window as any).__customerNavSeen = false;
    const check = () => {
      if (document.querySelector('header nav[aria-label="Main Navigation"] a[href="/builder"]')) {
        (window as any).__customerNavSeen = true;
      }
    };
    const start = () => {
      check();
      new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  });
}

test('customer dashboard stays on the customer route after refresh', async ({ page }) => {
  test.skip(!credentials.user.email || !credentials.user.password, 'Set E2E_USER_* in .env');
  await signIn(page, 'user');
  await page.reload();
  await expect(page).toHaveURL(/\/builder(?:\?|$)/);
  await expect(page.locator('header nav[aria-label="Main Navigation"] a[href="/builder"]')).toBeVisible();
  await page.goto(`${baseURL}/profile`);
  await page.reload();
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
  await page.goBack();
  await expect(page).toHaveURL(/\/builder(?:\?|$)/);
  await page.goForward();
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
});

for (const role of ['manager', 'superAdmin'] as const) {
  test(`${role} dashboard never renders customer navigation on refresh`, async ({ page }) => {
    test.skip(!credentials[role].email || !credentials[role].password || !credentials[role].key, `Set E2E_${role === 'manager' ? 'MANAGER' : 'SUPER_ADMIN'}_* in .env`);
    await signIn(page, role);
    await recordCustomerNavigation(page);

    const documentRequests: string[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'document') documentRequests.push(request.url());
    });
    await page.reload();
    await expect(page.locator('header nav[aria-label="Main Navigation"] a[href="/admin"]')).toBeVisible();
    expect(await page.evaluate(() => (window as any).__customerNavSeen)).toBe(false);
    expect(documentRequests).toHaveLength(1);

    for (const route of ['/admin/prebuilt-builder', '/profile']) {
      await page.goto(`${baseURL}${route}`);
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}(?:\\?|$)`));
      await expect(page.locator('header nav[aria-label="Main Navigation"] a[href="/admin"]')).toBeVisible();
      expect(await page.evaluate(() => (window as any).__customerNavSeen)).toBe(false);
    }
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/prebuilt-builder(?:\?|$)/);
    await page.goForward();
    await expect(page).toHaveURL(/\/profile(?:\?|$)/);

    await page.goto(`${baseURL}/builder`);
    await expect(page).toHaveURL(/\/admin(?:\?|$)/);
  });
}

test('unauthenticated visitors are redirected from protected routes', async ({ page }) => {
  await page.goto(`${baseURL}/builder`);
  await expect(page).toHaveURL(/\/signin(?:\?|$)/);
  await page.goto(`${baseURL}/admin`);
  await expect(page).toHaveURL(/\/system-access(?:\?|$)/);
});

test('customer sign-out removes protected access', async ({ page }) => {
  test.skip(!credentials.user.email || !credentials.user.password, 'Set E2E_USER_* in .env');
  await signIn(page, 'user');
  await page.getByRole('button', { name: 'User account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign Out' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/signin(?:\?|$)/);
  await page.goto(`${baseURL}/builder`);
  await expect(page).toHaveURL(/\/signin(?:\?|$)/);
});

test('delayed staff profile stays on neutral verification UI', async ({ page }) => {
  test.skip(!credentials.manager.email || !credentials.manager.password || !credentials.manager.key, 'Set E2E_MANAGER_* in .env');
  await signIn(page, 'manager');
  await recordCustomerNavigation(page);

  let delayedRequests = 0;
  await page.route('https://firestore.googleapis.com/**', async route => {
    delayedRequests += 1;
    await new Promise(resolve => setTimeout(resolve, 3000));
    await route.continue();
  });

  await page.reload();
  await expect(page.getByText('Verifying your account...')).toBeVisible();
  await expect(page.locator('header nav[aria-label="Main Navigation"] a[href="/admin"]')).toBeVisible({ timeout: 30000 });
  expect(delayedRequests).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__customerNavSeen)).toBe(false);
});
