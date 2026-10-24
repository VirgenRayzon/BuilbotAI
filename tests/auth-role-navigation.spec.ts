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
  test(`${role} credentials are rejected on customer sign-in`, async ({ page }) => {
    test.skip(!credentials[role].email || !credentials[role].password, `Set E2E_${role === 'manager' ? 'MANAGER' : 'SUPER_ADMIN'}_* in .env`);
    const visitedPaths: string[] = [];
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) visitedPaths.push(new URL(frame.url()).pathname);
    });

    await page.goto(`${baseURL}/signin`);
    await page.getByLabel('Email Address').fill(credentials[role].email!);
    await page.locator('form input[type="password"]').fill(credentials[role].password!);
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('This is a staff account. Sign in through System Access with your access key.')).toBeVisible({ timeout: 45000 });
    await expect(page).toHaveURL(/\/signin(?:\?|$)/);
    expect(visitedPaths).not.toContain('/system-access');
    expect(visitedPaths).not.toContain('/admin');

    await page.goto(`${baseURL}/builder`);
    await expect(page).toHaveURL(/\/signin(?:\?|$)/);
  });

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
  await expect(page.getByText('Verifying your account...').first()).toBeVisible();
  await expect(page.locator('header nav[aria-label="Main Navigation"] a[href="/admin"]')).toBeVisible({ timeout: 30000 });
  expect(delayedRequests).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__customerNavSeen)).toBe(false);
});

