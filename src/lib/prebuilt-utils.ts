import type { Part, PrebuiltSystem } from "./types";

const essentialParts = [
    { key: 'cpu', label: 'CPU' },
    { key: 'gpu', label: 'GPU' },
    { key: 'motherboard', label: 'Motherboard' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'psu', label: 'PSU' },
    { key: 'case', label: 'Case' },
    { key: 'cooler', label: 'Cooler' },
] as const;

export type ResolvedPrebuiltPart = {
    key: string;
    category: string;
    partId: string;
    part: Part | null;
};

export type PrebuiltPartStatus = ResolvedPrebuiltPart & {
    categoryLabel: string;
    name: string;
    issue: 'missing' | 'out-of-stock' | null;
};

export function getIncludedStockCooler(partId: string): Part | null {
    if (partId !== 'included-stock-cooler') return null;
    return {
        id: partId,
        name: 'Included stock cooler',
        category: 'Cooler',
        brand: 'Included',
        price: 0,
        stock: Number.MAX_SAFE_INTEGER,
        imageUrl: '/placeholders/components/cooler.jpg',
        specifications: { Type: 'Air (Stock)' },
    };
}

export function getMissingParts(system: PrebuiltSystem): string[] {
    const missing = essentialParts
        .filter(part => {
            const selection = system.components?.[part.key];
            return !selection || (Array.isArray(selection) && selection.filter(Boolean).length === 0);
        })
        .map(part => part.label);

    return missing;
}

export function getPrebuiltPartStatuses(
    system: PrebuiltSystem,
    resolvedParts: ResolvedPrebuiltPart[],
): PrebuiltPartStatus[] {
    const selectedCounts = new Map<string, number>();
    const statuses = resolvedParts.map(entry => {
        const label = essentialParts.find(part => part.key === entry.category)?.label || entry.category;
        const part = entry.part;
        const stockKey = part ? `${entry.category}/${part.id}` : entry.key;
        const selectedCount = selectedCounts.get(stockKey) || 0;
        selectedCounts.set(stockKey, selectedCount + 1);

        return {
            ...entry,
            categoryLabel: label,
            name: part?.name || entry.partId || label,
            issue: !part || part.isArchived
                ? 'missing' as const
                : part.stock <= selectedCount ? 'out-of-stock' as const : null,
        };
    });

    for (const label of getMissingParts(system)) {
        const category = essentialParts.find(part => part.label === label)?.key || label.toLowerCase();
        statuses.push({
            key: `missing-${category}`,
            category,
            partId: '',
            part: null,
            categoryLabel: label,
            name: label,
            issue: 'missing',
        });
    }

    return statuses.sort((a, b) => Number(b.issue !== null) - Number(a.issue !== null));
}

export function isSystemComplete(system: PrebuiltSystem): boolean {
    return getMissingParts(system).length === 0;
}

export function checkSystemStock(components: Record<string, { stock: number } | null>): boolean {
    const essentialKeys = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];
    
    for (const key of essentialKeys) {
        const part = components[key];
        if (!part || part.stock <= 0) {
            return false;
        }
    }
    
    return true;
}
