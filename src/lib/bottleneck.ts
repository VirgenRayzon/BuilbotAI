import { ComponentData, Resolution } from "./types";

export type ComponentTier = 1 | 2 | 3 | 4; // 1: Entry, 2: Mid, 3: High, 4: Enthusiast

export interface BottleneckResult {
    status: 'Balanced' | 'Slight Mismatch' | 'Severe Mismatch' | 'Incomplete';
    message: string;
    color: string; // For UI styling
}

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

    // Use performanceTier (1-4) or fallback to mapping the 0-100 score to 1-4 for safety
    const getTier = (comp: ComponentData): ComponentTier => {
        if (comp.performanceTier) return Math.min(Math.max(comp.performanceTier, 1), 4) as ComponentTier;
        if (comp.performanceScore) {
            if (comp.performanceScore >= 85) return 4;
            if (comp.performanceScore >= 65) return 3;
            if (comp.performanceScore >= 45) return 2;
            return 1;
        }
        return 2; // Default to mid-range if unknown
    };

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
