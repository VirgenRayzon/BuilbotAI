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
  assert.equal(getOrderCreatedDate(now.toISOString())?.getTime(), now.getTime());
  assert.equal(getOrderCreatedDate(now.getTime())?.getTime(), now.getTime());
  assert.equal(getOrderCreatedDate({ toDate: () => now })?.getTime(), now.getTime());
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

  assert.equal(
    isOrderPendingWithNoProgression({
      status: 'pending',
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'paid',
    }),
    false
  );
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

  const tenMinutesLater = baseTime + 10 * 60 * 1000;
  assert.equal(
    getOrderRemainingTimeMs(createdDate, tenMinutesLater),
    50 * 60 * 1000
  );
  assert.equal(isOrderExpired(createdDate, tenMinutesLater), false);

  const oneHourLater = baseTime + ORDER_EXPIRATION_DURATION_MS;
  assert.equal(getOrderRemainingTimeMs(createdDate, oneHourLater), 0);
  assert.equal(isOrderExpired(createdDate, oneHourLater), true);

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
