import type { Part } from '@/lib/types';

export const INVENTORY_CATEGORY_LABELS = {
    cpu: 'CPU',
    gpu: 'GPU',
    motherboard: 'Motherboard',
    ram: 'RAM',
    storage: 'Storage',
    psu: 'PSU',
    case: 'Case',
    cooler: 'Cooler',
    monitor: 'Monitor',
    keyboard: 'Keyboard',
    mouse: 'Mouse',
    headset: 'Headset',
} as const satisfies Record<Lowercase<Part['category']>, Part['category']>;

export type InventoryCategorySlug = keyof typeof INVENTORY_CATEGORY_LABELS;

export const INVENTORY_CATEGORY_SLUGS = Object.keys(
    INVENTORY_CATEGORY_LABELS
) as InventoryCategorySlug[];

export function inventoryCategorySlug(category: string): InventoryCategorySlug {
    const slug = category.trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(INVENTORY_CATEGORY_LABELS, slug)) {
        throw new Error(`Unsupported inventory category: ${category}`);
    }
    return slug as InventoryCategorySlug;
}

export function inventoryCategoryLabel(category: string): Part['category'] {
    return INVENTORY_CATEGORY_LABELS[inventoryCategorySlug(category)];
}

export function inventoryCategoryPath(category: string): string {
    return `inventory/${inventoryCategorySlug(category)}`;
}

export function inventoryItemsPath(category: string): string {
    return `${inventoryCategoryPath(category)}/items`;
}

export function inventoryItemPath(category: string, partId: string): string {
    if (!partId || partId.includes('/')) {
        throw new Error(`Invalid inventory item ID: ${partId}`);
    }
    return `${inventoryItemsPath(category)}/${partId}`;
}
