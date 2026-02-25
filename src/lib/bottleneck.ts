
import { ComponentData, Resolution, WorkloadType } from "./types";

export type BottleneckResult = {
    score: number; // 0-100 (clamped at 60 as per spec)
    type: "None" | "CPU" | "GPU" | "Balanced";
    message: string;
    cpuScore: number;
    gpuScore: number;
    cpuEff: number;
    gpuEff: number;
};

type FactorPair = { cpu: number; gpu: number };

const FACTOR_MATRIX: Record<Resolution, Record<WorkloadType, FactorPair>> = {
    '1080p': {
        'Esports': { cpu: 0.80, gpu: 1.20 }, // High CPU stress -> CPU Bottleneck
        'AAA': { cpu: 0.95, gpu: 1.05 },     // Slight CPU stress
        'Balanced': { cpu: 0.90, gpu: 1.10 } // General 1080p leans CPU
    },
    '1440p': {
        'Esports': { cpu: 0.95, gpu: 1.05 }, // Slight CPU stress
        'AAA': { cpu: 1.10, gpu: 0.90 },     // Slight GPU stress
        'Balanced': { cpu: 1.00, gpu: 1.00 } // True neutral
    },
    '4K': {
        'Esports': { cpu: 1.10, gpu: 0.90 }, // Slight GPU stress
        'AAA': { cpu: 1.30, gpu: 0.70 },     // High GPU stress -> GPU Bottleneck
        'Balanced': { cpu: 1.20, gpu: 0.80 } // General 4K leans GPU
    }
};

export function calculateBottleneck(
    build: Record<string, ComponentData | ComponentData[] | null>,
    resolution: Resolution = '1440p',
    workload: WorkloadType = 'Balanced'
): BottleneckResult {
    const cpu = build["CPU"] as ComponentData | null;
    const gpu = build["GPU"] as ComponentData | null;
    const ram = build["RAM"] ?? null;

    const ramList = Array.isArray(ram) ? ram : (ram ? [ram] : []);
    const totalRamGb = ramList.reduce((acc, r) => {
        const match = r.model.match(/(\d+)GB/i);
        return acc + (match ? parseInt(match[1]) : 8); // Default to 8 if not found
    }, 0);

    if (!cpu || !gpu) {
        return {
            score: 0,
            type: "None",
            message: "Add both a CPU and GPU to see bottleneck analysis.",
            cpuScore: 0,
            gpuScore: 0,
            cpuEff: 0,
            gpuEff: 0,
        };
    }

    // Use performanceScore (0-100), fallback to performanceTier * 10 if missing
    const cpuScore = cpu.performanceScore ?? (cpu.performanceTier ? cpu.performanceTier * 10 : 50);
    const gpuScore = gpu.performanceScore ?? (gpu.performanceTier ? gpu.performanceTier * 10 : 50);

    // Step 1: Apply Factors based on Resolution and Workload
    const factors = FACTOR_MATRIX[resolution][workload];
    let cpuEff = cpuScore * factors.cpu;
    let gpuEff = gpuScore * factors.gpu;

    // Step 2: Apply RAM Penalties
    if (totalRamGb < 8) cpuEff -= 15;
    else if (totalRamGb < 16) cpuEff -= 8;

    // Single Channel Penalty
    if (ramList.length === 1 && !ramList[0].model.toLowerCase().includes('2x') && !ramList[0].model.toLowerCase().includes('kit')) {
        cpuEff -= 5;
    }

    // Step 3: Compute bottleneck percentage
    const diff = gpuEff - cpuEff;
    const maxEff = Math.max(cpuEff, gpuEff);
    const rawPercentage = (Math.abs(diff) / maxEff) * 100;
    const score = Math.min(rawPercentage, 60);

    // Step 4: Determine outcome
    if (score < 10) {
        return {
            score,
            type: "Balanced",
            message: "Excellent! Your components are perfectly matched for this scenario.",
            cpuScore,
            gpuScore,
            cpuEff,
            gpuEff,
        };
    }

    if (gpuEff > cpuEff) {
        let tip = "Upgrade your CPU to unlock higher frame rates.";
        if (workload === 'Esports') tip = "A faster CPU is critical for high-refresh competitive gaming.";
        return {
            score,
            type: "CPU",
            message: `${Math.round(score)}% CPU Bottleneck. ${tip}`,
            cpuScore,
            gpuScore,
            cpuEff,
            gpuEff,
        };
    } else {
        let tip = "Your GPU is the limiting factor in this workload.";
        if (resolution === '4K' || workload === 'AAA') tip = "Consider a more powerful GPU for smoother high-fidelity performance.";
        return {
            score,
            type: "GPU",
            message: `${Math.round(score)}% GPU Bottleneck. ${tip}`,
            cpuScore,
            gpuScore,
            cpuEff,
            gpuEff,
        };
    }
}
