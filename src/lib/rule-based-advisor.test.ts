import assert from 'node:assert/strict';
import test from 'node:test';
import type { StructuredPart } from '@/lib/inventory-fetcher';
import { recommendFromInventory } from '@/lib/rule-based-advisor';
import { validateAdvisorBuild } from '@/lib/validate-advisor-build';

const makePart = (id: string, category: string, price: number, extra: Partial<StructuredPart> = {}): StructuredPart => ({
  id, category, price, name: id, brand: '', model: id, imageUrl: '', stock: 2, ...extra,
});

const inventory: StructuredPart[] = [
  makePart('apu', 'cpu', 6500, { socket: 'AM4', wattage: 65, specifications: { 'Integrated Graphics': 'Radeon Vega 7' } }),
  makePart('cpu-no-graphics', 'cpu', 5500, { socket: 'AM4', wattage: 65, specifications: { 'Integrated Graphics': 'No' } }),
  makePart('discrete', 'gpu', 8500, { wattage: 110 }),
  makePart('wrong-board', 'motherboard', 2500, { socket: 'LGA1700', ramType: 'DDR4' }),
  makePart('board', 'motherboard', 3200, { socket: 'AM4', ramType: 'DDR4', specifications: { 'NVMe Slots': 1, 'SATA Slots': 4, 'Form Factor': 'Micro ATX' } }),
  makePart('memory', 'ram', 2000, { ramType: 'DDR4' }),
  makePart('ssd', 'storage', 1800, { specifications: { Type: 'NVMe' } }),
  makePart('psu', 'psu', 1995, { wattage: 550 }),
  makePart('case', 'case', 1100, { specifications: { 'Mobo Support': 'Micro ATX' } }),
  makePart('cooler', 'cooler', 900),
];

const officeInput = {
  intendedUse: 'General Office Work', budget: '₱18,000', performanceLevel: 'Documents and video calls',
  allowAiSearch: false, allowWebSearch: false, allowFlexibleBudget: false,
};

test('uses an in-stock APU with included graphics for a low-budget office build', () => {
  const output = recommendFromInventory(officeInput, inventory, 18_000);
  assert.ok(output);
  assert.equal(output.cpu.partId, 'apu');
  assert.equal(output.gpu.partId, 'included-integrated-gpu');
  assert.equal(output.gpu.estimatedPrice, 0);
  assert.equal(output.motherboard.partId, 'board');
  assert.deepEqual(validateAdvisorBuild(output, inventory, 18_000, false), []);
});

test('does not return an incomplete or incompatible build when the budget is too low', () => {
  assert.equal(recommendFromInventory(officeInput, inventory, 12_000), null);
  assert.equal(recommendFromInventory(officeInput, inventory.filter(part => part.id !== 'board'), 18_000), null);
});

test('selects a dedicated GPU for a gaming priority', () => {
  const output = recommendFromInventory({ ...officeInput, intendedUse: 'Gaming', budget: '₱30,000',
    performanceLevel: 'Balanced 1440p gaming' }, inventory, 30_000);
  assert.ok(output);
  assert.equal(output.gpu.partId, 'discrete');
  assert.deepEqual(validateAdvisorBuild(output, inventory, 30_000, false), []);
});
