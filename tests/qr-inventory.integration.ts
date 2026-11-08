import { getOrderActivity } from '../src/app/admin/order-activity-actions';
import { reconcileOrderRefundByStaff, refundOrderByStaff } from '../src/app/admin/order-refund-actions';
import { manageReservation } from '../src/app/admin/reservation-actions';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test, mock } from 'node:test';
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
import {
  createCheckoutOrder,
  resolveSimulatedPayment,
  switchOrderPaymentToCod,
  updateOrderPaymentStatusByStaff,
  updateReservationStatus,
  updateOrderFulfillmentStageByStaff,
} from '../src/app/checkout-actions';
import { getPublicProduct } from '../src/lib/server/public-products';
import { GET as resolveQR } from '../src/app/api/qr/[token]/route';
import { inventoryItemPath } from '../src/lib/inventory-paths';
import { reservePrebuiltSystem } from '../src/app/prebuilt-reservation-actions';
import type { CreatedProduct } from '../src/lib/product-identity';
import type { OrderItem } from '../src/lib/types';
import { auditQRHealth } from '../src/lib/server/qr-health';
import { GET as qrHealth } from '../src/app/api/admin/qr-health/route';

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
  assert.equal(safeStaffProductReturn('/admin?tab=stock&product=PRD-000123&action=stock'), '/admin?tab=stock&product=PRD-000123&action=stock');
  assert.equal(safeStaffProductReturn('//evil.test/admin'), '/admin');
});

