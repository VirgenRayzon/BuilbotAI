import type { Part } from './types';

/** A retail box is not evidence that a heatsink is included. */
export function includedCpuCoolerName(cpu: Part): string | null {
    if (cpu.category !== 'CPU' || cpu.packageType !== 'BOX') return null;
    // AMD specifies "Thermal Solution (PIB): Not Included" for this boxed model.
    // Keep the authoritative exception even if an older AI-filled catalog entry says otherwise.
    if (cpu.brand.toLowerCase() === 'amd' && /^(?:AMD\s+)?Ryzen(?:™)?\s+7\s+9850X3D\b/i.test(cpu.name.trim())) return null;

    const specification = Object.entries(cpu.specifications || {}).find(([key]) =>
        /^(?:thermal solution(?: \(pib\))?|included cooler|cooler included|box cooler)$/i.test(key.trim()),
    );
    if (!specification) return null;

    const value = String(specification[1]).trim();
    if (!value || /^(?:no|none|not included|n\/a|false|without cooler)$/i.test(value)) return null;
    if (/^(?:yes|included|true)$/i.test(value)) return 'Included CPU cooler';
    return value;
}

export const INCLUDED_STOCK_COOLER_ID = 'included-stock-cooler';

export function isIncludedStockCoolerPart(part: {
    category?: string;
    partId?: string;
    id?: string;
    name?: string;
    model?: string;
    price?: number;
    description?: string;
    imageHint?: string;
} | null | undefined): boolean {
    if (!part) return false;
    const id = part.id || part.partId;
    if (id === INCLUDED_STOCK_COOLER_ID || id === 'uGiAh2JerLwnDe5VW431') return true;

    const cat = (part.category || '').toLowerCase();
    if (!cat || cat === 'cooler') {
        const name = (part.model || part.name || '').toLowerCase();
        if (
            name.includes('stock cooler') ||
            name.includes('laminar') ||
            name.includes('wraith') ||
            name.includes('bundled cooler') ||
            name.includes('included cooler') ||
            name.includes('included cpu cooler')
        ) {
            return true;
        }
    }

    if (part.price === 0 && (
        part.imageHint === 'included cooler' ||
        part.description?.includes('Bundled cooler')
    )) {
        return true;
    }

    return false;
}

