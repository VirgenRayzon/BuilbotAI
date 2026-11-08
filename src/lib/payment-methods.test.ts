import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import {
  PAYMENT_METHOD_REGISTRY,
  PAYMENT_METHODS_LIST,
  calculateAuthoritativeOrderTotals,
  generateOrderNumber,
  generateSimulatedPaymentReference,
  getPaymentStatusInfo,
  getPaymentMethodLabel,
  isSimulatedPaymentMethod,
} from './payment-methods';
import {
  toPaymongoCentavos,
  buildPaymongoCheckoutPayload,
  verifyPaymongoWebhookSignature,
} from './server/paymongo';
import { buildSalesAnalyticsWorkbook } from './export-excel';
import type { Order } from './types';

test('payment method registry configures COD, Simulated GCash, Simulated PayMongo, and reserved Simulated Card', () => {
  assert.equal(PAYMENT_METHODS_LIST.length, 4);

  const cod = PAYMENT_METHOD_REGISTRY.cod;
  assert.equal(cod.enabled, true);
  assert.equal(cod.isSimulated, false);
  assert.equal(cod.requiresSimulationStep, false);
  assert.equal(cod.initialPaymentStatus, 'unpaid');
  assert.equal(isSimulatedPaymentMethod('cod'), false);

  const gcash = PAYMENT_METHOD_REGISTRY.gcash_simulated;
  assert.equal(gcash.enabled, true);
  assert.equal(gcash.isSimulated, true);
  assert.equal(gcash.requiresSimulationStep, true);
  assert.equal(gcash.initialPaymentStatus, 'pending');
  assert.equal(isSimulatedPaymentMethod('gcash_simulated'), true);

  const paymongo = PAYMENT_METHOD_REGISTRY.paymongo_simulated;
  assert.equal(paymongo.enabled, true);
  assert.equal(paymongo.isSimulated, true);
  assert.equal(paymongo.requiresSimulationStep, true);
  assert.equal(paymongo.initialPaymentStatus, 'pending');
  assert.equal(isSimulatedPaymentMethod('paymongo_simulated'), true);

  const card = PAYMENT_METHOD_REGISTRY.card_simulated;
  assert.equal(card.enabled, false);
  assert.equal(card.isSimulated, true);
  assert.equal(card.badgeText, 'Coming Soon');
});

test('calculateAuthoritativeOrderTotals computes server-authoritative subtotals, shipping, crate protection, and vouchers', () => {
  const baseBreakdown = calculateAuthoritativeOrderTotals({
    items: [
      { price: 15000, quantity: 1, buildType: 'custom-build' },
      { price: 4500, quantity: 2 },
    ],
    shippingMethod: 'standard_courier',
    includeCrateProtection: true,
    voucherCode: 'buildbot1000',
  });

  assert.equal(baseBreakdown.subtotal, 24000);
  assert.equal(baseBreakdown.shippingFee, 250);
  assert.equal(baseBreakdown.protectionFee, 350);
  assert.equal(baseBreakdown.discountAmount, 1000);
  assert.equal(baseBreakdown.appliedVoucherCode, 'BUILDBOT1000');
  assert.equal(baseBreakdown.totalPrice, 23600);
  assert.ok(baseBreakdown.vatIncludedAmount > 0);

  const partsOnlyBreakdown = calculateAuthoritativeOrderTotals({
    items: [{ price: 15000, quantity: 1, buildType: 'part' }],
    shippingMethod: 'standard_courier',
    includeCrateProtection: true,
  });

  assert.equal(partsOnlyBreakdown.protectionFee, 0);

  const prebuiltBreakdown = calculateAuthoritativeOrderTotals({
    items: [{ price: 75000, quantity: 1, buildType: 'prebuilt' }],
    shippingMethod: 'standard_courier',
    includeCrateProtection: true,
  });

  assert.equal(prebuiltBreakdown.protectionFee, 350);

  const smallOrder = calculateAuthoritativeOrderTotals({
    items: [{ price: 1800, quantity: 1 }],
    shippingMethod: 'store_pickup',
    includeCrateProtection: false,
    voucherCode: 'BUILDBOT1000',
  });

  assert.equal(smallOrder.subtotal, 1800);
  assert.equal(smallOrder.shippingFee, 0);
  assert.equal(smallOrder.protectionFee, 0);
  assert.equal(smallOrder.discountAmount, 0);
  assert.equal(smallOrder.appliedVoucherCode, null);
  assert.equal(smallOrder.totalPrice, 1800);
});

