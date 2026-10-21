import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getFirestore as adminFirestore } from 'firebase-admin/firestore';
import { getAuth as adminAuth } from 'firebase-admin/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDoc, terminate } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { NextRequest } from 'next/server';
import { SKU_CATEGORY_CODES, formatProductId, productUrl, qrUrl, safeProductReturn, safeStaffProductReturn } from '../src/lib/product-identity';
import { assignProductIdentity } from '../src/lib/server/product-identities';
import { createCatalogProduct, updateCatalogPart } from '../src/app/product-actions';
import { reservePublicProduct } from '../src/app/public-product-actions';
import { getPublicProduct } from '../src/lib/server/public-products';
import { GET as resolveQR } from '../src/app/api/qr/[token]/route';
import { inventoryItemPath } from '../src/lib/inventory-paths';
import { reservePrebuiltSystem } from '../src/app/prebuilt-reservation-actions';
import type { CreatedProduct } from '../src/lib/product-identity';
import type { OrderItem } from '../src/lib/types';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Run this suite only through Firebase emulators.');
const projectId = 'demo-buildbot-qr';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = projectId;
const admin = initializeAdmin({ projectId });
const db = adminFirestore(admin);
const app = initializeApp({ projectId, apiKey: 'fake-api-key', authDomain: 'localhost' }, 'qr-tests');
const clientDb = getFirestore(app);
connectFirestoreEmulator(clientDb, '127.0.0.1', 8088);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
let managerToken: string;
let customerToken: string;
let saved: CreatedProduct;
const payload = (name: string, category = 'CPU') => ({ name, category, brand: 'Test', price: 100, stock: 5,
  imageUrl: '', images: [], specifications: { Socket: 'AM5' }, description: '- **Feature**: Test product' });
const request = (name: string, category = 'CPU') => ({ kind: 'part', payload: payload(name, category), idToken: managerToken, operationId: randomUUID(), fingerprint: 'a'.repeat(64) });

before(async () => {
  for (const role of ['manager', 'customer']) {
    await adminAuth(admin).createUser({ uid: role, email: `${role}@qr.test`, password: '12345678' });
    if (role === 'manager') await adminAuth(admin).setCustomUserClaims(role, { isManager: true });
    await db.doc(`users/${role}`).set({ email: `${role}@qr.test`, name: role, isManager: role === 'manager', isSuperAdmin: false });
    const user = await signInWithEmailAndPassword(auth, `${role}@qr.test`, '12345678');
    const token = await user.user.getIdToken(true);
    if (role === 'manager') managerToken = token; else customerToken = token;
  }
});
after(async () => { await terminate(clientDb); await deleteApp(app); await deleteAdmin(admin); });

test('approved SKU codes and PRD sequence formatting', () => {
  assert.deepEqual(Object.values(SKU_CATEGORY_CODES), ['CPU', 'GPU', 'MTB', 'RAM', 'STG', 'PSU', 'CSE', 'CLR', 'MNT', 'KBD', 'MOU', 'HDT']);
  assert.equal(formatProductId(123), 'PRD-000123');
  assert.equal(formatProductId(1000000), 'PRD-1000000');
  assert.throws(() => formatProductId(0));
  assert.equal(safeProductReturn('//evil.test'), '/builder');
  assert.equal(safeProductReturn('/admin'), '/builder');
  assert.equal(safeProductReturn('/parts/PRD-000123'), '/parts/PRD-000123');
  assert.equal(safeStaffProductReturn('/admin?tab=stock&product=PRD-000123'), '/admin?tab=stock&product=PRD-000123');
  assert.equal(safeStaffProductReturn('//evil.test/admin'), '/admin');
});

test('concurrent creates share one sequence and all category formats', async () => {
  const records = await Promise.all(Object.entries(SKU_CATEGORY_CODES).map(([category, code]) => createCatalogProduct(request(`Concurrent ${code}`, category))));
  const system = await createCatalogProduct({ ...request('Concurrent PC'), kind: 'prebuilt', payload: { name: 'Concurrent PC', price: 800, imageUrl: '', tier: 'Entry', components: { ram: [], storage: [] } } });
  records.push(system);
  assert.equal(new Set(records.map(p => p.productId)).size, 13);
  assert.equal(new Set(records.map(p => p.sku)).size, 13);
  assert.equal((await db.doc('catalogCounters/products').get()).get('value'), 13);
  for (let i = 0; i < records.length; i++) assert.match(records[i].sku, new RegExp(`^SKU-${[...Object.values(SKU_CATEGORY_CODES), 'PC'][i]}[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$`));
  saved = records[0];
});

