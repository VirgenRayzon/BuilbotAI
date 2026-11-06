import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import { listAdminInventoryPage } from '../src/lib/server/admin-inventory-queries';
import { deriveInventoryQueryFields } from '../src/lib/inventory-query-fields';
import { listRelatedPublicParts } from '../src/lib/server/public-products';
import { listPublicCatalogPage } from '../src/lib/server/public-catalog-queries';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Run this suite only through Firebase emulators.');
}

const projectId = 'demo-buildbot-qr';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = projectId;
const admin = initializeAdmin({ projectId });
const db = getFirestore(admin);
const authAdmin = getAdminAuth(admin);
const clientApp = initializeApp({ projectId, apiKey: 'fake-api-key', authDomain: 'localhost' }, 'inventory-query-client');
const clientAuth = getAuth(clientApp);
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9098', { disableWarnings: true });
let staffToken: string;
let customerToken: string;

before(async () => {
  for (const role of ['staff', 'customer'] as const) {
    const uid = `inventory_query_${role}`;
    const email = `${role}@inventory-query.test`;
    try { await authAdmin.deleteUser(uid); } catch { /* absent */ }
    await authAdmin.createUser({ uid, email, password: 'password123' });
    if (role === 'staff') await authAdmin.setCustomUserClaims(uid, { isManager: true });
    await db.doc(`users/${uid}`).set({ email, isManager: role === 'staff', isSuperAdmin: false });
  }
  const items = [
    { category: 'CPU', slug: 'cpu', id: 'query_cpu_a', productId: 'PRD-888801', name: 'Alpha CPU', createdAt: new Date('2026-01-01') },
    { category: 'GPU', slug: 'gpu', id: 'query_gpu_b', productId: 'PRD-888802', name: 'Beta GPU', createdAt: new Date('2026-02-01') },
    { category: 'GPU', slug: 'gpu', id: 'query_gpu_c', productId: 'PRD-888803', name: 'Archived GPU', createdAt: new Date('2026-03-01'), isArchived: true },
  ];
  for (const item of items) {
    const fields = deriveInventoryQueryFields({ ...item, stock: 1 });
    await db.doc(`inventory/${item.slug}/items/${item.id}`).set({ ...item, ...fields, price: 100, stock: 1, brand: 'Test' });
  }
  staffToken = await (await signInWithEmailAndPassword(clientAuth, 'staff@inventory-query.test', 'password123')).user.getIdToken(true);
  customerToken = await (await signInWithEmailAndPassword(clientAuth, 'customer@inventory-query.test', 'password123')).user.getIdToken(true);
});

after(async () => {
  for (const path of ['inventory/cpu/items/query_cpu_a', 'inventory/gpu/items/query_gpu_b', 'inventory/gpu/items/query_gpu_c']) {
    await db.doc(path).delete();
  }
  await deleteApp(clientApp);
  await deleteAdmin(admin);
});

test('staff receives complete count and bounded cursor pages across categories', async () => {
  const first = await listAdminInventoryPage(staffToken, { categories: ['CPU', 'GPU'], pageSize: 1 });
  assert.equal(first.count, 2);
  assert.deepEqual(first.parts.map(part => part.id), ['query_gpu_b']);
  assert.ok(first.nextCursor);
  const second = await listAdminInventoryPage(staffToken, { categories: ['CPU', 'GPU'], pageSize: 1, cursor: first.nextCursor });
  assert.deepEqual(second.parts.map(part => part.id), ['query_cpu_a']);
  assert.equal(second.nextCursor, null);
});

test('customer cannot query staff inventory pages', async () => {
  await assert.rejects(() => listAdminInventoryPage(customerToken, { categories: ['CPU'] }), /Staff access required/);
});

test('related public parts stay within the selected category and exclude archived items', async () => {
  const related = await listRelatedPublicParts('GPU', 'PRD-888899');
  assert.deepEqual(related.map(part => part.productId), ['PRD-888802']);
  assert.deepEqual(await listRelatedPublicParts('unsupported', 'PRD-888899'), []);
  process.env.NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED = 'true';
  try {
    const indexed = await listRelatedPublicParts('GPU', 'PRD-888899');
    assert.deepEqual(indexed.map(part => part.productId), ['PRD-888802']);
  } finally {
    delete process.env.NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED;
  }
});

test('public first page is bounded, ordered by availability, and cursor-paginated', async () => {
  const references = Array.from({ length: 9 }, (_, index) => db.doc(`inventory/cpu/items/public_page_${index}`));
  try {
    await Promise.all(references.map((ref, index) => {
      const product = { category: 'CPU', name: `Paged CPU ${index}`, brand: 'Test', productId: `PRD-8890${String(index).padStart(2, '0')}`,
        createdAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}`), stock: index === 8 ? 0 : 1, price: 100 };
      return ref.set({ ...product, ...deriveInventoryQueryFields(product) });
    }));
    const first = await listPublicCatalogPage();
    assert.equal(first.count, 11);
    assert.equal(first.products.length, 8);
    assert.ok(first.products.every(product => product.inStock));
    assert.ok(first.nextCursor);
    const second = await listPublicCatalogPage(first.nextCursor);
    assert.equal(second.products.length, 3);
    assert.equal(second.products.at(-1)?.productId, 'PRD-889008');
    assert.equal(second.nextCursor, null);
    await assert.rejects(() => listPublicCatalogPage('bad!'), /Invalid/);
  } finally {
    await Promise.all(references.map(ref => ref.delete()));
  }
});
