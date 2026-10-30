import assert from 'node:assert/strict';
import test from 'node:test';
import { componentFromPart, getBudgetProjection, getLiveCandidates, isSafeRecommendation, type BuilderSelection } from './live-build-recommendations';
import type { Part } from './types';

function part(category: Part['category'], id: string, overrides: Partial<Part> = {}): Part {
  return {
    id, category, name: id, brand: 'Test', price: 5_000, stock: 3,
    imageUrl: '', specifications: {}, ...overrides,
  };
}

function build(parts: Part[] = []): BuilderSelection {
  const result: BuilderSelection = { CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null,
    Cooler: null, Case: null };
  parts.forEach(item => { result[item.category] = componentFromPart(item); });
  return result;
}

test('waits for the first selected part before suggesting a catalog item', () => {
  const result = getLiveCandidates([part('Case', 'case')], build(), { resolution: '1080p', workload: 'Balanced' });
  assert.equal(result.candidates.length, 0);
  assert.match(result.message, /Add a first part/);
});

test('suggests only compatible, available CPUs for the selected motherboard', () => {
  const selected = build([
    part('Case', 'case'),
    part('Motherboard', 'am5-board', { socket: 'AM5' }),
  ]);
  const result = getLiveCandidates([
    part('CPU', 'am4-cpu', { socket: 'AM4' }),
    part('CPU', 'sold-out', { socket: 'AM5', stock: 0 }),
    part('CPU', 'am5-cpu', { socket: 'AM5' }),
  ], selected, { resolution: '1440p', workload: 'Balanced' });
  assert.deepEqual(result.candidates.map(item => item.part.id), ['am5-cpu']);
});

test('returns a distinct best match and best value in that order', () => {
  const selected = build([
    part('Case', 'case'),
    part('Motherboard', 'am5-board', { socket: 'AM5' }),
  ]);
  const result = getLiveCandidates([
    part('CPU', 'performance-pick', { socket: 'AM5', price: 50_000, performanceScore: 100 }),
    part('CPU', 'value-pick', { socket: 'AM5', price: 10_000, performanceScore: 80 }),
    part('CPU', 'slower-pick', { socket: 'AM5', price: 12_000, performanceScore: 60 }),
  ], selected, { resolution: '1440p', workload: 'Balanced' });
  assert.deepEqual(result.candidates.map(item => [item.role, item.part.id]), [
    ['bestMatch', 'performance-pick'],
    ['bestValue', 'value-pick'],
  ]);
});

test('keeps recommendations inside the explicitly filtered category', () => {
  const selected = build([
    part('Case', 'case'),
    part('Motherboard', 'board'),
    part('Storage', 'selected-storage'),
  ]);
  const result = getLiveCandidates([
    part('Storage', 'selected-storage', { price: 500, performanceScore: 100 }),
    part('PSU', 'next-missing-psu', { wattage: 1_000, performanceScore: 100 }),
    part('Storage', 'storage-match', { price: 8_000, performanceScore: 95 }),
    part('Storage', 'storage-value', { price: 2_000, performanceScore: 75 }),
  ], selected, {
    resolution: '1080p', workload: 'Balanced', preferredCategory: 'Storage',
  });
  assert.deepEqual(result.candidates.map(item => [item.role, item.part.category, item.action]), [
    ['bestMatch', 'Storage', 'add'],
    ['bestValue', 'Storage', 'add'],
  ]);
  assert.ok(result.candidates.every(item => item.part.id !== 'selected-storage'));
});

test('does not escape the active category while repairing a budget shortfall', () => {
  const selected = build([
    part('Case', 'case', { price: 20_000 }),
    part('Motherboard', 'board', { price: 20_000 }),
    part('Storage', 'selected-storage', { price: 5_000 }),
  ]);
  const result = getLiveCandidates([
    part('PSU', 'cheap-psu', { price: 1_000, wattage: 1_000 }),
    part('Storage', 'storage-match', { price: 2_000, performanceScore: 90 }),
    part('Storage', 'storage-value', { price: 1_000, performanceScore: 70 }),
  ], selected, {
    resolution: '1080p', workload: 'Balanced', budget: 60_000, preferredCategory: 'Storage',
  });
  assert.equal(result.category, 'Storage');
  assert.ok(result.candidates.every(item => item.part.category === 'Storage'));
});

test('reserves budget for every still-missing core part', () => {
  const selected = build([part('Case', 'case', { price: 4_000 })]);
  const inventory = [
    part('Motherboard', 'within-budget', { price: 6_000 }),
    part('Motherboard', 'over-budget', { price: 7_000 }),
    part('CPU', 'cpu', { price: 1_000 }),
    part('GPU', 'gpu', { price: 1_000 }),
    part('RAM', 'ram', { price: 1_000 }),
    part('Storage', 'storage', { price: 1_000 }),
    part('PSU', 'psu', { price: 1_000, wattage: 1_000 }),
    part('Cooler', 'cooler', { price: 1_000 }),
  ];
  const result = getLiveCandidates(inventory, selected, { resolution: '1080p', workload: 'Balanced', budget: 16_000 });
  assert.deepEqual(result.candidates.map(item => item.part.id), ['within-budget']);
  assert.equal(result.projection?.minimumCompleteTotal, 16_000);
});

test('shows a shortfall and a cheaper replacement before suggesting another missing part', () => {
  const selected = build([
    part('Case', 'case', { price: 5_000 }),
    part('Motherboard', 'board', { price: 8_000 }),
    part('CPU', 'cpu', { price: 13_000 }),
    part('GPU', 'selected-gpu', { price: 22_930 }),
  ]);
  const inventory = [
    part('GPU', 'cheaper-gpu', { price: 17_000 }),
    part('RAM', 'ram', { price: 1_000 }),
    part('Storage', 'storage', { price: 1_000 }),
    part('PSU', 'psu', { price: 2_000, wattage: 1_000 }),
    part('Cooler', 'cooler', { price: 1_000 }),
  ];
  const projection = getBudgetProjection(inventory, selected);
  assert.equal(projection.currentTotal, 48_930);
  assert.equal(projection.minimumRemaining, 5_000);
  assert.equal(projection.minimumCompleteTotal, 53_930);
  const result = getLiveCandidates(inventory, selected, {
    resolution: '1080p', workload: 'Balanced', budget: 50_000,
  });
  assert.deepEqual(result.candidates.map(item => [item.action, item.part.id]), [['replace', 'cheaper-gpu']]);
  assert.match(result.message, /₱3,930/);
});

test('rejects GPU suggestions that exceed PSU headroom', () => {
  const selected = build([
    part('Case', 'case'),
    part('Motherboard', 'board', { wattage: 50 }),
    part('CPU', 'cpu', { wattage: 100 }),
    part('PSU', 'psu', { wattage: 500 }),
  ]);
  assert.equal(isSafeRecommendation(part('GPU', 'high-draw', { wattage: 300 }), selected), false);
  assert.equal(isSafeRecommendation(part('GPU', 'reasonable-draw', { wattage: 150 }), selected), true);
});
