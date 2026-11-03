import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateCatalogName } from './catalog-name-validation';

test('findDuplicateCatalogName matches names without case or surrounding whitespace', () => {
  assert.equal(
    findDuplicateCatalogName('  amd ryzen 5 9600  ', ['Intel Core i5-12400', 'AMD Ryzen 5 9600']),
    'AMD Ryzen 5 9600'
  );
});

test('findDuplicateCatalogName ignores the current name while editing', () => {
  assert.equal(
    findDuplicateCatalogName('AMD Ryzen 5 9600', ['AMD Ryzen 5 9600'], 'AMD Ryzen 5 9600'),
    null
  );
});

test('findDuplicateCatalogName does not flag partial names', () => {
  assert.equal(findDuplicateCatalogName('AMD Ryzen 5', ['AMD Ryzen 5 9600']), null);
});