test('generateOrderNumber and generateSimulatedPaymentReference produce clearly-labeled identifiers', () => {
  const fixedDate = new Date('2026-11-01T10:00:00Z');

  const orderNo = generateOrderNumber(fixedDate);
  assert.match(orderNo, /^BB-20261101-[A-Z0-9]{4}$/);

  const gcashRef = generateSimulatedPaymentReference('gcash_simulated', fixedDate);
  assert.match(gcashRef, /^GCASH-20261101-[A-Z0-9]{6}$/);

  const paymongoRef = generateSimulatedPaymentReference('paymongo_simulated', fixedDate);
  assert.match(paymongoRef, /^PM-20261101-[A-Z0-9]{6}$/);

  const codRef = generateSimulatedPaymentReference('cod', fixedDate);
  assert.match(codRef, /^COD-REF-20261101-[A-Z0-9]{6}$/);

  const cardRef = generateSimulatedPaymentReference('card_simulated', fixedDate);
  assert.match(cardRef, /^CARD-20261101-[A-Z0-9]{6}$/);
});

test('getPaymentStatusInfo and getPaymentMethodLabel handle COD, Simulated GCash, Simulated PayMongo, and legacy orders', () => {
  const legacyInfo = getPaymentStatusInfo(undefined, undefined);
  assert.equal(legacyInfo.status, 'unpaid');
  assert.equal(legacyInfo.label, 'Cash Not Collected (COD)');
  assert.equal(legacyInfo.shortLabel, 'Uncollected (COD)');
  assert.equal(legacyInfo.canRetrySimulatedPayment, false);
  assert.equal(getPaymentMethodLabel(undefined, true), 'Cash on Delivery');
  assert.equal(getPaymentMethodLabel(undefined, false), 'Cash on Delivery / Store Reservation');

  const pendingGcash = getPaymentStatusInfo('pending', 'gcash_simulated');
  assert.equal(pendingGcash.status, 'pending');
  assert.equal(pendingGcash.label, 'Payment Pending');
  assert.equal(pendingGcash.canRetrySimulatedPayment, true);

  const failedGcash = getPaymentStatusInfo('failed', 'gcash_simulated');
  assert.equal(failedGcash.status, 'failed');
  assert.equal(failedGcash.label, 'Payment Failed');
  assert.equal(failedGcash.canRetrySimulatedPayment, true);

  const paidGcash = getPaymentStatusInfo('paid', 'gcash_simulated');
  assert.equal(paidGcash.status, 'paid');
  assert.equal(paidGcash.label, 'Paid (GCash)');
  assert.equal(paidGcash.shortLabel, 'Paid');
  assert.equal(paidGcash.canRetrySimulatedPayment, false);

  const pendingPaymongo = getPaymentStatusInfo('pending', 'paymongo_simulated');
  assert.equal(pendingPaymongo.status, 'pending');
  assert.equal(pendingPaymongo.canRetrySimulatedPayment, true);

  const paidPaymongo = getPaymentStatusInfo('paid', 'paymongo_simulated');
  assert.equal(paidPaymongo.status, 'paid');
  assert.equal(paidPaymongo.label, 'Paid (PayMongo)');
  assert.equal(paidPaymongo.shortLabel, 'Paid');
  assert.equal(paidPaymongo.canRetrySimulatedPayment, false);
  assert.equal(getPaymentMethodLabel('paymongo_simulated', true), 'PayMongo');
  assert.equal(
    getPaymentMethodLabel('paymongo_simulated', false),
    'PayMongo (Card, Maya, QRPh)'
  );
});

