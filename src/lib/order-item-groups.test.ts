import test from 'node:test';
import assert from 'node:assert/strict';
import { groupOrderItems, getCustomRigSummary } from './order-item-groups';
import type { OrderItem } from './types';

test('groupOrderItems correctly splits order with custom build and additional items', () => {
  const items: OrderItem[] = [
    { id: '1', name: 'Intel Core i3-10100', category: 'CPU', price: 6832 },
    { id: '2', name: 'Kingston NV1 500GB SSD', category: 'Storage', price: 1800 },
    { id: '3', name: 'Asus ProArt X670E Motherboard', category: 'Motherboard', price: 27599.4 },
    { id: '4', name: 'AMD Ryzen 9 9900X3D', category: 'CPU', price: 35940 },
    { id: '5', name: 'Asus ProArt RTX 5070 Ti', category: 'GPU', price: 64199.4 },
    { id: '6', name: 'Corsair Vengeance RGB 32GB', category: 'RAM', price: 14000 },
    { id: '7', name: 'Seagate FireCuda 530 1TB', category: 'Storage', price: 12600 },
    { id: '8', name: 'ASUS ROG Loki 850W', category: 'PSU', price: 11280 },
    { id: '9', name: 'NZXT Kraken Elite 360', category: 'Cooler', price: 17100 },
    { id: '10', name: 'Asus ProArt PA602 Case', category: 'Case', price: 14350 },
  ];

  const groups = groupOrderItems({ items });

  assert.equal(groups.length, 2);
  assert.equal(groups[0].name, 'My Build');
  assert.equal(groups[0].type, 'custom-build');
  assert.equal(groups[0].items.length, 8);
  assert.equal(groups[0].items[0].name, 'Asus ProArt X670E Motherboard');

  assert.equal(groups[1].name, 'Additional');
  assert.equal(groups[1].type, 'additional');
  assert.equal(groups[1].items.length, 2);
  assert.equal(groups[1].items[0].name, 'Intel Core i3-10100');
  assert.equal(groups[1].items[1].name, 'Kingston NV1 500GB SSD');
});

test('groupOrderItems handles prebuilt orders by prebuilt name', () => {
  const items: OrderItem[] = [
    { id: '1', name: 'Ryzen 7 8700F', category: 'CPU', price: 10080 },
    { id: '2', name: 'Radeon RX 9070 GRE', category: 'GPU', price: 30800 },
  ];

  const groups = groupOrderItems({
    items,
    type: 'prebuilt',
    prebuiltName: 'Archangel 5',
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, 'Archangel 5');
  assert.equal(groups[0].type, 'prebuilt');
  assert.equal(groups[0].items.length, 2);
});

test('groupOrderItems respects explicit groupName tags on items', () => {
  const items: OrderItem[] = [
    { id: '1', name: 'Part A', category: 'CPU', price: 1000, groupName: 'My Build', buildType: 'custom-build' },
    { id: '2', name: 'Part B', category: 'GPU', price: 2000, groupName: 'My Build', buildType: 'custom-build' },
    { id: '3', name: 'Prebuilt CPU', category: 'CPU', price: 3000, groupName: 'Valkyrie V2', buildType: 'prebuilt' },
    { id: '4', name: 'Mouse Pad', category: 'Accessory', price: 500, groupName: 'Additional', buildType: 'additional' },
  ];

  const groups = groupOrderItems({ items });

  assert.equal(groups.length, 3);
  const myBuild = groups.find(g => g.name === 'My Build');
  const prebuilt = groups.find(g => g.name === 'Valkyrie V2');
  const additional = groups.find(g => g.name === 'Additional');

  assert.ok(myBuild);
  assert.equal(myBuild.items.length, 2);
  assert.ok(prebuilt);
  assert.equal(prebuilt.items.length, 1);
  assert.ok(additional);
  assert.equal(additional.items.length, 1);
});

test('getCustomRigSummary constructs concise rig specs with CPU, GPU, and RAM', () => {
  const items: OrderItem[] = [
    { id: '1', name: 'Asus ProArt X670E-Creator WiFi Motherboard', category: 'Motherboard', price: 27599.4 },
    { id: '2', name: 'AMD Ryzen 9 9900X3D', category: 'CPU', price: 35940 },
    { id: '3', name: 'Asus ProArt GeForce RTX 5070 Ti OC 16GB GDDR7 Graphics Card', category: 'GPU', price: 64199.4 },
    { id: '4', name: 'Corsair Vengeance RGB 32GB (2×16GB) DDR5 6000MHz CL36', category: 'RAM', price: 14000 },
    { id: '5', name: 'Seagate FireCuda 530 M.2 1TB', category: 'Storage', price: 12600 },
  ];

  const summary = getCustomRigSummary(items);
  assert.equal(
    summary,
    'Custom Rig (AMD Ryzen 9 9900X3D, Asus ProArt GeForce RTX 5070 Ti OC 16GB GDDR7, Corsair Vengeance RGB 32GB (2×16GB) DDR5 6000MHz CL36)'
  );

  assert.equal(getCustomRigSummary([]), 'Custom Rig');
});
