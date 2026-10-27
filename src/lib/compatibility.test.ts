import assert from 'node:assert/strict';
import test from 'node:test';
import { Server } from 'lucide-react';
import { checkCompatibility, resolveSocket } from './compatibility';
import type { ComponentData, Part } from './types';

const motherboard = (model: string, socket?: string): ComponentData => ({
  id: model,
  model,
  description: '',
  price: 0,
  image: '',
  imageHint: '',
  icon: Server,
  specifications: socket ? { Socket: socket } : {},
});

const cpu = (name: string, socket?: string): Part => ({
  id: name,
  name,
  category: 'CPU',
  brand: name.startsWith('AMD') ? 'AMD' : 'Intel',
  price: 0,
  stock: 1,
  imageUrl: '',
  specifications: socket ? { Socket: socket } : {},
});

test('infers sockets for legacy CPU and motherboard records', () => {
  assert.equal(resolveSocket(motherboard('MSI PRO B860M-C EX DDR5')), 'lga1851');
  assert.equal(resolveSocket(cpu('AMD Ryzen 7 8700F')), 'am5');
  assert.equal(resolveSocket(cpu('Intel Core i3-10100')), 'lga1200');
  assert.equal(resolveSocket(cpu('Intel Core i5-13400')), 'lga1700');
});

test('automatically identifies CPU options that conflict with the selected motherboard', () => {
  const build = { Motherboard: motherboard('MSI PRO B860M-C EX DDR5'), CPU: null };
  const amdCpu = cpu('AMD Ryzen 7 8700F');
  assert.equal(checkCompatibility(amdCpu, build).compatible, false);
  assert.equal(checkCompatibility(cpu('Intel Core Ultra 5 245K', 'LGA1851'), build).compatible, true);
});

test('automatically identifies motherboard options that conflict with the selected CPU', () => {
  const selectedCpu = cpu('Intel Core i5-13400', 'LGA1700');
  const build = {
    CPU: {
      id: selectedCpu.id,
      model: selectedCpu.name,
      description: '', price: 0, image: '', imageHint: '', icon: Server,
      specifications: selectedCpu.specifications,
    },
    Motherboard: null,
  };
  const amdBoard: Part = {
    id: 'b650', name: 'Gigabyte B650M Gaming WiFi', category: 'Motherboard', brand: 'Gigabyte',
    price: 0, stock: 1, imageUrl: '', specifications: {},
  };
  assert.equal(checkCompatibility(amdBoard, build).compatible, false);
});