test('lost-response retries reuse identity; changed payload and duplicate names are rejected', async () => {
  const input = request('Retry-safe CPU');
  const [first, replay] = await Promise.all([createCatalogProduct(input), createCatalogProduct(input)]);
  assert.deepEqual(first, replay);
  await assert.rejects(createCatalogProduct({ ...input, fingerprint: 'b'.repeat(64) }), /different form/);
  await assert.rejects(createCatalogProduct({ ...input, payload: { ...input.payload, name: 'Changed payload with same claimed hash' } }), /different form/);
  await assert.rejects(createCatalogProduct(request('retry-safe cpu', 'GPU')), /already exists/);
  const query = await db.collection('inventory/cpu/items').where('name', '==', 'Retry-safe CPU').get();
  assert.equal(query.size, 1);
});

test('metadata migration preserves stock, references and identity on rerun', async () => {
  const ref = db.doc('inventory/gpu/items/legacy-id');
  await ref.set({ ...payload('Legacy GPU', 'GPU'), stock: 7, legacyReference: 'keep' });
  const first = await assignProductIdentity(db, ref, 'part', 'GPU');
  const second = await assignProductIdentity(db, ref, 'part', 'GPU');
  assert.deepEqual(first, second);
  assert.equal(first.id, 'legacy-id');
  assert.equal((await ref.get()).get('stock'), 7);
  assert.equal((await ref.get()).get('legacyReference'), 'keep');
});

test('customer cannot allocate IDs; client staff cannot forge metadata or read registries', async () => {
  await assert.rejects(createCatalogProduct({ ...request('Denied'), idToken: customerToken }), /authorized/);
  await signInWithEmailAndPassword(auth, 'manager@qr.test', '12345678');
  const ref = doc(clientDb, 'inventory/cpu/items', saved.id);
  await assert.rejects(updateDoc(ref, { productId: 'PRD-999999' }), /permission/i);
  await assert.rejects(updateDoc(ref, { sku: 'SKU-CPU22222222' }), /permission/i);
  await assert.rejects(setDoc(doc(clientDb, 'inventory/cpu/items/forged'), payload('Forged')), /permission/i);
  await assert.rejects(getDoc(doc(clientDb, 'productIds', saved.productId)), /permission/i);
  await assert.rejects(setDoc(doc(clientDb, 'catalogCounters/products'), { value: 1000 }), /permission/i);
  await updateDoc(ref, { price: 101 });
});

test('public DTO omits internal IDs and category moves retain URL/SKU/QR', async () => {
  const before = await getPublicProduct(saved.productId, 'part');
  assert.ok(before);
  assert.equal(JSON.stringify(before).includes(saved.id), false);
  assert.equal('stock' in before, false);
  await updateCatalogPart({ idToken: managerToken, id: saved.id, category: 'CPU', payload: { category: 'GPU', name: 'Moved product' } });
  const after = await getPublicProduct(saved.productId, 'part');
  assert.equal(after?.category, 'GPU');
  assert.equal(after?.sku, saved.sku);
  assert.equal(after?.qrToken, saved.qrToken);
  assert.equal((await db.doc(`inventory/cpu/items/${saved.id}`).get()).exists, false);
  assert.equal((await db.doc(`productIds/${saved.productId}`).get()).get('path'), `inventory/gpu/items/${saved.id}`);
});

