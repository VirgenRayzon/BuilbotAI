import assert from 'node:assert/strict';
import test from 'node:test';
import { Server } from 'lucide-react';
import { createIntegratedGpuComponent, integratedGraphicsName, isIncludedIntegratedGpu, syncIntegratedGraphics } from './integrated-graphics';
import type { ComponentData } from './types';

const cpu = (model: string, graphics?: string): ComponentData => ({
  id: model,
  model,
  description: '',
  price: 10000,
  image: '',
  imageHint: '',
  icon: Server,
  specifications: graphics === undefined ? {} : { 'Integrated Graphics': graphics },
});

test('explicit graphics specifications override CPU model fallback', () => {
  assert.equal(integratedGraphicsName(cpu('Intel Core i3-10100', 'No')), null);
  assert.equal(integratedGraphicsName(cpu('Intel Core i3-10100', 'No iGPU')), null);
  assert.equal(integratedGraphicsName(cpu('Intel Core i3-10100', 'Intel UHD Graphics 630')), 'Intel UHD Graphics 630');
  assert.equal(integratedGraphicsName(cpu('AMD Ryzen 7 8700G', 'Yes')), 'AMD Ryzen 7 8700G integrated graphics');
});

test('model fallback excludes F variants and includes known graphics families', () => {
  assert.equal(integratedGraphicsName(cpu('Intel Core i5-12400F')), null);
  assert.equal(integratedGraphicsName(cpu('Intel Core Ultra 5 245KF')), null);
  assert.equal(integratedGraphicsName(cpu('AMD Ryzen 7 8700F')), null);
  assert.match(integratedGraphicsName(cpu('Intel Core i3-10100')) || '', /integrated graphics/);
  assert.match(integratedGraphicsName(cpu('AMD Ryzen 7 8700G')) || '', /integrated graphics/);
  assert.equal(integratedGraphicsName(cpu('Unknown CPU 1234')), null);
});

test('included GPU counts as a separate zero-price part and yields to a dedicated card', () => {
  const selectedCpu = cpu('AMD Ryzen 7 8700G');
  const build = syncIntegratedGraphics({ CPU: selectedCpu, GPU: null as ComponentData | null });
  const included = build.GPU;
  assert.ok(included && isIncludedIntegratedGpu(included));
  assert.equal(included.price, 0);
  assert.equal(included.sourceCpuId, selectedCpu.id);
  assert.equal(Object.values(build).filter(Boolean).length, 2);

  const dedicated = { ...createIntegratedGpuComponent(selectedCpu)!, id: 'dedicated-gpu', model: 'Discrete card', price: 12000 };
  assert.equal(syncIntegratedGraphics({ CPU: selectedCpu, GPU: dedicated }).GPU, dedicated);
  assert.equal(syncIntegratedGraphics({ CPU: null, GPU: included }).GPU, null);
  assert.equal(syncIntegratedGraphics({ CPU: cpu('Intel Core i5-12400F'), GPU: included }).GPU, null);
});
