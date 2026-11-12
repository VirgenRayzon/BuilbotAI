import test from 'node:test';
import assert from 'node:assert/strict';
import type { Firestore } from 'firebase-admin/firestore';
import {
  recordPartPopularityIncrements,
  aggregatePopularityIncrements,
} from './popularity-writer';

test('aggregatePopularityIncrements aggregates duplicate paths into single increment sum', () => {
  const input = [
    { path: 'inventory/ram/items/1', delta: 1 },
    { path: 'inventory/ram/items/1', delta: 2 },
  ];
  const aggregated = aggregatePopularityIncrements(input);
  assert.deepEqual(aggregated, [
    { path: 'inventory/ram/items/1', delta: 3 },
  ]);
});

test('aggregatePopularityIncrements preserves distinct paths and ignores non-positive deltas', () => {
  const input = [
    { path: 'inventory/ram/items/1', delta: 1 },
    { path: 'inventory/cpu/items/2', delta: 1 },
    { path: 'inventory/ram/items/1', delta: 2 },
    { path: 'inventory/gpu/items/3', delta: 0 },
    { path: 'inventory/mobo/items/4', delta: -1 },
  ];
  const aggregated = aggregatePopularityIncrements(input);
  assert.deepEqual(aggregated, [
    { path: 'inventory/ram/items/1', delta: 3 },
    { path: 'inventory/cpu/items/2', delta: 1 },
  ]);
});

test('recordPartPopularityIncrements writes aggregated updates using batch update', async () => {
  type UpdateCall = { refPath: string; data: Record<string, unknown> };
  const updateCalls: UpdateCall[] = [];
  let committed = false;

  const mockDb = {
    doc(path: string) {
      return { path, id: path.split('/').pop() || '' };
    },
    batch() {
      return {
        update(ref: { path: string }, data: Record<string, unknown>) {
          updateCalls.push({ refPath: ref.path, data });
        },
        async commit() {
          committed = true;
        },
      };
    },
  };

  const increments = [
    { path: 'inventory/ram/items/1', delta: 1 },
    { path: 'inventory/ram/items/1', delta: 2 },
    { path: 'inventory/cpu/items/2', delta: 1 },
  ];

  await recordPartPopularityIncrements(
    mockDb as unknown as Firestore,
    increments
  );

  assert.equal(committed, true);
  assert.equal(updateCalls.length, 2);

  const ramCall = updateCalls.find((c) => c.refPath === 'inventory/ram/items/1');
  const cpuCall = updateCalls.find((c) => c.refPath === 'inventory/cpu/items/2');

  assert.ok(ramCall);
  assert.ok(cpuCall);
  assert.ok(ramCall?.data.popularity !== undefined);
  assert.ok(cpuCall?.data.popularity !== undefined);
});

test('recordPartPopularityIncrements no-ops cleanly on empty increments', async () => {
  let batchCalled = false;
  const mockDb = {
    doc() {
      throw new Error('should not be called');
    },
    batch() {
      batchCalled = true;
      return {
        update() {},
        async commit() {},
      };
    },
  };

  await recordPartPopularityIncrements(
    mockDb as unknown as Firestore,
    []
  );
  assert.equal(batchCalled, false);
});

test('recordPartPopularityIncrements catches non-critical failures without throwing', async () => {
  const failingDb = {
    doc(path: string) {
      return { path };
    },
    batch() {
      return {
        update() {},
        async commit() {
          throw new Error('Simulated Firestore unavailable / network error');
        },
      };
    },
  };

  await assert.doesNotReject(async () => {
    await recordPartPopularityIncrements(
      failingDb as unknown as Firestore,
      [{ path: 'inventory/ram/items/1', delta: 1 }]
    );
  });
});