test('QR routes guests/customers to public URL and verified staff to exact inventory item', async () => {
  const call = (token?: string) => resolveQR(new NextRequest(`http://localhost:9002/api/qr/${saved.qrToken}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }), { params: Promise.resolve({ token: saved.qrToken }) });
  for (const token of [undefined, customerToken]) {
    const response = await call(token);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).destination, productUrl('part', saved.productId));
    assert.match(response.headers.get('cache-control') || '', /no-store/);
  }
  assert.equal((await (await call(managerToken)).json()).destination, saved.adminUrl);
  assert.equal((await call('forged')).status, 401);
  await db.doc(`inventory/gpu/items/${saved.id}`).update({ isArchived: true });
  assert.equal((await call()).status, 410);
  assert.equal((await call(managerToken)).status, 200);
  await db.doc(`inventory/gpu/items/${saved.id}`).update({ isArchived: false });
});

test('downloaded QR PNG decodes to selected hosted origin', async () => {
  const encoded = await QRCode.toBuffer(qrUrl(saved.qrToken), { margin: 4, width: 768, color: { dark: '#000000ff', light: '#ffffffff' } });
  const png = PNG.sync.read(encoded);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.equal(decoded?.data, `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app/q/${saved.qrToken}`);
  assert.throws(() => qrUrl(saved.qrToken, 'http://localhost:9002'));
  assert.throws(() => qrUrl(saved.qrToken, 'https://example.com/path'));
});

test('reservations count repeated RAM, reject shortages and replay without double deduction', async () => {
  const components: Record<string, string | string[]> = {};
  for (const category of ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler']) {
    const id = `reserve-${category}`;
    await db.doc(inventoryItemPath(category, id)).set({ ...payload(`Reserve ${category}`, category), stock: category === 'RAM' ? 2 : 1 });
    components[category.toLowerCase()] = category === 'RAM' ? [id, id, id] : category === 'Storage' ? [id] : id;
  }
  const systemRef = db.collection('prebuiltSystems').doc();
  await systemRef.set({ name: 'Reservation PC', price: 1000, tier: 'Entry', components });
  const system = await assignProductIdentity(db, systemRef, 'prebuilt', 'PC');
  const input = { productId: system.productId, idToken: customerToken, operationId: randomUUID() };
  await assert.rejects(reservePublicProduct(input), /enough stock/);
  assert.equal((await db.doc('inventory/cpu/items/reserve-CPU').get()).get('stock'), 1);
  await db.doc('inventory/ram/items/reserve-RAM').update({ stock: 3 });
  const first = await reservePublicProduct(input);
  assert.deepEqual(await reservePublicProduct(input), first);
  assert.equal((await db.doc('inventory/ram/items/reserve-RAM').get()).get('stock'), 0);
  assert.equal((await db.doc('inventory/cpu/items/reserve-CPU').get()).get('stock'), 0);
  const order = (await db.doc(`orders/${first.orderId}`).get()).data();
  assert.equal(order?.items.filter((p: OrderItem) => p.category === 'RAM').length, 3);
  assert.equal(order?.totalPrice, 1000);
});

test('concurrent reservations cannot oversell the last item', async () => {
  const ref = db.doc('inventory/mouse/items/last-item');
  await ref.set({ ...payload('Last Mouse', 'Mouse'), stock: 1 });
  const identity = await assignProductIdentity(db, ref, 'part', 'Mouse');
  const results = await Promise.allSettled([1, 2].map(() => reservePublicProduct({ productId: identity.productId, idToken: customerToken, operationId: randomUUID() })));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected').length, 1);
  assert.equal((await ref.get()).get('stock'), 0);
});

test('legacy reservation action also requires authenticated customer identity', async () => {
  const result = await reservePrebuiltSystem('customer', 'customer@qr.test', 'Customer', { id: 'unknown', name: 'Forged', price: 1 }, {});
  assert.equal(result.success, false);
});

test('legacy name references resolve without exposing missing internal references', async () => {
  const cpu = db.doc('inventory/cpu/items/named-cpu');
  await cpu.set({ ...payload('Legacy CPU / Box'), stock: 2 });
  const ref = db.collection('prebuiltSystems').doc();
  await ref.set({ name: 'Named references', tier: 'Entry', price: 100, components: { cpu: 'Legacy CPU / Box', gpu: 'private-missing-id', ram: [], storage: [] } });
  const identity = await assignProductIdentity(db, ref, 'prebuilt', 'PC');
  const product = await getPublicProduct(identity.productId, 'prebuilt');
  assert.equal(product?.components.find(p => p.category === 'CPU')?.name, 'Legacy CPU / Box');
  assert.equal(JSON.stringify(product).includes('private-missing-id'), false);
});

test('a price change rejects a reservation before stock is deducted', async () => {
  const ref = db.doc('inventory/headset/items/price-change');
  await ref.set({ ...payload('Price change headset', 'Headset'), stock: 2, price: 500 });
  const identity = await assignProductIdentity(db, ref, 'part', 'Headset');
  await assert.rejects(reservePublicProduct({ productId: identity.productId, idToken: customerToken, operationId: randomUUID(), expectedPrice: 100 }), /Pricing has changed/);
  assert.equal((await ref.get()).get('stock'), 2);
});
