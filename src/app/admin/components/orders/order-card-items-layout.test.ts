import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const itemsListSource = readFileSync(
  new URL('./order-card-items-list.tsx', import.meta.url),
  'utf8'
);
const verificationSource = readFileSync(
  new URL('./order-assembly-verification.tsx', import.meta.url),
  'utf8'
);
const customerOrdersSource = readFileSync(
  new URL('../../../profile/components/reservations-list.tsx', import.meta.url),
  'utf8'
);
const customerActivitySource = readFileSync(
  new URL('../../../../components/orders/customer-order-activity.tsx', import.meta.url),
  'utf8'
);

test('hardware groups share one rounded container instead of separate rounded cards', () => {
  assert.match(
    itemsListSource,
    /data-testid="order-hardware-groups"[\s\S]*rounded-lg border/
  );
  assert.doesNotMatch(
    itemsListSource,
    /data-testid="order-item-group"[^>]*rounded-lg/
  );
});

test('assembly verification uses flat workflow rows and square product thumbnails', () => {
  assert.match(verificationSource, /data-testid="assembly-workflow"/);
  assert.doesNotMatch(
    verificationSource,
    /data-testid="assembly-workflow"[^>]*(?:rounded|border)/
  );
  assert.doesNotMatch(
    verificationSource,
    /data-testid="assembly-product-image"[^>]*(?:rounded|border)/
  );
  assert.doesNotMatch(verificationSource, /bg-teal-500\/(?:5|10)/);
  assert.equal(
    verificationSource.match(/data-testid="assembly-step-status"/g)?.length,
    4
  );
});

test('customer order groups share one container with flat group and image rows', () => {
  assert.match(
    customerOrdersSource,
    /data-testid="customer-order-hardware-groups"[\s\S]*rounded-xl border/
  );
  assert.doesNotMatch(
    customerOrdersSource,
    /data-testid="customer-order-item-group"[^>]*(?:rounded|border border)/
  );
  assert.doesNotMatch(
    customerOrdersSource,
    /data-testid="customer-order-product-image"[^>]*(?:rounded|border)/
  );
});

test('customer hardware groups use the same accordion treatment as admin groups', () => {
  assert.match(customerOrdersSource, /<Collapse in=\{isGroupOpen\}>/);
  assert.match(customerOrdersSource, /aria-expanded=\{isGroupOpen\}/);
  assert.match(customerOrdersSource, /isGroupOpen && "rotate-180/);
});

test('customer assembly workflow uses the admin flat slate treatment', () => {
  assert.match(customerActivitySource, /data-testid="customer-assembly-workflow"/);
  assert.doesNotMatch(customerActivitySource, /bg-\[#092228\]/);
  assert.doesNotMatch(
    customerActivitySource,
    /data-testid="customer-assembly-workflow"[^>]*(?:rounded|border)/
  );
});

test('customer order activity is flat, always expanded, and compact', () => {
  assert.match(customerActivitySource, /data-testid="customer-order-activity"/);
  assert.doesNotMatch(customerActivitySource, /isExpanded|collapsible|History|ChevronUp|Collapse activity/);
  assert.match(customerActivitySource, /className="pt-2 space-y-4"/);
  assert.match(customerActivitySource, /className="relative pl-7 space-y-4"/);
  assert.doesNotMatch(
    customerActivitySource,
    /data-testid="customer-order-activity"[^>]*(?:rounded|border)/
  );
});

test('customer payment recovery keeps the retry action aligned right', () => {
  assert.match(
    customerOrdersSource,
    /data-testid="customer-payment-recovery"[\s\S]*?style=\{\{[\s\S]*?display: "flex"[\s\S]*?flexDirection: "row"/
  );
  assert.match(
    customerOrdersSource,
    /data-testid="customer-payment-retry"[\s\S]*?style=\{\{ marginLeft: "auto" \}\}/
  );
});