test('concurrent creates share one sequence and all category formats', async () => {
  const records = await Promise.all(Object.entries(SKU_CATEGORY_CODES).map(([category, code]) => createCatalogProduct(request(`Concurrent ${code}`, category))));
  const system = await createCatalogProduct({ ...request('Concurrent PC'), kind: 'prebuilt', payload: { name: 'Concurrent PC', price: 800, imageUrl: '', tier: 'Entry', components: { cpu: records[0].id, gpu: records[1].id, motherboard: records[2].id, ram: [records[3].id], storage: [records[4].id], psu: records[5].id, case: records[6].id, cooler: records[7].id } } });
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
  assert.equal((await (await call(managerToken)).json()).destination, `${saved.adminUrl}&action=stock`);
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

test('QR failures are typed, never cached, and scanning never changes stock', async () => {
  const ref = db.doc(`inventory/gpu/items/${saved.id}`);
  const stock = (await ref.get()).get('stock');
  const call = (token = saved.qrToken, bearer?: string) => resolveQR(new NextRequest(`http://localhost:9002/api/qr/${token}`, { headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} }), { params: Promise.resolve({ token }) });
  const check = async (response: Response, status: number, code: string) => {
    assert.equal(response.status, status);
    assert.equal((await response.json()).code, code);
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    assert.equal(response.headers.get('vary'), 'Authorization');
  };
  await check(await call('invalid'), 404, 'INVALID_QR');
  await check(await call('0'.repeat(32)), 404, 'UNAVAILABLE');
  await check(await call(saved.qrToken, 'forged'), 401, 'AUTH_EXPIRED');
  await db.doc(`qrLinks/${saved.qrToken}`).update({ enabled: false });
  await check(await call(), 404, 'UNAVAILABLE');
  await db.doc(`qrLinks/${saved.qrToken}`).update({ enabled: true });
  assert.equal((await call()).status, 200);
  await db.doc('users/manager').update({ isManager: false });
  await check(await call(saved.qrToken, managerToken), 401, 'AUTH_EXPIRED');
  await db.doc('users/manager').update({ isManager: true });
  const broken = 'f'.repeat(32);
  await db.doc(`qrLinks/${broken}`).set({ productId: saved.productId, enabled: true });
  await check(await call(broken), 503, 'SERVICE_UNAVAILABLE');
  await db.doc(`qrLinks/${broken}`).delete();
  const failure = mock.method(db, 'doc', () => { throw new Error('Simulated database outage'); });
  try { await check(await call(), 503, 'SERVICE_UNAVAILABLE'); } finally { failure.mock.restore(); }
  assert.equal((await ref.get()).get('stock'), stock);
  assert.equal(safeProductReturn(`/q/${saved.qrToken}`), `/q/${saved.qrToken}`);
  assert.equal(safeProductReturn(`/q/${saved.qrToken}?next=https://evil.test`), '/builder');
});

test('health report detects defects and missing targets without modifying catalog or registries', async () => {
  const ref = db.doc('inventory/mouse/items/health-fixture');
  await ref.set({ ...payload('Health fixture', 'Mouse'), productId: saved.productId, sku: 'malformed', qrToken: saved.qrToken });
  await db.doc('productIds/PRD-999998').set({ path: 'inventory/mouse/items/deleted', kind: 'part' });
  await db.doc('inventory/mouse/items/health-missing').set(payload('Missing identity', 'Mouse'));
  const productRef = db.doc(`inventory/gpu/items/${saved.id}`);
  await productRef.update({ isArchived: true });
  await db.doc(`qrLinks/${saved.qrToken}`).update({ enabled: false });
  const paths = ['inventory/mouse/items', 'inventory/gpu/items', 'productIds', 'productSkus', 'qrLinks', 'catalogCounters'];
  const capture = async () => Promise.all(paths.map(async path => (await db.collection(path).get()).docs.map(doc => ({ path: doc.ref.path, data: doc.data(), updated: doc.updateTime.toMillis() }))));
  const before = await capture();
  const report = await auditQRHealth(db);
  assert.deepEqual(await capture(), before);
  for (const code of ['MISSING_IDENTITY', 'MALFORMED_IDENTITY', 'DUPLICATE_IDENTITY', 'MISSING_TARGET', 'COUNTER']) assert.ok(report.issues.some(issue => issue.code === code), code);
  assert.ok(report.archived >= 1);
  assert.ok(report.disabled >= 1);
  assert.equal(report.issues.some(issue => issue.code === 'DISABLED' || issue.code === 'ARCHIVED'), false);
  const call = (bearer?: string) => qrHealth(new NextRequest('http://localhost:9002/api/admin/qr-health', { headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} }));
  assert.equal((await call()).status, 401);
  assert.equal((await call(customerToken)).status, 403);
  const response = await call(managerToken);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  assert.ok((await response.json()).issues.length > 0);
  assert.equal((await call(customerToken)).status, 403);
  await Promise.all([ref.delete(), db.doc('productIds/PRD-999998').delete(), db.doc('inventory/mouse/items/health-missing').delete()]);
  await productRef.update({ isArchived: false });
  await db.doc(`qrLinks/${saved.qrToken}`).update({ enabled: true });
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

test('simulated GCash and COD checkout lifecycle, client write protection, and quantity stock restoration', async () => {
  const ssdRef = db.doc('inventory/storage/items/checkout-ssd');
  await ssdRef.set({ ...payload('Checkout NVMe SSD', 'Storage'), stock: 5, price: 3500, popularity: 0 });
  const ssdIdentity = await assignProductIdentity(db, ssdRef, 'part', 'Storage');

  const opId1 = randomUUID();
  const checkoutInput = {
    idToken: customerToken,
    operationId: opId1,
    cartItems: [
      {
        id: 'checkout-ssd',
        productId: ssdIdentity.productId,
        kind: 'part' as const,
        name: 'Checkout NVMe SSD',
        category: 'Storage',
        price: 1, // Tampered client price — server must ignore and use authoritative 3500
        quantity: 2,
      },
    ],
    paymentMethod: 'gcash_simulated' as const,
    shippingMethod: 'standard_courier' as const,
    shippingAddress: {
      fullName: 'Juan Dela Cruz',
      phone: '09171234567',
      email: 'customer@qr.test',
      region: 'Metro Manila (NCR)',
      city: 'Quezon City',
      barangay: 'Socorro',
      streetAddress: '123 Aurora Blvd',
      postalCode: '1109',
    },
    includeCrateProtection: true,
    voucherCode: 'BUILDBOT1000',
  };

  const created = await createCheckoutOrder(checkoutInput);
  assert.equal(created.success, true);
  assert.ok(created.orderId);
  assert.equal(created.paymentMethod, 'gcash_simulated');
  assert.equal(created.paymentStatus, 'pending');
  assert.match(created.paymentReference || '', /^GCASH-/);
  assert.equal(created.totalPrice, 7600);

  const replayed = await createCheckoutOrder(checkoutInput);
  assert.equal(replayed.orderId, created.orderId);
  assert.equal((await ssdRef.get()).get('stock'), 3);
  assert.equal((await ssdRef.get()).get('popularity'), 2);

  await signInWithEmailAndPassword(auth, 'customer@qr.test', '12345678');
  await assert.rejects(
    updateDoc(doc(clientDb, 'orders', created.orderId!), { paymentStatus: 'paid' }),
    /permission/i
  );

  const failedRes = await resolveSimulatedPayment({
    orderId: created.orderId!,
    outcome: 'failed',
    idToken: customerToken,
  });
  assert.equal(failedRes.success, true);
  assert.equal(failedRes.paymentStatus, 'failed');

  const paidRes = await resolveSimulatedPayment({
    orderId: created.orderId!,
    outcome: 'success',
    idToken: customerToken,
  });
  assert.equal(paidRes.success, true);
  assert.equal(paidRes.paymentStatus, 'paid');
  assert.ok(paidRes.paidAt);

  const downgradeAttempt = await resolveSimulatedPayment({
    orderId: created.orderId!,
    outcome: 'failed',
    idToken: customerToken,
  });
  assert.equal(downgradeAttempt.success, false);

  const secondOrder = await createCheckoutOrder({
    ...checkoutInput,
    operationId: randomUUID(),
  });
  assert.equal(secondOrder.success, true);
  assert.equal((await ssdRef.get()).get('stock'), 1);

  const switchedCod = await switchOrderPaymentToCod(secondOrder.orderId!, customerToken);
  assert.equal(switchedCod.success, true);
  assert.equal(switchedCod.paymentMethod, 'cod');
  assert.equal(switchedCod.paymentStatus, 'unpaid');

  const customerStaffAttempt = await updateOrderPaymentStatusByStaff(
    secondOrder.orderId!,
    'paid',
    customerToken
  );
  assert.equal(customerStaffAttempt.success, false);

  const managerPaid = await updateOrderPaymentStatusByStaff(
    secondOrder.orderId!,
    'paid',
    managerToken, undefined, { operationId: randomUUID(), expectedRevision: (await db.doc(`orders/${secondOrder.orderId}`).get()).get('workflowRevision') }, { received: true, amount: 7600 }
  );
  assert.equal(managerPaid.success, true);
  assert.equal((await db.doc(`orders/${secondOrder.orderId}`).get()).get('paymentStatus'), 'paid');

  const cancelledRes = await updateReservationStatus(secondOrder.orderId!, 'cancelled', managerToken);
  assert.equal(cancelledRes.success, true);
  assert.equal((await ssdRef.get()).get('stock'), 3);
});

test('order rules require current staff profiles and deny direct staff mutations', async () => {
  const orderRef = db.doc('orders/phase2-rules');
  await orderRef.set({ userId: 'customer', status: 'pending', paymentStatus: 'unpaid' });
  await signInWithEmailAndPassword(auth, 'manager@qr.test', '12345678');
  const clientRef = doc(clientDb, 'orders/phase2-rules');
  assert.equal((await getDoc(clientRef)).exists(), true);
  await assert.rejects(updateDoc(clientRef, { paymentStatus: 'paid' }), /permission/i);
  await db.doc('users/manager').update({ isManager: false });
  try {
    await assert.rejects(getDoc(clientRef), /permission/i);
  } finally {
    await db.doc('users/manager').update({ isManager: true });
  }
  await signInWithEmailAndPassword(auth, 'customer@qr.test', '12345678');
  assert.equal((await getDoc(clientRef)).exists(), true);
  assert.equal((await orderRef.get()).get('paymentStatus'), 'unpaid');
});

test('confirmed stage operations are atomic, retry safe, stale aware and auditable', async () => {
  const ref = db.doc('orders/phase34-stage');
  const initial = { id: ref.id, userId: 'customer', userEmail: 'customer@qr.test', items: [],
    totalPrice: 100, status: 'pending', fulfillmentStage: 'order_placed', paymentMethod: 'cod', paymentStatus: 'unpaid', stockState: 'reserved', createdAt: new Date() };
  await ref.set(initial);
  const operation = { operationId: randomUUID(), expectedRevision: 0 };
  const input = { orderId: ref.id, stage: 'out_for_delivery' as const, idToken: managerToken, operation };
  const duplicate = await Promise.all([updateOrderFulfillmentStageByStaff(input), updateOrderFulfillmentStageByStaff(input)]);
  assert.ok(duplicate.every(result => result.success));
  assert.equal((await ref.get()).get('workflowRevision'), 1);
  assert.equal((await ref.collection('activity').where('type', '==', 'stage').get()).size, 1);
  assert.equal((await updateOrderFulfillmentStageByStaff({ ...input, stage: 'delivered' })).success, false);
  assert.equal((await updateOrderFulfillmentStageByStaff({ ...input, stage: 'delivered', operation: { operationId: randomUUID(), expectedRevision: 1 } })).success, false);
  assert.equal((await ref.get()).get('workflowRevision'), 1); // unpaid delivery failed without partial history
  const paymentOperation = { operationId: randomUUID(), expectedRevision: 1 };
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken, undefined, paymentOperation, { received: true, amount: 100 })).success, true);
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken, undefined, paymentOperation, { received: true, amount: 100 })).success, true);
  const stale = await updateOrderFulfillmentStageByStaff({ ...input, stage: 'delivered', operation: { operationId: randomUUID(), expectedRevision: 1 } });
  assert.equal(stale.success, false);
  assert.match(stale.error || '', /changed/);
  assert.equal((await updateOrderFulfillmentStageByStaff({ ...input, stage: 'delivered', operation: { operationId: randomUUID(), expectedRevision: 2 } })).success, true);
  const refund = { orderId: ref.id, amount: 10, destination: 'cash' as const, reason: 'Test partial refund', reference: 'cash-test', operationId: randomUUID(), idToken: managerToken };
  assert.equal((await refundOrderByStaff(refund)).success, true);
  assert.equal((await refundOrderByStaff(refund)).success, true);
  assert.equal((await refundOrderByStaff({ ...refund, amount: 20 })).success, false);
  assert.equal((await ref.get()).get('refundedAmount'), 10);
  const revision = (await ref.get()).get('workflowRevision');
  const archive = { orderId: ref.id, action: 'archive' as const, idToken: managerToken, operation: { operationId: randomUUID(), expectedRevision: revision } };
  assert.equal((await manageReservation(archive)).success, true);
  assert.equal((await manageReservation(archive)).success, true);
  const activity = await ref.collection('activity').get();
  assert.equal(activity.docs.filter(doc => doc.get('type') === 'payment').length, 1);
  assert.equal(activity.docs.filter(doc => doc.get('type') === 'refund').length, 1);
  assert.equal(activity.docs.filter(doc => doc.get('type') === 'archived').length, 1);
  assert.ok(activity.docs.every(doc => doc.get('actorId') === 'manager'));
  assert.equal((await getOrderActivity({ orderId: ref.id, idToken: customerToken })).success, false);
  assert.equal((await getOrderActivity({ orderId: ref.id, idToken: managerToken })).success, true);
  await signInWithEmailAndPassword(auth, 'manager@qr.test', '12345678');
  await assert.rejects(setDoc(doc(clientDb, `orders/${ref.id}/activity/forged`), { type: 'stage' }), /permission/i);
  await assert.rejects(getDoc(doc(clientDb, `orderWorkflowOperations/${ref.id}_${operation.operationId}`)), /permission/i);
  await signInWithEmailAndPassword(auth, 'customer@qr.test', '12345678');
  await assert.rejects(getDoc(doc(clientDb, `orders/${ref.id}/activity/${activity.docs[0].id}`)), /permission/i);
});