test('PayMongo payload builder converts PHP to centavos and handles voucher discounts safely', () => {
  assert.equal(toPaymongoCentavos(24500), 2450000);
  assert.equal(toPaymongoCentavos(250.5), 25050);

  const itemizedPayload = buildPaymongoCheckoutPayload({
    orderId: 'ord-pm-1',
    orderNumber: 'BB-20261101-PM01',
    paymentReference: 'SIM-PM-20261101-ABC123',
    customerEmail: 'buyer@netcodex.ph',
    items: [
      { id: 'cpu-1', name: 'Ryzen 7 7800X3D', price: 24500, quantity: 1, category: 'CPU' },
    ],
    shippingFeePhp: 250,
    protectionFeePhp: 350,
    discountAmountPhp: 0,
    totalPricePhp: 25100,
    baseUrl: 'http://localhost:9002',
  });

  const attrs1 = itemizedPayload.data.attributes;
  assert.equal(attrs1.line_items.length, 3);
  const sumCentavos1 = attrs1.line_items.reduce(
    (sum, li) => sum + li.amount * li.quantity,
    0
  );
  assert.equal(sumCentavos1, 2510000);

  const discountedPayload = buildPaymongoCheckoutPayload({
    orderId: 'ord-pm-2',
    orderNumber: 'BB-20261101-PM02',
    paymentReference: 'SIM-PM-20261101-DEF456',
    customerEmail: 'buyer@netcodex.ph',
    items: [
      { id: 'cpu-1', name: 'Ryzen 7 7800X3D', price: 24500, quantity: 1, category: 'CPU' },
    ],
    shippingFeePhp: 250,
    protectionFeePhp: 0,
    discountAmountPhp: 1000,
    voucherCode: 'BUILDBOT1000',
    totalPricePhp: 23750,
    baseUrl: 'http://localhost:9002',
  });

  const attrs2 = discountedPayload.data.attributes;
  assert.equal(attrs2.line_items.length, 1);
  assert.equal(attrs2.line_items[0].amount, 2375000);
});

test('verifyPaymongoWebhookSignature validates Paymongo-Signature HMAC header', () => {
  const secret = 'whsec_test_secret_123';
  const rawBody = JSON.stringify({ data: { id: 'evt_123' } });
  const timestamp = '1762000000';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  const header = `t=${timestamp},te=${expectedSig},li=`;
  assert.equal(verifyPaymongoWebhookSignature(rawBody, header, secret), true);
  assert.equal(
    verifyPaymongoWebhookSignature(rawBody, `t=${timestamp},te=invalid,li=`, secret),
    false
  );
});

test('buildSalesAnalyticsWorkbook exports payment method, payment status, and reference in Orders Log', () => {
  const sampleOrders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 'BB-20261101-A1B2',
      userId: 'user-1',
      userEmail: 'buyer1@example.com',
      items: [{ id: 'cpu-1', name: 'Ryzen 7 7800X3D', category: 'CPU', price: 24500, quantity: 1 }],
      totalPrice: 24500,
      status: 'pending',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'paid',
      paymentReference: 'SIM-GCASH-20261101-XYZ123',
      createdAt: { seconds: 1762000000 },
    },
    {
      id: 'ord-2',
      userId: 'user-2',
      userEmail: 'buyer2@example.com',
      items: [{ id: 'gpu-1', name: 'RTX 4070 Super', category: 'GPU', price: 38900 }],
      totalPrice: 38900,
      status: 'building',
      createdAt: { seconds: 1762000100 },
    },
    {
      id: 'ord-3',
      orderNumber: 'BB-20261101-P9Q8',
      userId: 'user-3',
      userEmail: 'buyer3@example.com',
      items: [{ id: 'ram-1', name: 'DDR5 32GB 6000MHz', category: 'RAM', price: 6800, quantity: 1 }],
      totalPrice: 6800,
      status: 'pending',
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'paid',
      paymentReference: 'SIM-PM-20261101-PM9876',
      createdAt: { seconds: 1762000200 },
    },
  ];

  const wb = buildSalesAnalyticsWorkbook({
    orders: sampleOrders,
    parts: [],
    prebuilts: [],
    revenueData: [{ name: 'Nov 1', revenue: 70200 }],
    timeRange: 'week',
  });

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets['Orders Log']);
  assert.equal(rows.length, 3);

  assert.equal(rows[0]['Order ID'], 'BB-20261101-A1B2');
  assert.equal(rows[0]['Payment Method'], 'GCash (E-Wallet)');
  assert.equal(rows[0]['Payment Status'], 'Paid (GCash)');
  assert.equal(rows[0]['Payment Reference'], 'SIM-GCASH-20261101-XYZ123');

  assert.equal(rows[1]['Order ID'], '#ord-2');
  assert.equal(rows[1]['Payment Method'], 'Cash on Delivery / Store Reservation');
  assert.equal(rows[1]['Payment Status'], 'Cash Not Collected (COD)');
  assert.equal(rows[1]['Payment Reference'], 'N/A');

  assert.equal(rows[2]['Order ID'], 'BB-20261101-P9Q8');
  assert.equal(rows[2]['Payment Method'], 'PayMongo (Card, Maya, QRPh)');
  assert.equal(rows[2]['Payment Status'], 'Paid (PayMongo)');
  assert.equal(rows[2]['Payment Reference'], 'SIM-PM-20261101-PM9876');
});
