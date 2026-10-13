import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiBuildAdvisorRecommendationsOutput } from '@/ai/schemas/build-advisor-schemas';
import type { StructuredPart } from '@/lib/inventory-fetcher';
import { validateAdvisorBuild } from '@/lib/validate-advisor-build';

const parts = [
  { id: 'cpu-am5', category: 'cpu', socket: 'AM5', price: 12000 },
  { id: 'gpu', category: 'gpu', price: 18000 },
  { id: 'board-am5', category: 'motherboard', socket: 'AM5', ramType: 'DDR5', price: 9000,
    specifications: { 'NVMe Slots': 2, 'SATA Slots': 4, 'Form Factor': 'ATX' } },
  { id: 'board-intel', category: 'motherboard', socket: 'LGA1851', ramType: 'DDR5', price: 9000,
    specifications: { 'NVMe Slots': 2, 'SATA Slots': 4, 'Form Factor': 'ATX' } },
  { id: 'ram', category: 'ram', ramType: 'DDR5', price: 4000 },
  { id: 'storage', category: 'storage', price: 3500, specifications: { Type: 'NVMe' } },
  { id: 'psu', category: 'psu', price: 4000 },
  { id: 'case', category: 'case', price: 3000,
    specifications: { 'Mobo Support': 'ATX, Micro ATX', 'Max Radiator Size (mm)': 360 } },
  { id: 'cooler', category: 'cooler', price: 2500 },
].map(part => ({ name: part.id, brand: '', model: part.id, imageUrl: '', ...part })) as StructuredPart[];

const output: AiBuildAdvisorRecommendationsOutput = {
  summary: 'Test build',
  cpu: { partId: 'cpu-am5', model: 'cpu-am5', description: '', estimatedPrice: 12000 },
  gpu: { partId: 'gpu', model: 'gpu', description: '', estimatedPrice: 18000 },
  motherboard: { partId: 'board-am5', model: 'board-am5', description: '', estimatedPrice: 9000 },
  ram: { partId: 'ram', model: 'ram', description: '', estimatedPrice: 4000 },
  storage: { partId: 'storage', model: 'storage', description: '', estimatedPrice: 3500 },
  psu: { partId: 'psu', model: 'psu', description: '', estimatedPrice: 4000 },
  case: { partId: 'case', model: 'case', description: '', estimatedPrice: 3000 },
  cooler: { partId: 'cooler', model: 'cooler', description: '', estimatedPrice: 2500 },
  estimatedWattage: '500W',
};

test('accepts a complete compatible build within budget', () => {
  assert.deepEqual(validateAdvisorBuild(output, parts, 60000, false), []);
});

test('rejects the AM5 and LGA1851 pairing before it can be returned', () => {
  const incompatible = { ...output, motherboard: { ...output.motherboard, partId: 'board-intel' } };
  assert.match(validateAdvisorBuild(incompatible, parts, 60000, false).join(' '), /Socket Mismatch: CPU is AM5, but Motherboard is LGA1851/);
});

test('rejects unknown store IDs and an over-budget build', () => {
  const invalid = { ...output, gpu: { ...output.gpu, partId: 'missing' } };
  assert.match(validateAdvisorBuild(invalid, parts, 60000, false).join(' '), /gpu store ID is invalid/);
  assert.match(validateAdvisorBuild(output, parts, 50000, false).join(' '), /above the ₱50,000 limit/);
});

test('checks socket compatibility when the motherboard comes from the external market', () => {
  const externalBoard = {
    ...output,
    motherboard: {
      ...output.motherboard,
      partId: '',
      model: 'External board',
      socket: 'LGA1851',
      ramType: 'DDR5',
      formFactor: 'ATX',
      nvmeSlots: 2,
      sataSlots: 4,
    },
  };
  assert.match(validateAdvisorBuild(externalBoard, parts, 60000, true).join(' '), /Socket Mismatch: CPU is AM5, but Motherboard is LGA1851/);
  assert.match(validateAdvisorBuild({ ...externalBoard, motherboard: { ...externalBoard.motherboard, socket: '' } }, parts, 60000, true).join(' '), /External motherboard needs a stated socket/);
});

test('treats spacing variants of the same socket as compatible', () => {
  const intelParts = parts.map(part => part.id === 'cpu-am5'
    ? { ...part, socket: 'LGA 1700' }
    : part.id === 'board-am5' ? { ...part, socket: 'LGA1700' } : part);
  assert.deepEqual(validateAdvisorBuild(output, intelParts, 60000, false), []);
});
