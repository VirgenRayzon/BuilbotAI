import { test, expect, type Page } from '@playwright/test';
import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { assignProductIdentity } from '../src/lib/server/product-identities';
import { inventoryItemPath } from '../src/lib/inventory-paths';
import type { CreatedProduct } from '../src/lib/product-identity';

test.skip(!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Requires the isolated demo emulator runner.');
test.setTimeout(180000);
test.beforeEach(async ({ page }) => { page.setDefaultTimeout(20000); });
const app = getApps().find(a => a.name === 'qr-browser') || initializeApp({ projectId: 'demo-buildbot-qr' }, 'qr-browser');
const db = getFirestore(app);
let part: CreatedProduct;
let prebuilt: CreatedProduct;
const baseURL = 'http://localhost:9002';

test.beforeAll(async () => {
  for (const role of ['manager', 'user']) {
    const uid = `browser-${role}`;
    await getAuth(app).getUser(uid).catch(() => getAuth(app).createUser({ uid, email: `${role}@test.com`, password: '123456' }));
    await getAuth(app).setCustomUserClaims(uid, { isManager: role === 'manager', isSuperAdmin: false });
    await db.doc(`users/${uid}`).set({ email: `${role}@test.com`, name: role, isManager: role === 'manager', isSuperAdmin: false, ...(role === 'manager' ? { activeManagerKey: '00216764' } : {}) });
  }
  await db.doc('siteSettings/main').set({ isMaintenanceMode: false, isAiKillSwitch: true });
  const ref = db.collection('inventory/mouse/items').doc();
  await ref.set({ name: 'QR Browser Mouse', category: 'Mouse', brand: 'Test', price: 1200, stock: 4, imageUrl: '', specifications: { DPI: '16000' }, description: '- **Precision**: Adjustable sensitivity.', isArchived: false });
  part = await assignProductIdentity(db, ref, 'part', 'Mouse');
  const components: Record<string, string | string[]> = {};
  for (const category of ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler']) {
    const id = `browser-${category}`;
    await db.doc(inventoryItemPath(category, id)).set({ name: `Browser ${category}`, category, brand: 'Test', price: 100, stock: 5, imageUrl: '', specifications: category === 'Storage' ? { Type: 'NVME' } : category === 'Motherboard' ? { 'NVMe Slots': '2', 'SATA Slots': '2', 'RAM Slots': '4' } : {}, isArchived: false });
    components[category.toLowerCase()] = category === 'RAM' ? [id, id] : category === 'Storage' ? [id] : id;
  }
  const system = db.collection('prebuiltSystems').doc();
  await system.set({ name: 'QR Browser PC', tier: 'Entry', price: 900, imageUrl: '', description: 'A complete test system.', components, isArchived: false });
  prebuilt = await assignProductIdentity(db, system, 'prebuilt', 'PC');
});
test.afterAll(async () => { await deleteApp(app); });

async function signIn(page: Page, staff: boolean, returnTo = '') {
  await page.goto(`${baseURL}/${staff ? 'system-access' : `signin${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}`);
  await page.getByRole('textbox', { name: /Email Address/i }).fill(staff ? 'manager@test.com' : 'user@test.com');
  await page.locator('form input[type=password]').first().fill('123456');
  if (staff) await page.locator('form input[type=password]').nth(1).fill('00216764');
  await page.locator('form').getByRole('button', { name: staff ? 'Authenticate Session' : 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(staff ? /\/admin(?:\?|$)/ : returnTo ? new RegExp(returnTo) : /\/builder/, { timeout: 60000 });
}

test('guest catalog, public accessories and prebuilt pages, QR and sign-in return', async ({ page }) => {
  await page.goto(`${baseURL}/parts`);
  await expect(page.getByRole('heading', { name: 'PC parts & accessories' })).toBeVisible();
  await page.getByLabel('Search parts').fill(part.sku);
  await page.getByRole('link', { name: 'View product', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/parts/${part.productId}`));
  await expect(page.getByRole('heading', { name: 'QR Browser Mouse' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '16000' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in to reserve' })).toBeEnabled();
  await page.screenshot({ path: '.tmp/qr-part-desktop.png', fullPage: true });
  await page.goto(`${baseURL}/pre-builts`);
  await expect(page.getByRole('heading', { name: /Pre-Built Systems/i })).toBeVisible();
  await page.goto(`${baseURL}/pre-builts/${prebuilt.productId}`);
  await expect(page.getByRole('heading', { name: 'QR Browser PC' })).toBeVisible();
  await expect(page.getByText('Browser RAM', { exact: true })).toHaveCount(2);
  await page.goto(`${baseURL}/q/${part.qrToken}`);
  await expect(page).toHaveURL(new RegExp(`/parts/${part.productId}`));
  await page.getByRole('button', { name: 'Sign in to reserve' }).click();
  await expect(page).toHaveURL(/\/signin\?returnTo=/);
  await signIn(page, false, `/parts/${part.productId}`);
  await expect(page.getByRole('button', { name: 'Reserve this item' })).toBeEnabled();
});

test('staff QR opens exact item and downloaded PNG contains approved hosted URL', async ({ page }) => {
  await signIn(page, true);
  await page.goto(`${baseURL}/q/${part.qrToken}`);
  await expect(page).toHaveURL(new RegExp(`/admin\\?tab=stock&product=${part.productId}`));
  await expect(page.getByRole('heading', { name: 'QR Browser Mouse' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download QR' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${part.sku}.png`);
  const path = await file.path();
  expect(path).toBeTruthy();
  const image = PNG.sync.read(await readFile(path!));
  expect(jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data).toBe(`https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app/q/${part.qrToken}`);
  await page.screenshot({ path: '.tmp/qr-admin-focus.png', fullPage: true });
  await page.goto(`${baseURL}/q/${prebuilt.qrToken}`);
  await expect(page).toHaveURL(new RegExp(`/admin\\?tab=prebuilts&product=${prebuilt.productId}`));
  await expect(page.getByRole('heading', { name: 'QR Browser PC' })).toBeVisible();
});

test('Add Part previews allocate nothing, save assigns identifiers, editing preserves them', async ({ page }) => {
  await signIn(page, true);
  const counter = (await db.doc('catalogCounters/products').get()).get('value');
  await page.getByRole('button', { name: 'Add Part', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Assigned automatically on save')).toBeVisible();
  expect((await db.doc('catalogCounters/products').get()).get('value')).toBe(counter);
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Mouse', exact: true }).click();
  await expect(dialog.getByText('SKU-MOU…', { exact: true })).toBeVisible();
  const name = `UI Created Mouse ${randomUUID().slice(0, 8)}`;
  await dialog.getByLabel('Part Name', { exact: true }).fill(name);
  await dialog.getByLabel('Brand', { exact: true }).fill('Test');
  await dialog.getByLabel(/Price/).fill('500');
  await dialog.getByLabel(/Stock/).fill('3');
  await dialog.getByRole('button', { name: 'Save Component' }).click();
  await expect(dialog).toBeHidden({ timeout: 60000 });
  await page.getByRole('button', { name: 'View item', exact: true }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download QR' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit part', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Product identification')).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/PRD-\d{6,}/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Regenerate/ })).toHaveCount(0);
});

test('mobile public product has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/parts/${part.productId}`);
  await expect(page.getByRole('heading', { name: 'QR Browser Mouse' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.tmp/qr-part-mobile.png', fullPage: true });
});

test('Add System previews and save use the shared PRD sequence and PC SKU', async ({ page }) => {
  await signIn(page, true);
  await page.getByRole('tab', { name: /Manage Prebuilts/i }).click();
  await page.getByRole('button', { name: 'Add System', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add New Prebuilt System', exact: true });
  await expect(dialog.getByText('Assigned automatically on save')).toBeVisible();
  await expect(dialog.getByText('SKU-PC…', { exact: true })).toBeVisible();
  const name = `UI Created PC ${randomUUID().slice(0, 8)}`;
  await dialog.getByLabel('System Name', { exact: true }).fill(name);
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /^Entry/ }).click();
  for (const category of ['CPU', 'Motherboard', 'GPU', 'Cooler', 'PSU', 'Case']) {
    await dialog.getByRole('combobox', { name: new RegExp(`^Select ${category}`) }).click();
    if (category === 'CPU') await page.screenshot({ path: '.tmp/qr-system-popup.png' });
    await page.getByRole('button', { name: new RegExp(`Browser ${category}`) }).click();
  }
  await dialog.getByRole('combobox', { name: /^Select RAM Module/ }).first().click();
  await page.getByRole('button', { name: /Browser RAM/ }).click();
  await dialog.getByRole('combobox', { name: /^Select NVMe/ }).first().click();
  await page.getByRole('button', { name: /Browser Storage/ }).click();
  await dialog.getByRole('button', { name: 'Deploy System', exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 60000 });
  await page.getByRole('button', { name: 'View item', exact: true }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText(/SKU-PC[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/).first()).toBeVisible();
});
