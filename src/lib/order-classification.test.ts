import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyOrder } from './order-classification';
import { availableOrderStages, assertOrderStageTransition } from './order-workflow';
import type { Order, OrderItem } from './types';

const part = (category: string, buildType?: OrderItem['buildType']): OrderItem =>
  ({ id: category, name: category, category, price: 100, ...(buildType ? { buildType } : {}) });

test('explicit standalone hardware overrides old custom labels and component heuristics', () => {
  const order = { type: 'custom' as const, items: ['CPU', 'Motherboard', 'RAM'].map(c => part(c, 'part')) };
  assert.deepEqual(classifyOrder(order), { requiresAssembly: false, requiresReview: false, source: 'items' });
  assert.deepEqual(availableOrderStages(order), ['order_placed', 'out_for_delivery', 'delivered']);
});

test('mixed rigs and additional hardware still require assembly', () => {
  assert.equal(classifyOrder({ items: [part('CPU', 'custom-build'), part('GPU', 'part')] }).requiresAssembly, true);
  assert.equal(classifyOrder({ items: [part('CPU', 'prebuilt')] }).requiresAssembly, true);
});

test('legacy orders preserve their routing and expose review requirement', () => {
  assert.deepEqual(classifyOrder({ items: [part('Motherboard')] }),
    { requiresAssembly: true, requiresReview: true, source: 'legacy' });
  assert.equal(classifyOrder({ type: 'custom', items: [part('CPU')] }).requiresAssembly, true);
  assert.equal(classifyOrder({ type: 'prebuilt', items: [] }).requiresAssembly, true);
  assert.equal(classifyOrder({ items: [part('CPU')] }).requiresAssembly, false);
});

test('explicit additional group never becomes a rig because of category', () => {
  assert.equal(classifyOrder({ items: [{ ...part('Motherboard'), groupName: 'Additional' }] }).requiresAssembly, false);
});

test('an existing parts order already building can finish its current stage', () => {
  const order: Order = { id: 'old-parts', userId: 'customer', userEmail: 'c@test.com',
    items: [part('Motherboard', 'part')], totalPrice: 100, status: 'building',
    paymentMethod: 'cod', createdAt: '2026-11-02' };
  assert.doesNotThrow(() => assertOrderStageTransition(order, 'out_for_delivery'));
});
