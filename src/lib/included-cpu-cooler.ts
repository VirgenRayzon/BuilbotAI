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
