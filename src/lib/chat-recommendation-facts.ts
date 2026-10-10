import type { StructuredPart } from './inventory-fetcher';

type Detail = { label: string; keys: string[] };

const detailsByCategory: Record<string, Detail[]> = {
    cpu: [
        { label: 'Socket', keys: ['Socket'] },
        { label: 'Cores', keys: ['Cores'] },
        { label: 'Threads', keys: ['Threads'] },
    ],
    gpu: [
        { label: 'VRAM', keys: ['VRAM Capacity', 'VRAM'] },
        { label: 'Memory', keys: ['Memory Type'] },
        { label: 'Power', keys: ['TGP / Power Draw (W)'] },
    ],
    motherboard: [
        { label: 'Socket', keys: ['Socket'] },
        { label: 'Size', keys: ['Form Factor'] },
        { label: 'Memory', keys: ['RAM Type', 'Memory Type'] },
    ],
    ram: [
        { label: 'Capacity', keys: ['Capacity'] },
        { label: 'Type', keys: ['Generation', 'Memory Type', 'RAM Type'] },
        { label: 'Speed', keys: ['Speed'] },
    ],
    storage: [
        { label: 'Capacity', keys: ['Capacity'] },
        { label: 'Interface', keys: ['Interface'] },
        { label: 'Form', keys: ['Form Factor'] },
    ],
    psu: [
        { label: 'Power', keys: ['Wattage (W)'] },
        { label: 'Efficiency', keys: ['Efficiency Rating'] },
        { label: 'Cables', keys: ['Modularity'] },
    ],
    case: [
        { label: 'Type', keys: ['Case Type', 'Type'] },
        { label: 'Boards', keys: ['Mobo Support'] },
        { label: 'Radiator', keys: ['Radiator Support (mm)'] },
    ],
    cooler: [
        { label: 'Type', keys: ['Type'] },
        { label: 'Sockets', keys: ['Socket Support'] },
        { label: 'Radiator', keys: ['Radiator Size'] },
    ],
    monitor: [
        { label: 'Size', keys: ['Screen Size'] },
        { label: 'Resolution', keys: ['Resolution'] },
        { label: 'Refresh', keys: ['Refresh Rate'] },
    ],
};

function displayValue(value: unknown): string | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim();
    if (!text || text.length > 32 || /^(n\/?a|unknown|none|undefined|null|-|0)$/i.test(text)) return null;
    return text;
}

export function getChatRecommendationFacts(part: StructuredPart): string[] {
    const fields = detailsByCategory[part.category.toLowerCase()] || [];
    const specs = Object.entries(part.specifications || {});
    const fallback: Record<string, unknown> = {
        Socket: part.socket,
        'Memory Type': part.ramType,
        'RAM Type': part.ramType,
        'Wattage (W)': part.wattage,
        'TGP / Power Draw (W)': part.wattage,
    };

    return fields.flatMap(({ label, keys }) => {
        const value = keys.map(key => {
            const match = specs.find(([name]) => name.toLowerCase() === key.toLowerCase());
            return displayValue(match?.[1] ?? fallback[key]);
        }).find(Boolean);
        if (!value) return [];
        if (label === 'Socket') return [`${value} socket`];
        if (label === 'Cores' || label === 'Threads') {
            const count = value.match(/^(\d+)\s*\(/)?.[1] || value;
            return [new RegExp(label, 'i').test(count) ? count : `${count} ${label.toLowerCase()}`];
        }
        if (label === 'VRAM') return [`${value} VRAM`];
        if (label === 'Power' && /^\d+(?:\.\d+)?$/.test(value)) return [`${value} W`];
        return [`${label} ${value}`];
    }).slice(0, 3);
}
