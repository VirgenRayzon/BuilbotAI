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

export async function getAdvisorInventoryMenu(budgetLimit: number) {
  const inventory = await Promise.all(CATEGORIES.map(category => getStructuredInventory(category, undefined, 50)));
  const available = inventory.map(items => items.filter(item =>
    Number.isFinite(item.price) && item.price > 0 && (typeof item.stock !== 'number' || item.stock > 0)));
  const minimumTotal = available.reduce((sum, items) => sum + (items.length ? Math.min(...items.map(item => item.price)) : 0), 0);
  const missingCategories = CATEGORIES.filter((_, index) => available[index].length === 0);
  const extraBudget = Math.max(0, budgetLimit - minimumTotal);
  const selected: StructuredPart[] = [];

  CATEGORIES.forEach((category, index) => {
    const items = available[index];
    if (!items.length) return;
    const minimum = Math.min(...items.map(item => item.price));
    const ceiling = minimum + extraBudget * EXTRA_BUDGET_WEIGHTS[category];
    const eligible = items.filter(item => item.price <= ceiling + 0.01);
    const cheapest = [...eligible].sort((a, b) => a.price - b.price)[0];
    const nearTarget = [...eligible]
      .sort((a, b) => Math.abs(a.price - ceiling) - Math.abs(b.price - ceiling))
      .slice(0, 4);
    const shortlist = [cheapest, ...nearTarget].filter((item, position, list) =>
      item && list.findIndex(other => other?.id === item.id) === position);
    selected.push(...shortlist);
  });

  const menu = selected.map(item =>
    `[ID: ${item.id}] [${item.category.toUpperCase()}] Name: "${item.name}" - Price: ₱${item.price.toLocaleString()}`
  ).join('\n');

  return { menu, selected, minimumTotal, missingCategories };
}
