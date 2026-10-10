import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterChatRecommendations } from './chat-recommendations';
import type { StructuredPart } from './inventory-fetcher';
import type { ComponentData } from './types';

const part = (overrides: Partial<StructuredPart> = {}): StructuredPart => ({
  id: 'candidate',
  name: 'Candidate',
  brand: 'Test',
  model: 'Candidate',
  category: 'cpu',
  price: 10000,
  stock: 2,
  imageUrl: '',
  socket: 'AM5',
  specifications: { Socket: 'AM5' },
  ...overrides,
});

const selected = (overrides: Partial<ComponentData> = {}): ComponentData => ({
  id: 'selected',
  model: 'Selected',
  description: '',
  price: 10000,
  image: '',
  imageHint: '',
  icon: (() => null) as ComponentData['icon'],
  ...overrides,
});

test('keeps only available parts within the requested budget', () => {
  const inventory = [
    part(),
    part({ id: 'out', stock: 0 }),
    part({ id: 'archived', isArchived: true }),
    part({ id: 'expensive', price: 20000 }),
  ];
  assert.deepEqual(filterChatRecommendations(inventory, 'cpu', null, 15000).map(p => p.id), ['candidate']);
});

test('shows higher performance GPUs first after filtering by budget and stock', () => {
  const inventory = [
    part({ id: 'entry', category: 'gpu', price: 11000, performanceScore: 40 }),
    part({ id: 'strong', category: 'gpu', price: 32000, performanceScore: 85 }),
    part({ id: 'over-budget', category: 'gpu', price: 45000, performanceScore: 95 }),
    part({ id: 'mid', category: 'gpu', price: 20000, performanceScore: 70 }),
  ];
  assert.deepEqual(filterChatRecommendations(inventory, 'gpu', null, 40000).map(p => p.id), ['strong', 'mid', 'entry']);
});

test('uses the selected motherboard socket and excludes the selected CPU', () => {
  const build = {
    Motherboard: selected({ id: 'board', socket: 'AM5' }),
    CPU: selected({ id: 'already-selected', socket: 'AM5' }),
  };
  const inventory = [
    part({ id: 'am5' }),
    part({ id: 'am4', socket: 'AM4', specifications: { Socket: 'AM4' } }),
    part({ id: 'already-selected' }),
  ];
  assert.deepEqual(filterChatRecommendations(inventory, 'cpu', build).map(p => p.id), ['am5']);
});

test('does not offer a PSU without headroom for selected parts', () => {
  const build = { CPU: selected({ wattage: 120 }), GPU: selected({ id: 'gpu', wattage: 300 }) };
  const inventory = [
    part({ id: '500w', category: 'psu', wattage: 500 }),
    part({ id: '650w', category: 'psu', wattage: 650 }),
  ];
  assert.deepEqual(filterChatRecommendations(inventory, 'psu', build).map(p => p.id), ['650w']);
});

test('does not offer RAM that exceeds the selected motherboard slots', () => {
  const build = {
    Motherboard: selected({ ramType: 'DDR5', specifications: { 'Memory Slots': 2 } }),
    RAM: [selected({ id: 'kit', ramType: 'DDR5', specifications: { 'Stick Count': 2 } })],
  };
  assert.deepEqual(filterChatRecommendations([
    part({ id: 'new-kit', category: 'ram', ramType: 'DDR5', specifications: { 'Stick Count': 2 } }),
  ], 'ram', build), []);
});