test('cancellation retry restores stock once and activity pagination preserves legacy audits', async () => {
  const stock = db.doc('inventory/cpu/items/phase34-stock');
  await stock.set({ ...payload('Phase 34 CPU'), stock: 8 });
  const ref = db.doc('orders/phase34-cancel');
  await ref.set({ id: ref.id, userId: 'customer', userEmail: 'customer@qr.test',
    items: [{ id: 'phase34-stock', category: 'CPU', name: 'Phase 34 CPU', price: 50, quantity: 2 }],
    totalPrice: 100, status: 'pending', fulfillmentStage: 'order_placed', paymentMethod: 'cod', paymentStatus: 'unpaid', stockState: 'reserved', createdAt: new Date() });
  const operation = { operationId: randomUUID(), expectedRevision: 0 };
  const results = await Promise.all([1, 2].map(() => updateReservationStatus(ref.id, 'cancelled', managerToken, operation)));
  assert.ok(results.every(result => result.success));
  assert.equal((await stock.get()).get('stock'), 10);
  assert.equal((await ref.collection('activity').where('type', '==', 'inventory').get()).size, 1);
  for (let i = 0; i < 61; i++) await db.collection('auditLogs').add({ scope: 'Order', resourceId: ref.id,
    actionName: 'legacy', details: `Legacy ${i}`, actorName: 'Historical staff', createdAt: new Date(1700000000000 + i) });
  let page = await getOrderActivity({ orderId: ref.id, idToken: managerToken });
  assert.ok(page.success);
  const events = new Set(page.events.map(event => event.id));
  let legacy = page.events.filter(event => event.inferred).length;
  for (let count = 0; count < 5 && page.success && (!page.auditDone || !page.activityDone); count++) {
    page = await getOrderActivity({ orderId: ref.id, idToken: managerToken, cursor: page.cursor,
      auditCursor: page.auditCursor, activityDone: page.activityDone, auditDone: page.auditDone });
    assert.ok(page.success);
    for (const event of page.events) { assert.ok(!events.has(event.id)); events.add(event.id); if (event.inferred) legacy++; }
  }
  assert.equal(legacy, 61);
});

