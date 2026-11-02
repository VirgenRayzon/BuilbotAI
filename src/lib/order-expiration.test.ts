import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORDER_EXPIRATION_DURATION_MS,
  getOrderCreatedDate,
  isOrderPendingWithNoProgression,
  getOrderRemainingTimeMs,
  isOrderExpired,
  formatRemainingTime,
} from './order-expiration';

test('getOrderCreatedDate parses multiple timestamp formats', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  // Date string
  assert.equal(getOrderCreatedDate(now.toISOString())?.getTime(), now.getTime());
  // Milliseconds number
  assert.equal(getOrderCreatedDate(now.getTime())?.getTime(), now.getTime());
  // Firestore-like object with toDate()
  assert.equal(getOrderCreatedDate({ toDate: () => now })?.getTime(), now.getTime());
  // Firestore-like object with seconds
  assert.equal(
    getOrderCreatedDate({ seconds: Math.floor(now.getTime() / 1000) })?.getTime(),
    now.getTime()
  );
  assert.equal(getOrderCreatedDate(null), null);
});

test('isOrderPendingWithNoProgression expires unpaid online orders while exempting COD and legacy orders', () => {
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'pending',
    }),
    true
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'unpaid',
    }),
    true
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'failed',
    }),
    true
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'cancelled',
    }),
    true
  );

  // COD and legacy orders without an online paymentMethod are exempt from 1-hour auto-cancellation
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
    }),
    false
  );
  assert.equal(
    isOrderPendingWithNoProgression({ status: 'pending', paymentStatus: 'unpaid' }),
    false
  );

  // Paid orders progressed, should not be marked for auto-cancellation
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'paid',
    }),
    false
  );
  // Building or fulfillment-progressed orders
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'building',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'pending',
    }),
    false
  );
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      fulfillmentStage: 'assembling_testing',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'pending',
    }),
    false
  );
  // Already cancelled
  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'cancelled',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'cancelled',
    }),
    false
  );
});

test('getOrderRemainingTimeMs and isOrderExpired calculate 1-hour window', () => {
  const baseTime = 10000000;
  const createdDate = new Date(baseTime);

  // 10 minutes in (50 minutes remaining)
  const tenMinutesLater = baseTime + 10 * 60 * 1000;
  assert.equal(
    getOrderRemainingTimeMs(createdDate, tenMinutesLater),
    50 * 60 * 1000
  );
  assert.equal(isOrderExpired(createdDate, tenMinutesLater), false);

  // 60 minutes in (0 ms remaining)
  const oneHourLater = baseTime + ORDER_EXPIRATION_DURATION_MS;
  assert.equal(getOrderRemainingTimeMs(createdDate, oneHourLater), 0);
  assert.equal(isOrderExpired(createdDate, oneHourLater), true);

  // 75 minutes in (0 ms remaining, expired)
  const seventyFiveMinutesLater = baseTime + 75 * 60 * 1000;
  assert.equal(getOrderRemainingTimeMs(createdDate, seventyFiveMinutesLater), 0);
  assert.equal(isOrderExpired(createdDate, seventyFiveMinutesLater), true);
});

test('formatRemainingTime formats countdown correctly', () => {
  assert.equal(formatRemainingTime(0), 'Expired');
  assert.equal(formatRemainingTime(-5000), 'Expired');
  assert.equal(formatRemainingTime(50 * 1000), '0m 50s');
  assert.equal(formatRemainingTime(15 * 60 * 1000 + 35 * 1000), '15m 35s');
  assert.equal(formatRemainingTime(60 * 60 * 1000), '1h 00m');
});
