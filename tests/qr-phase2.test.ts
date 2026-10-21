import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseScannedContent } from '../src/lib/qr-decoder';
import { qrStatusUpdateSchema } from '../src/lib/qr-lifecycle';
import { checkCompatibility } from '../src/lib/compatibility';
import type { Part, ComponentData } from '../src/lib/types';

test('QR decoder: parseScannedContent identifies valid formats correctly', () => {
  // PRD format
  const prdResult = parseScannedContent('PRD-000123');
  assert.equal(prdResult?.productId, 'PRD-000123');

  // SKU format
  const skuResult = parseScannedContent('SKU-CPU7K4M2Q8X');
  assert.equal(skuResult?.sku, 'SKU-CPU7K4M2Q8X');

  // Raw 32-char token
  const rawToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const tokenResult = parseScannedContent(rawToken);
  assert.equal(tokenResult?.token, rawToken);

  // Full hosted QR link
  const urlResult = parseScannedContent('https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(urlResult?.token, rawToken);

  // Relative QR link
  const relativeResult = parseScannedContent('/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(relativeResult?.token, rawToken);

  // Invalid strings & arbitrary non-QR URLs
  assert.equal(parseScannedContent(''), null);
  assert.equal(parseScannedContent('https://malicious-external-site.com/steal-data'), null);
  assert.equal(parseScannedContent('some random barcode text 12345'), null);
});

test('QR lifecycle: qrStatusUpdateSchema validation rules', () => {
  // Disabling requires a reason of at least 3 characters
  const validDisable = qrStatusUpdateSchema.safeParse({
    action: 'DISABLE',
    reason: 'Misprinted inventory label batch',
  });
  assert.equal(validDisable.success, true);

  const invalidDisableEmpty = qrStatusUpdateSchema.safeParse({
    action: 'DISABLE',
    reason: '  ',
  });
  assert.equal(invalidDisableEmpty.success, false);

  const invalidDisableTooShort = qrStatusUpdateSchema.safeParse({
    action: 'DISABLE',
    reason: 'no',
  });
  assert.equal(invalidDisableTooShort.success, false);

  // Enabling allows optional or minimal reason
  const validEnable = qrStatusUpdateSchema.safeParse({
    action: 'ENABLE',
    reason: '',
  });
  assert.equal(validEnable.success, true);

  // Invalid actions are rejected
  const invalidAction = qrStatusUpdateSchema.safeParse({
    action: 'DESTROY',
    reason: 'testing invalid action',
  });
  assert.equal(invalidAction.success, false);
});

test('Part compatibility engine: CPU to Motherboard socket validation', () => {
  const am5Cpu: Part = {
    id: 'prd-cpu-am5',
    productId: 'PRD-000100',
    sku: 'SKU-CPU7K4M2Q8X',
    name: 'AMD Ryzen 7 7800X3D',
    category: 'CPU',
    brand: 'AMD',
    price: 25000,
    stock: 5,
    imageUrl: '',
    specifications: { Socket: 'AM5' },
    socket: 'AM5',
  };

  const am5Mobo: ComponentData = {
    id: 'prd-mobo-am5',
    model: 'MSI B650 Gaming Plus WiFi',
    description: 'AM5 Motherboard',
    price: 11000,
    image: '',
    imageHint: '',
    icon: (() => null) as any,
    socket: 'AM5',
    specifications: { Socket: 'AM5', 'Memory Type': 'DDR5' },
  };

  const intelMobo: ComponentData = {
    id: 'prd-mobo-lga1700',
    model: 'ASUS Prime Z790-P',
    description: 'LGA1700 Motherboard',
    price: 13000,
    image: '',
    imageHint: '',
    icon: (() => null) as any,
    socket: 'LGA1700',
    specifications: { Socket: 'LGA1700', 'Memory Type': 'DDR5' },
  };

  // Compatible build
  const matchingBuild = {
    CPU: null,
    GPU: null,
    Motherboard: am5Mobo,
    RAM: [],
    Storage: [],
    PSU: null,
    Case: null,
    Cooler: null,
    Monitor: null,
    Keyboard: null,
    Mouse: null,
    Headset: null,
  };
  const matchResult = checkCompatibility(am5Cpu, matchingBuild);
  assert.equal(matchResult.compatible, true);

  // Incompatible build (AM5 CPU with LGA1700 Motherboard)
  const mismatchBuild = {
    ...matchingBuild,
    Motherboard: intelMobo,
  };
  const mismatchResult = checkCompatibility(am5Cpu, mismatchBuild);
  assert.equal(mismatchResult.compatible, false);
  assert.match(mismatchResult.message, /AM5/);
  assert.match(mismatchResult.message, /LGA1700/);
});