test('COD collection and correction remain separate from fulfillment and preserve records on retry', async () => {
  const ref = db.doc('orders/phase5-cod');
  await ref.set({ id: ref.id, userId: 'customer', userEmail: 'customer@qr.test', items: [], totalPrice: 100,
    status: 'building', fulfillmentStage: 'assembling_testing', paymentMethod: 'cod', paymentStatus: 'unpaid', stockState: 'reserved', createdAt: new Date() });
  const operation = { operationId: randomUUID(), expectedRevision: 0 };
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken)).success, false);
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken, undefined, operation, { received: true, amount: 99 })).success, false);
  const collect = () => updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken, undefined, operation, { received: true, amount: 100 });
  assert.ok((await Promise.all([collect(), collect()])).every(result => result.success));
  const paid = (await ref.get()).data()!;
  assert.equal(paid.paymentHistory.length, 1);
  assert.equal(paid.paymentHistory[0].kind, 'collection');
  const correction = { operationId: randomUUID(), expectedRevision: 1 };
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'unpaid', managerToken, 'short', correction)).success, false);
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'unpaid', managerToken, 'Collection recorded on wrong order', correction)).success, true);
  const corrected = (await ref.get()).data()!;
  assert.equal(corrected.paymentHistory[1].kind, 'correction');
  assert.equal(corrected.paymentHistory[1].relatedEventId, paid.paymentHistory[0].id);
  assert.deepEqual(corrected.paymentHistory[0], paid.paymentHistory[0]);
  assert.equal(corrected.paidAt, null);
  assert.equal((await collect()).success, true); // replay of original collection cannot recollect after correction
  assert.equal((await ref.get()).get('paymentStatus'), 'unpaid');
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'paid', managerToken, undefined,
    { operationId: randomUUID(), expectedRevision: 2 }, { received: true, amount: 100 })).success, true);
  const final = (await ref.get()).data()!;
  assert.equal(final.paymentHistory.length, 3);
  assert.equal(final.paymentHistory[2].relatedEventId, corrected.paymentHistory[1].id);
  assert.equal(final.fulfillmentStage, 'assembling_testing');
  assert.equal(final.stockState, 'reserved');
  await ref.update({ pendingRefundOperationId: 'legacy-pending', refundStatus: 'none' });
  assert.equal((await updateOrderPaymentStatusByStaff(ref.id, 'unpaid', managerToken, 'Wrong collection record',
    { operationId: randomUUID(), expectedRevision: 3 })).success, false);
});

