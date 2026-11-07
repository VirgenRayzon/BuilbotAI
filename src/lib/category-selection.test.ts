import assert from 'node:assert/strict';
import test from 'node:test';

import { hasNoSelectedCategories } from './category-selection';

test('reports an empty category selection only when filters exist and all are cleared', () => {
  assert.equal(hasNoSelectedCategories([
    { name: 'CPU', selected: false },
    { name: 'GPU', selected: false },
  ]), true);

  assert.equal(hasNoSelectedCategories([
    { name: 'CPU', selected: true },
    { name: 'GPU', selected: false },
  ]), false);

  assert.equal(hasNoSelectedCategories([]), false);
});