test('advisor loads on first visit and keeps a pending job across client navigation', async ({ page }) => {
  test.skip(!credentials.user.email || !credentials.user.password, 'Set E2E_USER_* in .env');
  await signIn(page, 'user');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let requests = 0;
  let releaseResponse: (() => void) | undefined;
  await page.route('**/api/ai/build-advisor/recommendations', async route => {
    requests++;
    await new Promise<void>(resolve => { releaseResponse = resolve; });
    await route.fulfill({ status: 400, json: { error: 'Performance regression test completed.' } }).catch(() => {});
  });
  try {
    await page.locator('header nav a[href="/ai-build-advisor"]').click();
    await expect(page.getByRole('textbox', { name: 'Intended Use', exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Intended Use', exact: true }).click();
    await page.getByRole('option', { name: 'Gaming', exact: true }).click();
    await page.getByRole('textbox', { name: 'Gaming priority', exact: true }).click();
    await page.getByRole('option', { name: 'Balanced 1440p gaming', exact: true }).click();
    await page.getByLabel('Budget', { exact: true }).fill('50000');
    await page.getByRole('button', { name: 'Get Recommendations', exact: true }).click();
    await expect.poll(() => requests).toBe(1);
    await expect(page.getByRole('button', { name: 'Stop Generation' })).toBeVisible();
    await page.locator('header nav a[href="/builder"]').click();
    await expect(page).toHaveURL(/\/builder(?:\?|$)/);
    await page.locator('header nav a[href="/ai-build-advisor"]').click();
    await expect(page.getByRole('button', { name: 'Stop Generation' })).toBeVisible();
    expect(requests).toBe(1);
    await page.getByRole('button', { name: 'Stop Generation' }).click();
    await expect(page.getByRole('button', { name: 'Get Recommendations', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    releaseResponse?.();
  }
});

for (const role of ['manager', 'superAdmin'] as const) {
  test(`${role} sign-out removes protected access without listener errors`, async ({ page }) => {
    test.skip(!credentials[role].email || !credentials[role].password || !credentials[role].key, 'Set E2E staff credentials in .env');
    await signIn(page, role);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.getByRole('button', { name: 'User account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign Out' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/system-access(?:\?|$)/);
    await page.goto(`${baseURL}/admin`);
    await expect(page).toHaveURL(/\/system-access(?:\?|$)/);
    expect(errors).toEqual([]);
  });
}

test('builder details, analyzer and chat work after loading on demand', async ({ page }) => {
  test.skip(!credentials.user.email || !credentials.user.password, 'Set E2E_USER_* in .env');
  await signIn(page, 'user');
  const firstImage = page.locator('main img').first();
  await expect(firstImage).toBeVisible({ timeout: 30000 });
  const name = await firstImage.getAttribute('alt');
  await firstImage.click();
  const details = page.getByRole('dialog');
  await expect(details.getByRole('heading', { name: name!, exact: true })).toBeVisible();
  await details.getByRole('button', { name: 'Close product details', exact: true }).click();
  await expect(details).toHaveCount(0);
  // Reopening uses the loaded dialog and keeps its gallery functional.
  await firstImage.click();
  await expect(details.getByRole('heading', { name: name!, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByText('Analyzer', { exact: true }).first().click();
  await expect(page.getByText('Select a CPU and GPU to calculate real-time FPS estimates.', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Open Buildbot chat', exact: true }).click();
  const message = page.getByRole('textbox', { name: 'Message Buildbot AI', exact: true });
  await expect(message).toBeVisible();
  await message.fill('Keep this draft while the chat is closed');
  await page.getByRole('button', { name: 'Close Buildbot chat', exact: true }).click();
  await page.getByRole('button', { name: 'Open Buildbot chat', exact: true }).click();
  await expect(message).toHaveValue('Keep this draft while the chat is closed');
});

test('incomplete pre-built explains missing parts after loading into builder', async ({ page }) => {
  test.skip(!credentials.user.email || !credentials.user.password, 'Set E2E_USER_* in .env');
  await signIn(page, 'user');
  await page.goto(`${baseURL}/pre-builts`);

  const incompleteCard = page.locator('a').filter({ hasText: 'Missing Parts' }).first();
  await expect(incompleteCard).toBeVisible({ timeout: 30000 });
  await incompleteCard.getByRole('button', { name: 'Customize Pre-built', exact: true }).click();

  await expect(page).toHaveURL(/\/builder(?:\?|$)/);
  const notifications = page.getByLabel('Notifications (F8)');
  await expect(notifications.getByText(/Pre-built loaded with \d+ missing part/).first()).toBeVisible({ timeout: 30000 });
  const loadDescription = notifications.getByText(/available components? loaded\. Add .+ to complete/i).first();
  await expect(loadDescription).toBeVisible();

  const reportedLoadedCount = Number((await loadDescription.textContent())?.match(/^(\d+) available component/)?.[1]);
  expect(reportedLoadedCount).toBeGreaterThan(0);
  await expect(page.getByText(`${reportedLoadedCount} / 8 Parts`, { exact: true }).first()).toBeVisible();
});

test('admin editors and all permitted tabs remain available after code splitting', async ({ page }) => {
  test.skip(!credentials.superAdmin.email || !credentials.superAdmin.password || !credentials.superAdmin.key, 'Set E2E_SUPER_ADMIN_* in .env');
  await signIn(page, 'superAdmin');
  const image = page.locator('main img').first();
  await expect(image).toBeVisible({ timeout: 30000 });
  const name = await image.getAttribute('alt');
  await image.click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Edit Component', exact: true })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Part Name', exact: true })).toHaveValue(name!);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Add Part', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Add New Component', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  for (const tab of ['Manage Prebuilts', 'Reservations', 'Sales & Analytics', 'Archive', 'Audit Logs', 'Management Portal', 'AI']) {
    await page.getByRole('tab', { name: tab, exact: tab !== 'AI' }).first().click();
    const panel = page.getByRole('tabpanel').first();
    await expect(panel).toBeVisible();
    await expect(panel).not.toContainText('Loading section...');
    await expect(panel.locator('button:visible, input:visible, table:visible, [role="combobox"]:visible').first()).toBeVisible({ timeout: 20000 });
  }
});

for (const width of [390, 1440]) {
  for (const role of ['user', 'superAdmin'] as const) {
    test(`${role} inventory images match the visible grid at ${width}px`, async ({ page }) => {
      test.skip(!credentials[role].email || !credentials[role].password, 'Set E2E credentials in .env');
      await page.setViewportSize({ width, height: 900 });
      await signIn(page, role);
      const images = page.locator('main img');
      await expect(images.first()).toBeVisible({ timeout: 30000 });
      await expect.poll(() => images.first().evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(page.locator('main img[fetchpriority="high"]')).toHaveCount(width < 640 ? 1 : 4);
      await expect(images.first()).not.toHaveAttribute('loading', 'lazy');
      await expect(images.nth(width < 640 ? 1 : 4)).toHaveAttribute('loading', 'lazy');
      if (width === 1440) {
        const size = await images.first().evaluate(element => ({ natural: (element as HTMLImageElement).naturalWidth, rendered: element.getBoundingClientRect().width }));
        expect(size.natural).toBeGreaterThanOrEqual(size.rendered);
        expect(size.natural).toBeLessThan(size.rendered * 2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
