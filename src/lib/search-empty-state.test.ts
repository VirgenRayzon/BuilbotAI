import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowSearchNoResults } from './search-empty-state';

test('shows no-results state when a completed search has zero matches', () => {
  assert.equal(shouldShowSearchNoResults('ryzen 9999', 0, false), true);
});

test('does not show no-results state while results are loading', () => {
  assert.equal(shouldShowSearchNoResults('ryzen 9999', 0, true), false);
});

test('does not treat an empty query as a failed search', () => {
  assert.equal(shouldShowSearchNoResults('   ', 0, false), false);
});

test('does not show no-results state when matches exist', () => {
  assert.equal(shouldShowSearchNoResults('ryzen', 2, false), false);
});