test('unknown provider refunds stay locked; verified matching receipts settle once', async () => {
  const previousKey = process.env.PAYMONGO_SECRET_KEY;
  process.env.PAYMONGO_SECRET_KEY = 'sk_test_phase5';
  const originalFetch = globalThis.fetch;
  let posts = 0;
  let providerPayment = 'pay_phase5';
  let providerAmount = 10000;
  let providerStatus = 'pending';
  let notes = '';
  const providerId = 'ref_phase5';
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (!url.startsWith('https://api.paymongo.com/')) return originalFetch(input, init);
    if (init?.method === 'POST') { posts++; throw new TypeError('Lost provider response'); }
    return new Response(JSON.stringify({ data: { id: providerId, attributes: { status: providerStatus, amount: providerAmount,
      payment_id: providerPayment, currency: 'PHP', notes } } }), { status: 200 });
  };
  try {
    const ref = db.doc('orders/phase5-provider');
    await ref.set({ id: ref.id, userId: 'customer', userEmail: 'customer@qr.test', items: [], totalPrice: 500,
      status: 'pending', fulfillmentStage: 'order_placed', paymentMethod: 'paymongo_simulated', paymongoMode: 'live_test_api',
      paymongoPaymentId: 'pay_phase5', paymentStatus: 'paid', stockState: 'reserved', createdAt: new Date() });
    const operationId = randomUUID();
    const request = { orderId: ref.id, amount: 100, destination: 'original_payment_method' as const, reason: 'Customer partial refund', operationId, idToken: managerToken };
    notes = `${operationId}: ${request.reason}`;
    process.env.PAYMONGO_SECRET_KEY = '';
    assert.equal((await refundOrderByStaff(request)).success, false);
    assert.equal((await ref.get()).get('pendingRefundOperationId'), undefined);
    assert.equal((await db.doc(`orderRefundOperations/${ref.id}_${operationId}`).get()).exists, false);
    assert.equal(posts, 0);
    process.env.PAYMONGO_SECRET_KEY = 'sk_test_phase5';
    const outcome = await refundOrderByStaff(request);
    assert.equal(outcome.success, false); assert.equal(outcome.pending, true);
    const uncertain = await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken });
    assert.equal(uncertain.requiresReference, true);
    assert.equal((await ref.get()).get('pendingRefundOperationId'), operationId);
    assert.equal((await refundOrderByStaff({ ...request, operationId: randomUUID() })).success, false);
    await refundOrderByStaff(request); // same pending operation must never send a second POST
    assert.equal(posts, 1);
    const reference = { providerRefundId: providerId, reason: 'Matched refund in dashboard' };
    providerPayment = 'pay_wrong';
    assert.equal((await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken, reference })).success, false);
    providerPayment = 'pay_phase5'; providerAmount = 9999;
    assert.equal((await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken, reference })).success, false);
    providerAmount = 10000; notes = 'Different operation';
    assert.equal((await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken, reference })).success, false);
    notes = `${operationId}: ${request.reason}`;
    assert.equal((await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken, reference })).pending, true);
    assert.equal((await ref.get()).get('pendingPaymongoRefundId'), providerId);
    providerStatus = 'succeeded';
    const results = await Promise.all([1, 2].map(() => reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken })));
    assert.ok(results.every(result => result.success));
    const settled = (await ref.get()).data()!;
    assert.equal(settled.refundedAmount, 100); assert.equal(settled.refunds.length, 1);
    assert.equal(settled.pendingRefundOperationId, undefined); assert.equal(settled.paymentStatus, 'paid');
    assert.equal(settled.fulfillmentStage, 'order_placed'); assert.equal(settled.stockState, 'reserved');
    assert.equal((await db.doc(`orderRefundReceipts/${providerId}`).get()).get('operationId'), operationId);
    await signInWithEmailAndPassword(auth, 'customer@qr.test', '12345678');
    await assert.rejects(getDoc(doc(clientDb, `orderRefundReceipts/${providerId}`)), /permission/i);
    const otherId = randomUUID();
    await ref.update({ pendingRefundOperationId: otherId, refundStatus: 'pending' });
    await db.doc(`orderRefundOperations/${ref.id}_${otherId}`).set({ orderId: ref.id, operationId: otherId, paymentId: 'pay_phase5', amount: 100,
      status: 'pending', destination: 'original_payment_method', reason: 'Legacy refund', actorId: 'manager', actorName: 'Manager', actorRole: 'Manager' });
    assert.equal((await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken, reference })).success, false);
    assert.equal((await ref.get()).get('refundedAmount'), 100);
    globalThis.fetch = async (input, init) => String(input).includes('/refunds/') ? new Response(JSON.stringify({ data: { id: 'ref_phase5failed', attributes: {
      status: 'failed', amount: 10000, payment_id: 'pay_phase5', currency: 'PHP', notes: 'Legacy refund' } } }), { status: 200 }) : originalFetch(input, init);
    const failed = await reconcileOrderRefundByStaff({ orderId: ref.id, idToken: managerToken,
      reference: { providerRefundId: 'ref_phase5failed', reason: 'Provider confirmed failed refund' } });
    assert.equal(failed.status, 'failed'); assert.equal((await ref.get()).get('pendingRefundOperationId'), undefined);
    assert.equal((await ref.get()).get('refunds').length, 1); assert.equal(posts, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.PAYMONGO_SECRET_KEY; else process.env.PAYMONGO_SECRET_KEY = previousKey;
  }
});
