import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOrderHoldExpiresAt,
  isOrderPendingWithNoProgression,
  isOrderExpired,
  ORDER_EXPIRATION_DURATION_MS,
} from './order-expiration';
import type { PaymentMethod } from './types';

test('computeOrderHoldExpiresAt returns null for cash on delivery (cod)', () => {
  const createdAt = new Date('2026-11-12T10:00:00.000Z');
  const result = computeOrderHoldExpiresAt('cod', createdAt);
  assert.equal(result, null);
});

test('computeOrderHoldExpiresAt returns createdAt + 60 minutes for online payment methods', () => {
  const createdAt = new Date('2026-11-12T10:00:00.000Z');
  const expectedMs = createdAt.getTime() + 60 * 60 * 1000;

  const methods: PaymentMethod[] = [
    'gcash_simulated',
    'paymongo_simulated',
    'card_simulated',
  ];

  for (const method of methods) {
    const expiresAt = computeOrderHoldExpiresAt(method, createdAt);
    assert.ok(expiresAt instanceof Date, `Expected Date instance for ${method}`);
    assert.equal(expiresAt.getTime(), expectedMs, `Hold expiry mismatch for ${method}`);
  }
});

test('computeOrderHoldExpiresAt returns null for undefined or invalid payment method or date', () => {
  const createdAt = new Date('2026-11-12T10:00:00.000Z');
  assert.equal(computeOrderHoldExpiresAt(undefined, createdAt), null);
  assert.equal(computeOrderHoldExpiresAt(null as unknown as PaymentMethod, createdAt), null);
  assert.equal(computeOrderHoldExpiresAt('unknown_method' as PaymentMethod, createdAt), null);
  assert.equal(computeOrderHoldExpiresAt('gcash_simulated', null), null);
  assert.equal(computeOrderHoldExpiresAt('gcash_simulated', 'invalid-date'), null);
});

test('computeOrderHoldExpiresAt handles Firestore-like Timestamp objects', () => {
  const createdAt = new Date('2026-11-12T12:00:00.000Z');
  const timestampLike = {
    toDate: () => createdAt,
    seconds: Math.floor(createdAt.getTime() / 1000),
    nanoseconds: 0,
  };
  const result = computeOrderHoldExpiresAt('gcash_simulated', timestampLike);
  assert.ok(result instanceof Date);
  assert.equal(result.getTime(), createdAt.getTime() + ORDER_EXPIRATION_DURATION_MS);
});

test('isOrderPendingWithNoProgression excludes COD orders unconditionally', () => {
  assert.equal(
    isOrderPendingWithNoProgression({
      paymentMethod: 'cod',
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStage: 'order_placed',
    }),
    false
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      paymentMethod: 'cod',
      status: 'pending',
      paymentStatus: 'unpaid',
      fulfillmentStage: 'order_placed',
    }),
    false
  );
});

test('isOrderPendingWithNoProgression includes pending online orders', () => {
  assert.equal(
    isOrderPendingWithNoProgression({
      paymentMethod: 'gcash_simulated',
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStage: 'order_placed',
    }),
    true
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      paymentMethod: 'paymongo_simulated',
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStage: 'order_placed',
    }),
    true
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      paymentMethod: 'gcash_simulated',
      status: 'pending',
      paymentStatus: 'paid',
      fulfillmentStage: 'order_placed',
    }),
    false
  );
});

test('isOrderExpired correctly compares elapsed time vs duration', () => {
  const now = Date.now();
  const recent = new Date(now - 10 * 60 * 1000); // 10m ago
  const expired = new Date(now - 61 * 60 * 1000); // 61m ago

  assert.equal(isOrderExpired(recent, now), false);
  assert.equal(isOrderExpired(expired, now), true);
});

test('backfill helpers compute expected hold expiry and detect drift', async () => {
  const {
    computeExpectedHoldExpiresAt,
    needsHoldExpiresAtUpdate,
  } = await import('../../execution/backfill_order_hold_expiry');

  const baseDate = new Date('2026-11-12T10:00:00.000Z');

  // COD -> expected null
  assert.equal(
    computeExpectedHoldExpiresAt({
      paymentMethod: 'cod',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: baseDate,
    }),
    null
  );

  // Paid online -> expected null
  assert.equal(
    computeExpectedHoldExpiresAt({
      paymentMethod: 'gcash_simulated',
      status: 'pending',
      paymentStatus: 'paid',
      createdAt: baseDate,
    }),
    null
  );

  // Cancelled online -> expected null
  assert.equal(
    computeExpectedHoldExpiresAt({
      paymentMethod: 'gcash_simulated',
      status: 'cancelled',
      paymentStatus: 'pending',
      createdAt: baseDate,
    }),
    null
  );

  // Pending online -> expected +60m
  const pendingHold = computeExpectedHoldExpiresAt({
    paymentMethod: 'gcash_simulated',
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: baseDate,
  });
  assert.ok(pendingHold !== null);
  assert.equal(
    pendingHold.toDate().getTime(),
    baseDate.getTime() + 60 * 60 * 1000
  );

  // needsHoldExpiresAtUpdate tests
  // 1. null expected, current is undefined -> false
  assert.equal(needsHoldExpiresAtUpdate(undefined, null), false);
  // 2. null expected, current is null -> false
  assert.equal(needsHoldExpiresAtUpdate(null, null), false);
  // 3. null expected, current is stale Date -> true (clears stale)
  assert.equal(needsHoldExpiresAtUpdate(baseDate, null), true);
  // 4. Timestamp expected, current is undefined -> true (populates missing)
  assert.equal(needsHoldExpiresAtUpdate(undefined, pendingHold), true);
  // 5. Timestamp expected, current is matching Timestamp -> false (no drift)
  assert.equal(needsHoldExpiresAtUpdate(pendingHold, pendingHold), false);
});
