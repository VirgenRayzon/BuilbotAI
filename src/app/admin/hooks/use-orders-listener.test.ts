import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./use-orders.ts', import.meta.url), 'utf8');

test('admin orders uses one live Firestore collection listener', () => {
  const subscriptions = source.match(/useCollection<Order>\(/g) ?? [];

  assert.equal(
    subscriptions.length,
    1,
    'the all-orders query already includes archived orders; a second listener creates a redundant Firestore watch target',
  );
  assert.doesNotMatch(source, /archivedOrdersQuery/);
});
