import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file: string) =>
  readFileSync(new URL(file, import.meta.url), 'utf8');

const headerSource = read('./orders-header-bar.tsx');
const tabSource = read('./orders-tab.tsx');
const cardSource = read('./order-card.tsx');
const controlsSource = read('./order-card-controls.tsx');
const paymentControlSource = read('./order-payment-control.tsx');
const stepperSource = read('./order-card-fulfillment-stepper.tsx');

test('order header exposes filters without obsolete display and purge controls', () => {
  assert.doesNotMatch(headerSource, /Show Specs|Hide Specs|Clear All Orders/);
  assert.doesNotMatch(headerSource, /SegmentedControl|TableIcon|LayoutGrid/);
});

test('all order stages render cards only', () => {
  assert.doesNotMatch(tabSource, /OrdersTable|viewMode|showAllSpecs/);
});

test('order cards place hardware before customer finance and omit the badge strip', () => {
  assert.ok(
    cardSource.indexOf('<OrderCardItemsList') <
      cardSource.indexOf('<OrderCardCustomerFinance')
  );
  assert.doesNotMatch(cardSource, /Badges & Overview Strip/);
});

test('fulfillment progress has no rounded bordered outer card', () => {
  assert.doesNotMatch(stepperSource, /<Paper[\s\S]*Fulfillment Progress/);
});

test('fulfillment stages divide the full row by the number of visible stages', () => {
  assert.match(
    stepperSource,
    /gridTemplateColumns: `repeat\(\$\{stages\.length\}, minmax\(0, 1fr\)\)`/
  );
  assert.doesNotMatch(stepperSource, /lg:grid-cols-4/);
});

test('payment and cancellation controls replace the header order total', () => {
  assert.doesNotMatch(cardSource, /Order Total/);
  assert.ok(
    cardSource.indexOf('<OrderCardControls') <
      cardSource.indexOf("label={archived ? 'Restore order'")
  );
  assert.equal(cardSource.match(/<OrderCardControls/g)?.length, 1);
  assert.doesNotMatch(controlsSource, /<Paper|\bPaper\b/);
});

test('cash confirmation uses the requested label', () => {
  assert.match(paymentControlSource, />Payment Confirmed<\/Button>/);
  assert.doesNotMatch(paymentControlSource, /Record Cash Collection/);
});

test('header payment action omits the payment label and status badge', () => {
  assert.doesNotMatch(controlsSource, /Payment:/);
  assert.doesNotMatch(paymentControlSource, /<Badge|\bBadge\b|status\.shortLabel/);
  assert.doesNotMatch(
    paymentControlSource,
    /<Select|\bSelect\b|Order payment status/
  );
});

test('every ready next fulfillment stage uses the breathing treatment', () => {
  assert.match(stepperSource, /const isBreathing = isNext && isReady;/);
  assert.doesNotMatch(
    stepperSource,
    /stage === 'out_for_delivery' && isNext && isReady/
  );
});
