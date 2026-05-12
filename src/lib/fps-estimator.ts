/**
 * fps-estimator — Estimated FPS calculation engine for the analytics sidebar.
 * Uses CPU/GPU performance tiers and resolution to generate average FPS values
 * and chart data for the Recharts visualization in BuilderSidebarLeft.
 */
import { ComponentData, Resolution, WorkloadType } from "./types";
import { getTier, ComponentTier } from "./bottleneck";

export interface FpsEstimate {
    averageFps: number;
    lowsFps: number;
    peakFps: number;
    chartData: { resolution: string; average: number; lows: number; peak: number }[];
}

export const estimateFPS = (
    build: Record<string, ComponentData | ComponentData[] | null>,
    resolution: Resolution = '1440p',
    workload: WorkloadType = 'Balanced'
): FpsEstimate | null => {
    const cpu = build["CPU"] as ComponentData | null;
    const gpu = build["GPU"] as ComponentData | null;

    if (!cpu || !gpu) return null;

    const cpuTier = getTier(cpu);
    const gpuTier = getTier(gpu);

    // 1. Base GPU Performance
    let baseFps = 60;
    switch (gpuTier) {
        case 4: // Enthusiast (e.g., RTX 4090)
            baseFps = resolution === '1080p' ? 240 : resolution === '1440p' ? 170 : 100;
            break;
        case 3: // High (e.g., RTX 4070)
            baseFps = resolution === '1080p' ? 160 : resolution === '1440p' ? 110 : 60;
            break;
        case 2: // Mid (e.g., RTX 4060)
            baseFps = resolution === '1080p' ? 110 : resolution === '1440p' ? 70 : 40;
            break;
        case 1: // Entry (e.g., RX 6400)
            baseFps = resolution === '1080p' ? 60 : resolution === '1440p' ? 40 : 25;
            break;
    }

    // Apply workload multipliers
    if (workload === 'AAA') baseFps *= 0.7;
    if (workload === 'Esports') baseFps *= 1.5;

    // 2. CPU Bottleneck Penalty
    const delta = cpuTier - gpuTier;
    let penaltyPercent = 0;

    if (delta === -1) {
        penaltyPercent = resolution === '1080p' ? 0.10 : resolution === '1440p' ? 0.05 : 0;
    } else if (delta === -2) {
        penaltyPercent = resolution === '1080p' ? 0.20 : resolution === '1440p' ? 0.12 : 0.05;
    } else if (delta <= -3) {
        penaltyPercent = resolution === '1080p' ? 0.35 : resolution === '1440p' ? 0.20 : 0.10;
    }

    const averageFps = Math.max(Math.round(baseFps * (1 - penaltyPercent)), 10);

    // 3. Generate Chart Data based on "Resolution" steps matching mockup
    const chartData = [];
    
    // Dynamic Resolution Steps based on selected target
    // Dynamic Resolution Steps based on vertical height (standard for 1080p, 1440p, 2160p)
    let peakRes = 1080;
    if (resolution === '4K') peakRes = 2160; // 4K vertical height
    else if (resolution === '1440p') peakRes = 1440;
    else peakRes = 1080;

    // Use standard vertical resolutions for cleaner steps
    const resolutionSteps = [];
    if (peakRes === 2160) {
        resolutionSteps.push("720", "1080", "1440", "1800", "2160");
    } else if (peakRes === 1440) {
        resolutionSteps.push("480", "720", "900", "1080", "1440");
    } else {
        resolutionSteps.push("360", "480", "720", "900", "1080");
    }

    // We want the curve to go upwards as "Resolution" (x-axis) increases in the mockup. 
    // This is purely visual to match the reference image.
    let currentAvg = Math.max(averageFps * 0.3, 10); // Start low for the curve
    let currentLows = Math.max(currentAvg * 0.7, 5); // Lows are beneath average

    for (let i = 0; i < resolutionSteps.length; i++) {
        // Curve goes up, ending near the averageFps at the right side
        const progress = (i + 1) / resolutionSteps.length;

        let pointAvg = currentAvg + (averageFps - currentAvg) * progress;
        // Add some random noise
        pointAvg += averageFps * (Math.random() * 0.1 - 0.05);
        
        let pointLows = pointAvg * (0.7 + Math.random() * 0.1); // ~70-80% of average
        let pointPeak = pointAvg * (1.2 + Math.random() * 0.1); // ~120-130% of average

        chartData.push({
            resolution: resolutionSteps[i],
            average: Math.round(pointAvg),
            lows: Math.round(pointLows),
            peak: Math.round(pointPeak)
        });

        currentAvg = pointAvg;
        currentLows = pointLows;
    }

    // Ensure the last point is closest to the actual estimated average
    const lowsFps = Math.round(averageFps * 0.75);
    const peakFps = Math.round(averageFps * 1.25);

    chartData[chartData.length - 1].average = averageFps;
    chartData[chartData.length - 1].lows = lowsFps;
    chartData[chartData.length - 1].peak = peakFps;

    return { averageFps, lowsFps, peakFps, chartData };
};
