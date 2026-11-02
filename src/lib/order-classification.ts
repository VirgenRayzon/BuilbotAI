import type { Order, OrderItem } from './types';

function itemKind(item: OrderItem): 'build' | 'part' | 'unknown' {
  if (item.buildType === 'custom-build' || item.buildType === 'prebuilt') return 'build';
  if (item.buildType === 'part' || item.buildType === 'additional') return 'part';
  if (item.groupName === 'My Build') return 'build';
  if (item.groupName === 'Additional') return 'part';
  return 'unknown';
}

/** Explicit line metadata wins; legacy heuristics remain visible as review cases. */
export function classifyOrder(order: Pick<Order, 'items' | 'type' | 'prebuiltName'>) {
  const items = order.items || [];
  const kinds = items.map(itemKind);
  if (kinds.includes('build')) {
    return { requiresAssembly: true, requiresReview: false, source: 'items' as const };
  }
  if (items.length > 0 && kinds.every(kind => kind === 'part')) {
    return { requiresAssembly: false, requiresReview: false, source: 'items' as const };
  }
  const hardware = new Set(['CPU', 'MOTHERBOARD', 'GPU', 'RAM', 'MEMORY', 'STORAGE', 'PSU', 'POWER SUPPLY', 'CASE', 'COOLER']);
  const unknownItems = items.filter((_, index) => kinds[index] === 'unknown');
  const categories = unknownItems.map(item => String(item.category || '').trim().toUpperCase());
  const requiresAssembly = order.type === 'custom' || order.type === 'prebuilt' ||
    Boolean(order.prebuiltName) || categories.includes('MOTHERBOARD') ||
    categories.filter(category => hardware.has(category)).length >= 3;
  return { requiresAssembly, requiresReview: true, source: 'legacy' as const };
}
