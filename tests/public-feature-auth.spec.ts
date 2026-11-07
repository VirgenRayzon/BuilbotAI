import { expect, test, type Page } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';
const featureSignIn = /\/signin\?reason=feature_required$/;

async function expectFeatureSignIn(page: Page) {
  await expect(page).toHaveURL(featureSignIn);
  await expect(page.getByText('You need to sign in to use this feature.', { exact: true })).toBeVisible();
}

test('guest builder cart, instant checkout, and AI actions require sign-in before validation', async ({ page }) => {
  await page.goto(`${baseURL}/builder`);
  await page.getByRole('button', { name: 'Add Rig to Cart' }).click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}/builder`);
  await page.getByRole('button', { name: 'Buy Rig Now' }).click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}/builder`);
  await page.getByRole('button', { name: 'Analyze build' }).click();
  await expectFeatureSignIn(page);
});

test('guest instant checkout from a restored cart requires sign-in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('buildbot_ecommerce_cart_v1', JSON.stringify([
      {
        id: 'restored-part',
        productId: 'PRD-123456',
        kind: 'part',
        name: 'Restored Test Part',
        price: 1000,
        quantity: 1,
        category: 'CPU',
      },
    ]));
  });
  await page.goto(`${baseURL}/parts`);
  await page.getByRole('button', { name: 'Open shopping cart (1 items)' }).click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expectFeatureSignIn(page);
});

test('guest parts catalog and product actions require sign-in', async ({ page }) => {
  await page.goto(`${baseURL}/parts`);
  const quickAdd = page.getByRole('button', { name: /^Add .+ to cart$/ }).first();
  await expect(quickAdd).toBeVisible({ timeout: 30000 });
  await quickAdd.click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}/parts`);
  const detailHref = await page.getByRole('link', { name: 'View product' }).first().getAttribute('href');
  expect(detailHref).toBeTruthy();
  await page.goto(`${baseURL}${detailHref}`);
  await expect(page.getByRole('button', { name: 'Check with my build' })).toBeVisible();
  await page.getByRole('button', { name: 'Check with my build' }).click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}${detailHref}`);
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}${detailHref}`);
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expectFeatureSignIn(page);
});

test('guest prebuilt customization and purchase actions require sign-in', async ({ page }) => {
  await page.goto(`${baseURL}/pre-builts`);
  const firstAction = page.getByRole('button', { name: /Customize Pre-built|Add System to Cart/ }).first();
  await expect(firstAction).toBeVisible({ timeout: 30000 });

  await firstAction.click();
  await expectFeatureSignIn(page);

  await page.goto(`${baseURL}/pre-builts`);
  const detailLink = page.locator('a[href^="/pre-builts/PRD-"]').first();
  await expect(detailLink).toBeVisible({ timeout: 30000 });
  await detailLink.click();
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expectFeatureSignIn(page);
});
