import { INVENTORY_CATEGORY_LABELS } from './inventory-paths';
import { PRODUCT_ID_PATTERN } from './product-identity';

const CATEGORY_LABELS = Object.values(INVENTORY_CATEGORY_LABELS);

export interface InventoryQuerySource {
  name?: unknown;
  brand?: unknown;
  sku?: unknown;
  stock?: unknown;
  isArchived?: unknown;
  createdAt?: unknown;
  productId?: unknown;
}

function createdAtMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return Number(value.toMillis()) || 0;
  }
  return 0;
}

export function deriveInventoryQueryFields(source: InventoryQuerySource) {
  return {
    isArchived: source.isArchived === true,
    inStock: typeof source.stock === 'number' && source.stock > 0,
    publicCatalogEligible: typeof source.productId === 'string' && PRODUCT_ID_PATTERN.test(source.productId),
    inventoryQueryVersion: 1,
    nameSort: typeof source.name === 'string' ? source.name.trim().toLowerCase() : '',
    brandSort: typeof source.brand === 'string' ? source.brand.trim().toLowerCase() : '',
    createdAtSort: createdAtMillis(source.createdAt),
  };
}

export function normalizeInventorySelection(categories: readonly string[]): string[] {
  const selected = new Set<string>();
  for (const category of categories) {
    if (!CATEGORY_LABELS.some(label => label === category)) {
      throw new Error(`Unsupported inventory category: ${category}`);
    }
    selected.add(category);
  }
  return [...selected].sort();
}
