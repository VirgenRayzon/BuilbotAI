import assert from 'node:assert/strict';
import test from 'node:test';
import { includedCpuCoolerName, isIncludedStockCoolerPart } from './included-cpu-cooler';
import { prebuiltProductSchema } from './product-schemas';
import type { Part } from './types';

const cpu = (thermalSolution: string): Part => ({
    id: 'cpu', name: 'Ryzen 7 9850X3D', category: 'CPU', brand: 'AMD',
    price: 100, stock: 1, imageUrl: '', packageType: 'BOX',
    specifications: { 'Thermal Solution (PIB)': thermalSolution },
});

test('boxed CPUs only get a bundled cooler when the catalog explicitly confirms one', () => {
    assert.equal(includedCpuCoolerName(cpu('Not Included')), null);
    assert.equal(includedCpuCoolerName(cpu('AMD Wraith MAX')), null);
    assert.equal(includedCpuCoolerName({ ...cpu('AMD Wraith Stealth'), name: 'AMD Ryzen 5 5600' }), 'AMD Wraith Stealth');
    assert.equal(includedCpuCoolerName({ ...cpu(''), specifications: {} }), null);
});

test('prebuilt save validation rejects missing cooler and accepts a configured one', () => {
    const payload = {
        name: 'Test system', tier: 'Mid-Range', price: 100, imageUrl: '',
        components: {
            cpu: 'cpu', gpu: 'gpu', motherboard: 'board', ram: ['ram'],
            storage: ['storage'], psu: 'psu', case: 'case', cooler: '',
        },
    };
    assert.equal(prebuiltProductSchema.safeParse(payload).success, false);
    assert.equal(prebuiltProductSchema.safeParse({
        ...payload, components: { ...payload.components, cooler: 'included-stock-cooler' },
    }).success, true);
});

test('isIncludedStockCoolerPart detects stock coolers by id, price, and model names', () => {
    assert.equal(isIncludedStockCoolerPart({ category: 'Cooler', partId: 'included-stock-cooler', name: 'Intel Laminar RM1' }), true);
    assert.equal(isIncludedStockCoolerPart({ category: 'Cooler', partId: 'uGiAh2JerLwnDe5VW431', name: 'Intel Laminar RM1' }), true);
    assert.equal(isIncludedStockCoolerPart({ category: 'Cooler', partId: 'custom-id', name: 'Intel Laminar RM1' }), true);
    assert.equal(isIncludedStockCoolerPart({ category: 'Cooler', partId: 'custom-id', name: 'AMD Wraith Stealth' }), true);
    assert.equal(isIncludedStockCoolerPart({ category: 'Cooler', partId: 'cooler-1', name: 'Deepcool AK400', price: 1500 }), false);
    assert.equal(isIncludedStockCoolerPart(null), false);
});

