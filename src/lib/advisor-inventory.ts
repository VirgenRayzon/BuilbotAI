import { getStructuredInventory, type StructuredPart } from '@/lib/inventory-fetcher';

const CATEGORIES = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;
const EXTRA_BUDGET_WEIGHTS: Record<(typeof CATEGORIES)[number], number> = {
  cpu: 0.18,
  gpu: 0.35,
  motherboard: 0.11,
  ram: 0.07,
  storage: 0.08,
  psu: 0.08,
  case: 0.08,
  cooler: 0.05,
};

const socketOf = (item: StructuredPart) =>
  String(item.specifications?.['Socket'] ?? item.specifications?.['socket'] ?? item.socket ?? '')
    .trim().toLowerCase().replace(/\s+/g, '');

function compatibilityDetails(item: StructuredPart): string {
  const specs = item.specifications ?? {};
  const fields: Array<[string, unknown]> = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim()) fields.push([label, value]);
  };

  if (item.category === 'cpu' || item.category === 'motherboard') add('Socket', specs['Socket'] ?? specs['socket'] ?? item.socket);
  if (item.category === 'motherboard') {
    add('Memory', specs['Memory Type'] ?? specs['RAM Type'] ?? specs['Memory'] ?? item.ramType);
    add('Form factor', specs['Form Factor']);
    add('NVMe slots', specs['NVMe Slots']);
    add('SATA slots', specs['SATA Slots']);
  }
  if (item.category === 'ram') add('Memory', specs['Generation'] ?? specs['Type'] ?? item.ramType);
  if (item.category === 'storage') add('Type', specs['Type']);
  if (item.category === 'case') {
    add('Motherboard support', specs['Mobo Support'] ?? specs['Type']);
    add('Max radiator mm', specs['Max Radiator Size (mm)']);
  }
  if (item.category === 'cooler') add('Radiator size', specs['Radiator Size']);
  if (item.category === 'psu') add('Wattage', item.wattage ?? specs['Wattage']);
  return fields.length ? ` | ${fields.map(([label, value]) => `${label}: ${String(value)}`).join(', ')}` : '';
}

export async function getAdvisorInventoryMenu(budgetLimit: number) {
  const inventory = await Promise.all(CATEGORIES.map(category => getStructuredInventory(category, undefined, 50)));
  const available = inventory.map(items => items.filter(item =>
    Number.isFinite(item.price) && item.price > 0 && (typeof item.stock !== 'number' || item.stock > 0)));
  const minimumTotal = available.reduce((sum, items) => sum + (items.length ? Math.min(...items.map(item => item.price)) : 0), 0);
  const missingCategories = CATEGORIES.filter((_, index) => available[index].length === 0);
  const extraBudget = Math.max(0, budgetLimit - minimumTotal);
  const selected: StructuredPart[] = [];

  CATEGORIES.forEach((category, index) => {
    const cpuSockets = new Set(selected.filter(part => part.category === 'cpu').map(socketOf).filter(Boolean));
    const items = category === 'motherboard' && cpuSockets.size > 0
      ? available[index].filter(item => !socketOf(item) || cpuSockets.has(socketOf(item)))
      : available[index];
    if (!items.length) return;
    const minimum = Math.min(...items.map(item => item.price));
    const ceiling = minimum + extraBudget * EXTRA_BUDGET_WEIGHTS[category];
    const eligible = items.filter(item => item.price <= ceiling + 0.01);
    const cheapest = [...eligible].sort((a, b) => a.price - b.price)[0];
    const nearTarget = [...eligible]
      .sort((a, b) => Math.abs(a.price - ceiling) - Math.abs(b.price - ceiling))
      .slice(0, 4);
    const platformOptions = category === 'motherboard'
      ? [...new Set(eligible.map(socketOf).filter(Boolean))].map(socket =>
          [...eligible].filter(item => socketOf(item) === socket).sort((a, b) => a.price - b.price)[0])
      : [];
    const shortlist = [cheapest, ...platformOptions, ...nearTarget].filter((item, position, list) =>
      item && list.findIndex(other => other?.id === item.id) === position);
    selected.push(...shortlist);
  });

  const menu = selected.map(item =>
    `[ID: ${item.id}] [${item.category.toUpperCase()}] Name: "${item.name}" - Price: ₱${item.price.toLocaleString()}${compatibilityDetails(item)}`
  ).join('\n');

  return { menu, selected, minimumTotal, missingCategories };
}
