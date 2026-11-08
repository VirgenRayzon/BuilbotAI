import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPlaceholderOrMissingImage,
  resolveOrderItemImageUrl,
  type OrderItemLike,
} from './order-image-resolver';
import type { Part } from './types';

test('isPlaceholderOrMissingImage detects placeholders and missing images', () => {
  assert.equal(isPlaceholderOrMissingImage(undefined), true);
  assert.equal(isPlaceholderOrMissingImage(''), true);
  assert.equal(isPlaceholderOrMissingImage('/placeholders/components/cpu.jpg'), true);
  assert.equal(isPlaceholderOrMissingImage('/placeholder-part.png'), true);
  assert.equal(
    isPlaceholderOrMissingImage('https://firebasestorage.googleapis.com/test.webp'),
    false
  );
});

test('resolveOrderItemImageUrl returns existing authentic image if present', () => {
  const item: OrderItemLike = {
    name: 'Intel Core i3-10100',
    category: 'CPU',
    imageUrl: 'https://firebasestorage.googleapis.com/real-cpu.webp',
  };
  assert.equal(
    resolveOrderItemImageUrl(item),
    'https://firebasestorage.googleapis.com/real-cpu.webp'
  );
});

test('resolveOrderItemImageUrl matches from catalog parts by name or ID when image is placeholder', () => {
  const catalogParts: Part[] = [
    {
      id: 'cpu-123',
      name: 'Intel Core i3-10100',
      category: 'CPU',
      price: 6832,
      imageUrl: 'https://firebasestorage.googleapis.com/real-10100.webp',
    } as Part,
    {
      id: 'cooler-456',
      name: 'Intel Laminar RM1',
      category: 'Cooler',
      price: 0,
      imageUrl: 'https://firebasestorage.googleapis.com/real-laminar.webp',
    } as Part,
  ];

  const itemWithPlaceholder: OrderItemLike = {
    name: 'Intel Core i3-10100',
    category: 'CPU',
    imageUrl: '/placeholders/components/cpu.jpg',
  };

  assert.equal(
    resolveOrderItemImageUrl(itemWithPlaceholder, undefined, catalogParts),
    'https://firebasestorage.googleapis.com/real-10100.webp'
  );

  const coolerItem: OrderItemLike = {
    name: 'Intel Laminar RM1 CPU Cooler',
    category: 'Cooler',
    imageUrl: undefined,
  };

  assert.equal(
    resolveOrderItemImageUrl(coolerItem, undefined, catalogParts),
    'https://firebasestorage.googleapis.com/real-laminar.webp'
  );
});

test('resolveOrderItemImageUrl resolves integrated GPU image from the CPU in the order', () => {
  const orderItems: OrderItemLike[] = [
    {
      name: 'Intel Core i3-10100',
      category: 'CPU',
      imageUrl: 'https://firebasestorage.googleapis.com/real-10100.webp',
    },
    {
      name: 'Intel UHD Graphics 630',
      category: 'GPU',
      price: 0,
      imageUrl: '/placeholders/components/gpu.jpg',
    },
  ];

  const resolvedGpu = resolveOrderItemImageUrl(orderItems[1], orderItems, []);
  assert.equal(resolvedGpu, 'https://firebasestorage.googleapis.com/real-10100.webp');
});
