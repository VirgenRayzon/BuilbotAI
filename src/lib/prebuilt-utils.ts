import type { PrebuiltSystem } from "./types";

/**
 * Returns a list of component categories that are missing in a prebuilt system.
 * Essential components are: cpu, gpu, motherboard, ram, storage, psu, case, cooler.
 * 
 * @param system The prebuilt system to check
 * @returns Array of missing component names (human readable)
 */
export function getMissingParts(system: PrebuiltSystem): string[] {
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

    const missing = essentialParts
        .filter(part => !system.components[part.key as keyof typeof system.components])
        .map(part => part.label);

    return missing;
}

/**
 * Checks if a prebuilt system is complete (has all essential parts).
 * 
 * @param system The prebuilt system to check
 * @returns boolean true if complete, false otherwise
 */
export function isSystemComplete(system: PrebuiltSystem): boolean {
    return getMissingParts(system).length === 0;
}
