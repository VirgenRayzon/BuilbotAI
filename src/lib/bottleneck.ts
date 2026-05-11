/**
 * bottleneck — CPU/GPU balance analysis engine.
 * Compares performance tiers of CPU and GPU at a given resolution
 * to detect mismatches (bottlenecks) and provide actionable guidance.
 */
import { ComponentData, Resolution } from "./types";

export type ComponentTier = 1 | 2 | 3 | 4; // 1: Entry, 2: Mid, 3: High, 4: Enthusiast

export interface BottleneckResult {
    status: 'Balanced' | 'Slight Mismatch' | 'Severe Mismatch' | 'Incomplete';
    message: string;
    color: string; // For UI styling
}

// Use performanceTier (1-4) or fallback to mapping the 0-100 score to 1-4 for safety
export const getTier = (comp: ComponentData): ComponentTier => {
    if (comp.performanceTier) return Math.min(Math.max(comp.performanceTier, 1), 4) as ComponentTier;
    if (comp.performanceScore) {
        if (comp.performanceScore >= 85) return 4;
        if (comp.performanceScore >= 65) return 3;
        if (comp.performanceScore >= 45) return 2;
        return 1;
    }
    return 2; // Default to mid-range if unknown
};

export const calculateBottleneck = (
    build: Record<string, ComponentData | ComponentData[] | null>,
    resolution: Resolution = '1080p'
): BottleneckResult => {
    const cpu = build["CPU"] as ComponentData | null;
    const gpu = build["GPU"] as ComponentData | null;

    if (!cpu || !gpu) {
        return {
            status: 'Incomplete',
            message: 'Add both a CPU and GPU to see the system balance analysis.',
            color: '#9ca3af', // Gray
        };
    }

    const cpuTier = getTier(cpu);
    const gpuTier = getTier(gpu);

    const delta = cpuTier - gpuTier;

    // Case 1: CPU is much weaker than GPU
    if (delta <= -2) {
        return {
            status: 'Severe Mismatch',
            message: `Your CPU is significantly underpowered for this GPU. Expect major stutters at ${resolution}.`,
            color: '#ef4444', // Red
        };
    }

    // Case 2: CPU is slightly weaker than GPU
    if (delta === -1) {
        if (resolution === '4K') {
            return {
                status: 'Balanced',
                message: 'At 4K, this pairing is well-balanced as the workload is GPU-heavy.',
                color: '#22c55e', // Green
            };
        }
        return {
            status: 'Slight Mismatch',
            message: `Minor CPU bottleneck possible at ${resolution}. Consider a one-tier higher CPU for better 1% lows.`,
            color: '#f59e0b', // Amber
        };
    }

    // Case 3: GPU is much weaker than CPU (Inverse Bottleneck)
    if (delta >= 2) {
        return {
            status: 'Slight Mismatch',
            message: 'Your CPU is overkill for this GPU. You could save money by dropping a CPU tier without losing FPS.',
            color: '#f59e0b', // Amber
        };
    }

    // Default: Perfectly Balanced
    return {
        status: 'Balanced',
        message: 'This is a high-efficiency pairing with optimal performance scaling.',
        color: '#22c55e', // Green
    };
};

export interface SynergyResult {
    score: number;
    status: 'Perfect' | 'Great' | 'Good' | 'Fair' | 'Poor' | 'Incomplete';
    color: string;
    breakdown: {
        balance: number;
        power: number;
        completeness: number;
        tierConsistency: number;
    };
}

export const calculateSynergyScore = (
    build: Record<string, ComponentData | ComponentData[] | null>,
    resolution: Resolution = '1080p'
): SynergyResult => {
    const mandatoryCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
    const selectedCount = mandatoryCategories.filter(cat => {
        const val = build[cat];
        return Array.isArray(val) ? val.length > 0 : !!val;
    }).length;

    // 1. Completeness (25 points)
    const completenessScore = (selectedCount / mandatoryCategories.length) * 25;

    if (selectedCount < 2) {
        return {
            score: Math.round(completenessScore),
            status: 'Incomplete',
            color: '#9ca3af',
            breakdown: { balance: 0, power: 0, completeness: completenessScore, tierConsistency: 0 }
        };
    }

    // 2. Balance (Bottleneck) (35 points)
    const bottleneck = calculateBottleneck(build, resolution);
    let balanceScore = 0;
    if (bottleneck.status === 'Balanced') balanceScore = 35;
    else if (bottleneck.status === 'Slight Mismatch') balanceScore = 20;
    else if (bottleneck.status === 'Severe Mismatch') balanceScore = 5;

    // 3. Power Headroom (20 points)
    const totalWattage = Object.entries(build).reduce((acc, [key, component]) => {
        const drawingParts = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage'];
        if (!drawingParts.includes(key)) return acc;
        if (Array.isArray(component)) return acc + component.reduce((sum, c) => sum + (c.wattage || 0), 0);
        return acc + ((component as any)?.wattage || 0);
    }, 0);
    const psu = build['PSU'] as ComponentData | null;
    const psuWattage = psu?.wattage || 0;

    let powerScore = 0;
    if (psuWattage > 0) {
        const ratio = totalWattage / psuWattage;
        if (ratio > 0.4 && ratio < 0.8) powerScore = 20; // Ideal efficiency
        else if (ratio <= 0.4 || (ratio >= 0.8 && ratio < 1.0)) powerScore = 10;
        else if (ratio >= 1.0) powerScore = 0;
    }

    // 4. Tier Consistency (20 points)
    const tiers = Object.values(build)
        .flat()
        .filter(p => p !== null)
        .map(p => getTier(p as ComponentData));
    
    let tierScore = 0;
    if (tiers.length > 1) {
        const avgTier = tiers.reduce((a, b) => a + b, 0) / tiers.length;
        const variance = tiers.reduce((a, b) => a + Math.pow(b - avgTier, 2), 0) / tiers.length;
        tierScore = Math.max(0, 20 - (variance * 10));
    }

    const totalScore = Math.min(100, Math.round(completenessScore + balanceScore + powerScore + tierScore));

    let status: SynergyResult['status'] = 'Fair';
    let color = '#f59e0b'; // Amber

    if (totalScore >= 95) { status = 'Perfect'; color = '#22d3ee'; } // Cyan
    else if (totalScore >= 80) { status = 'Great'; color = '#22c55e'; } // Green
    else if (totalScore >= 65) { status = 'Good'; color = '#10b981'; } // Emerald
    else if (totalScore >= 40) { status = 'Fair'; color = '#f59e0b'; } // Amber
    else { status = 'Poor'; color = '#ef4444'; } // Red

    if (selectedCount < mandatoryCategories.length) status = 'Incomplete';

    return {
        score: totalScore,
        status,
        color,
        breakdown: {
            balance: balanceScore,
            power: powerScore,
            completeness: completenessScore,
            tierConsistency: tierScore
        }
    };
};
