"use client";

import React from "react";
import { ComponentData } from "@/lib/types";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

function extractDimension(val: any): number | null {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const match = val.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
    }
    return null;
}

function getActualDimension(part: ComponentData | null, type: 'GPU' | 'Cooler' | 'PSU'): number {
    if (!part) return 0;
    let val = 0;
    if (type === 'GPU') {
        val = extractDimension(part.dimensions?.depth) || extractDimension(part.dimensions?.width) || extractDimension(part.specifications?.['Length']) || 0;
    } else if (type === 'Cooler') {
        val = extractDimension(part.dimensions?.height) || extractDimension(part.specifications?.['Height']) || 0;
    } else if (type === 'PSU') {
        val = extractDimension(part.dimensions?.depth) || extractDimension(part.dimensions?.width) || extractDimension(part.specifications?.['Length']) || 0;
    }
    return val;
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const caseData = build["Case"] as ComponentData | null;
    const moboData = build["Motherboard"] as ComponentData | null;
    const gpuData = build["GPU"] as ComponentData | null;
    const coolerData = build["Cooler"] as ComponentData | null;
    const psuData = build["PSU"] as ComponentData | null;

    const hasCase = !!caseData;

    // Hardcoded max dimensions as defaults or pull from case specs if available
    const maxGpuLength = extractDimension(caseData?.specifications?.["Max GPU Length"]) || 325;
    const maxCoolerHeight = extractDimension(caseData?.specifications?.["Max CPU Cooler Height"]) || 174;
    const maxPsuLength = extractDimension(caseData?.specifications?.["Max PSU Length"]) || 170;

    // Actual component dimensions
    const actualGpuLength = getActualDimension(gpuData, 'GPU');
    const actualCoolerHeight = getActualDimension(coolerData, 'Cooler');
    const actualPsuLength = getActualDimension(psuData, 'PSU');

    // Default Case Layout Base Dimensions
    const baseWidth = Math.max(400, maxGpuLength + 50); // Ensure the frame encompasses large GPUs
    const baseHeight = 450;
    const padding = 20;

    // Conversion factor from mm to SVG pixels. 
    // We maintain a 1:1 ratio for simplicity, scaled later by viewBox mapping.
    const mmToPx = (mm: number) => mm;

    const svgWidth = baseWidth + padding * 2;
    const svgHeight = baseHeight + padding * 2;

    return (
        <div className="w-full h-[450px] bg-[#111] rounded-xl border border-primary/10 relative overflow-hidden group flex items-center justify-center font-sans shadow-inner">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <h3 className="text-sm font-headline font-bold text-white tracking-widest bg-black/50 px-2 py-1 rounded">2D CLEARANCE PREVIEW</h3>
                {caseData && <span className="text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded w-fit">{caseData.model}</span>}
            </div>

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="drop-shadow-2xl"
            >
                {/* Defs for gradients */}
                <defs>
                    <linearGradient id="moboGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gpuGradMax" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="gpuGradActual" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="psuGradMax" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="psuGradActual" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                    </linearGradient>
                </defs>

                {/* Case Outline Basic Case Interior Frame */}
                <rect x={padding} y={padding} width={baseWidth} height={baseHeight} rx={8} fill="#18181b" stroke="#3f3f46" strokeWidth={3} />

                {/* Vertical Cable Management Slots / Rubber Grommets */}
                {[0, 1, 2].map((i) => (
                    <rect key={`slot-${i}`} x={padding + baseWidth - 70} y={padding + 80 + i * 90} width={25} height={60} rx={6} fill="#0d0d0d" stroke="#27272a" />
                ))}

                {/* ATX Motherboard Zone (Blue) */}
                <g transform={`translate(${padding + 30}, ${padding + 50})`}>
                    <rect width={244} height={305} rx={6} fill="url(#moboGrad)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" />
                    <text x={20} y={280} fill="#60a5fa" fontSize="24" fontWeight="bold" opacity={0.5}>ATX</text>

                    {/* CPU Cooler Zone (Green) relative to Mobo socket area */}
                    <g transform={`translate(40, 40)`}>
                        <rect width={130} height={mmToPx(maxCoolerHeight)} rx={4} fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" />

                        {/* Actual Cooler */}
                        {actualCoolerHeight > 0 && (
                            <rect width={130} height={mmToPx(actualCoolerHeight)} rx={4} fill="#10b981" fillOpacity={0.3} stroke="#34d399" strokeWidth={2} />
                        )}

                        <text x={65} y={45} fill="#a7f3d0" fontSize="22" fontWeight="bold" textAnchor="middle">
                            {actualCoolerHeight > 0 ? `${actualCoolerHeight}mm` : `${maxCoolerHeight}mm`}
                        </text>
                        {actualCoolerHeight > 0 && (
                            <text x={65} y={65} fill="#6ee7b7" fontSize="13" fontWeight="500" textAnchor="middle">
                                (MAX {maxCoolerHeight}mm)
                            </text>
                        )}
                    </g>
                </g>

                {/* GPU Clearance Zone (Green Horizontal Box) */}
                {/* Positioned approximately at PCIe slots x16 location */}
                <g transform={`translate(${padding + 10}, ${padding + 220})`}>
                    {/* Max GPU Area */}
                    <rect width={mmToPx(maxGpuLength)} height={65} rx={8} fill="url(#gpuGradMax)" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" />

                    {/* Actual GPU Area */}
                    {actualGpuLength > 0 && (
                        <rect width={mmToPx(actualGpuLength)} height={65} rx={8} fill="url(#gpuGradActual)" stroke="#34d399" strokeWidth={2} />
                    )}

                    <text x={actualGpuLength > 0 ? Math.min(mmToPx(actualGpuLength) / 2, mmToPx(maxGpuLength) / 2) : mmToPx(maxGpuLength) / 2} y={40} fill="#a7f3d0" fontSize="24" fontWeight="bold" textAnchor="middle" className="drop-shadow-md">
                        {actualGpuLength > 0 ? `${actualGpuLength}mm` : `MAX: ${maxGpuLength}mm`}
                    </text>
                    {actualGpuLength > 0 && (
                        <text x={mmToPx(maxGpuLength) - 10} y={40} fill="#6ee7b7" fontSize="14" fontWeight="bold" textAnchor="end" opacity={0.8}>
                            MAX: {maxGpuLength}mm
                        </text>
                    )}
                </g>

                {/* Rear PCIe Slot Covers */}
                <g transform={`translate(${padding + 5}, ${padding + 180})`}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <g key={`pcie-${i}`} transform={`translate(0, ${i * 18})`}>
                            <rect width={10} height={15} rx={2} fill="#27272a" />
                            <text x={-20} y={12} fill="#eab308" fontSize="10">{i + 1}</text>
                        </g>
                    ))}
                </g>

                {/* PSU Clearance Zone (Yellow Bottom Box) */}
                <g transform={`translate(${padding + 10}, ${padding + baseHeight - 110})`}>
                    {/* PSU Shroud boundary */}
                    <rect width={baseWidth - 20} height={100} rx={6} fill="#0d0d0d" stroke="#27272a" strokeWidth={2} />

                    {/* Max PSU Area Box */}
                    <rect x={10} y={10} width={mmToPx(maxPsuLength)} height={80} rx={4} fill="url(#psuGradMax)" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 4" />

                    {/* Actual PSU Fill */}
                    {actualPsuLength > 0 && (
                        <rect x={10} y={10} width={mmToPx(actualPsuLength)} height={80} rx={4} fill="url(#psuGradActual)" stroke="#fcd34d" strokeWidth={2.5} />
                    )}

                    {/* PSU Texts */}
                    <text x={25} y={42} fill="#fef3c7" fontSize="16" fontWeight="bold" className="drop-shadow-sm">
                        {actualPsuLength > 0 ? `PSU Length: ${actualPsuLength}mm` : "ATX power supply"}
                    </text>
                    <text x={25} y={65} fill="#fde68a" fontSize="14" opacity={0.9}>
                        (Max: {maxPsuLength}mm)
                    </text>
                </g>

            </svg>

            {/* Empty State Overlay */}
            {!hasCase && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <p className="text-sm font-medium text-white bg-black/80 px-4 py-2 rounded-xl border border-[#333] shadow-lg backdrop-blur-md">
                        Please select a PC Case to view spatial clearances
                    </p>
                </div>
            )}
        </div>
    );
}

