"use client";

import React from "react";
import { ComponentData } from "@/lib/types";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

function extractDimension(val: any, index: number = 0): number | null {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        // Handle "2.5 slots" or "3-slot"
        if (lowerVal.includes('slot')) {
            const num = parseFloat(lowerVal.match(/(\d+(\.\d+)?)/)?.[0] || "");
            if (!isNaN(num)) return num;
        }
        const matches = val.match(/(\d+(\.\d+)?)/g);
        if (matches && matches[index]) return parseFloat(matches[index]);
    }
    return null;
}

function getActualDimension(part: ComponentData | null, type: 'GPU' | 'Cooler' | 'PSU', aspect: 'primary' | 'secondary' = 'primary'): number {
    if (!part) return 0;

    // Check direct dimensions first
    if (part.dimensions) {
        if (type === 'Cooler') return part.dimensions.height;
        if (aspect === 'primary') {
            return Math.max(part.dimensions.depth || 0, part.dimensions.width || 0);
        } else {
            // Secondary for GPU is height/thickness
            return part.dimensions.height || 0;
        }
    }

    const specs = part.specifications || {};
    const keys = Object.keys(specs);

    // Find value by checking synonyms (case-insensitive)
    const findValue = (synonyms: string[], targetIndex: number = 0) => {
        const foundKey = keys.find(k => synonyms.some(s => k.toLowerCase() === s.toLowerCase()));
        return foundKey ? extractDimension(specs[foundKey], targetIndex) : null;
    };

    if (type === 'GPU') {
        if (aspect === 'primary') {
            return findValue(['Length', 'Card Length', 'Max Length', 'GPU Length', 'Depth', 'GPU Depth', 'Length (mm)', 'Dimensions'], 0) || 0;
        } else {
            // Check for explicit thickness/slot first
            let slotCount = findValue(['Slot', 'Slot Size', 'Expansion Slots'], 0);
            if (slotCount !== null && slotCount < 6) return slotCount * 22; // ~22mm per slot

            let thickness = findValue(['Thickness', 'Width', 'Card Width', 'Height'], 0);
            // If the value is suspicious (like > 100mm), it might be the PCB height, not thickness.
            if (thickness !== null) {
                if (thickness > 100) return 66; // Fallback to chunky 3-slot look (approx 66mm)
                return thickness;
            }

            // Otherwise check 3rd number in Dimensions string (L x H x W)
            let dim3 = findValue(['Dimensions'], 2);
            if (dim3) return dim3;

            return 50; // Default chunky look
        }
    } else if (type === 'Cooler') {
        return findValue(['Height', 'Cooler Height', 'Max Height', 'CPU Cooler Height', 'Height (mm)'], 0) || 0;
    } else if (type === 'PSU') {
        return findValue(['Length', 'PSU Length', 'Max Length', 'Max PSU Length', 'Depth', 'PSU Depth', 'PSU Dimensions'], 0) || 0;
    }

    return 0;
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const caseData = build["Case"] as ComponentData | null;
    const moboData = build["Motherboard"] as ComponentData | null;
    const gpuData = build["GPU"] as ComponentData | null;
    const coolerData = build["Cooler"] as ComponentData | null;
    const psuData = build["PSU"] as ComponentData | null;

    const hasCase = !!caseData;

    // Actual component dimensions (in mm) or defaults
    const actualGpuLength = getActualDimension(gpuData, 'GPU', 'primary') || 0;
    const actualGpuThickness = getActualDimension(gpuData, 'GPU', 'secondary') || 60;
    const actualCoolerHeight = getActualDimension(coolerData, 'Cooler') || 0;
    const actualPsuLength = getActualDimension(psuData, 'PSU') || 0;

    // Motherboard dimensions based on Form Factor
    const moboFF = (moboData?.specifications?.["Form Factor"] as string)?.toUpperCase() || "";
    let moboWidth = 244;  // default ATX
    let moboHeight = 305;
    let moboLabel = "ATX BOARD";

    if (moboFF.includes("ITX")) {
        moboWidth = 170;
        moboHeight = 170;
        moboLabel = "ITX BOARD";
    } else if (moboFF.includes("MATX") || moboFF.includes("MICRO ATX")) {
        moboWidth = 244;
        moboHeight = 244;
        moboLabel = "mATX BOARD";
    } else if (moboFF.includes("EATX") || moboFF.includes("E-ATX")) {
        moboWidth = 330;
        moboHeight = 305;
        moboLabel = "E-ATX BOARD";
    }

    // Default Case Layout Base Dimensions (use dimensions if available)
    let baseWidth = 450;
    let baseHeight = 500;

    if (caseData && caseData.dimensions) {
        // Cases are deep, tall, wide. Usually depth is the visual width in this 2D side-profile map
        baseWidth = caseData.dimensions.depth || 450;
        baseHeight = caseData.dimensions.height || 500;
    }

    const padding = 40; // Increased padding to prevent edge clipping of overhanging parts

    // Calculate the absolute bounds based on part positioning (relative to case top-left)
    const moboX = padding + 30; // 30mm from the rear (left side in this view)
    const moboY = padding + 40; // 40mm from the top exhaust

    // GPU sits relative to the case rear (PCIe slot)
    const gpuX = padding + 10;
    // GPU typically starts around 100-140mm down from the top of an ATX board
    const gpuY = moboY + 140;

    // Check if the GPU length exceeds the case width
    const gpuOuterX = gpuX + (actualGpuLength || 320);

    // PSU sits at the bottom rear
    const psuX = padding + 20;
    // Assume a 120mm tall bottom shroud, PSU sits inside it
    const psuY = padding + baseHeight - 100;
    const psuOuterX = psuX + (actualPsuLength || 160);

    // The maximum visual span required
    const maxRequiredWidth = Math.max(
        baseWidth + (padding * 2), // The case width + padding
        gpuOuterX + padding,       // The furthest GPU edge + padding
        psuOuterX + padding,       // The furthest PSU edge + padding
        moboX + moboWidth + padding // The furthest mobo edge + padding
    );

    const maxRequiredHeight = baseHeight + (padding * 2);

    return (
        <div className="w-full h-[450px] bg-[#111] rounded-xl border border-primary/10 relative overflow-hidden group flex items-center justify-center font-sans shadow-inner">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <h3 className="text-[10px] font-headline font-bold text-white/40 tracking-[0.2em] bg-white/5 px-2 py-1 rounded">2D CLEARANCE PREVIEW</h3>
                {caseData && <span className="text-[10px] text-primary/60 bg-primary/5 px-2 py-1 rounded w-fit border border-primary/10 uppercase tracking-wider">{caseData.model}</span>}
            </div>

            <svg
                width="100%"
                height="100%"
                // The viewBox dynamically adjusts its scale ratio to fit standard cases and over-extended GPUs
                viewBox={`0 0 ${maxRequiredWidth} ${maxRequiredHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="drop-shadow-2xl"
            >
                <defs>
                    <linearGradient id="moboGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.05} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="gpuGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="psuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                    </linearGradient>

                    {/* Pattern for clipping area outside the case to show interference */}
                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                    </pattern>
                </defs>

                {/* Case Outline Interior Frame */}
                {hasCase && (
                    <rect x={padding} y={padding} width={baseWidth} height={baseHeight} rx={12} fill="#141417" stroke="#333" strokeWidth={2} />
                )}

                {/* Internal components only visible if case is selected and part exists */}
                {hasCase && (
                    <>
                        {/* Motherboard Zone */}
                        {moboData && (
                            <g transform={`translate(${moboX}, ${moboY})`}>
                                <rect
                                    width={moboWidth}
                                    height={moboHeight}
                                    rx={4}
                                    fill="url(#moboGrad)"
                                    stroke={moboWidth + 30 > baseWidth || moboHeight + 40 > baseHeight ? "#ef4444" : "#3b82f6"}
                                    strokeWidth={moboWidth + 30 > baseWidth || moboHeight + 40 > baseHeight ? 2.5 : 1.5}
                                    strokeDasharray="4 4"
                                    className="transition-all duration-500"
                                />

                                <text
                                    x={moboWidth / 2}
                                    y={moboHeight - 15}
                                    fill={moboWidth + 30 > baseWidth ? "#ef4444" : "#3b82f6"}
                                    fontSize="12"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    opacity={0.4}
                                    className="uppercase tracking-widest"
                                >
                                    {moboLabel} {moboWidth + 30 > baseWidth ? " (TOO WIDE)" : ""}
                                </text>

                                {/* CPU Socket Area (visual center for cooler) */}
                                <rect x={moboWidth / 2 - 25} y={40} width={50} height={50} rx={4} fill="#222" stroke="#444" strokeWidth={1} />

                                {/* Cooler Box (centered on socket) */}
                                {coolerData && (
                                    <g transform={`translate(${moboWidth / 2 - 60}, 15)`}>
                                        <rect
                                            width={120}
                                            height={actualCoolerHeight > 0 ? actualCoolerHeight : 100}
                                            rx={4}
                                            fill="#10b981"
                                            fillOpacity={0.15}
                                            stroke="#10b981"
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            className="transition-all duration-500"
                                        />
                                        <text x={60} y={35} fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle" opacity={0.5}>COOLER</text>
                                    </g>
                                )}
                            </g>
                        )}

                        {/* GPU Box */}
                        {gpuData && (
                            <g transform={`translate(${gpuX}, ${gpuY})`}>
                                <rect
                                    width={actualGpuLength > 0 ? actualGpuLength : 320}
                                    height={Math.max(20, Math.min(actualGpuThickness, 120))}
                                    rx={8}
                                    fill={gpuOuterX > baseWidth + padding ? "url(#diagonalHatch)" : "url(#gpuGrad)"}
                                    stroke={gpuOuterX > baseWidth + padding ? "#ef4444" : "#10b981"}
                                    strokeWidth={gpuOuterX > baseWidth + padding ? 2.5 : 1.5}
                                    strokeDasharray="4 4"
                                    className="transition-all duration-500"
                                />
                                <text
                                    x={15}
                                    y={Math.min(actualGpuThickness, 120) / 2 + 5}
                                    fill={gpuOuterX > baseWidth + padding ? "#ef4444" : "#10b981"}
                                    fontSize="12"
                                    fontWeight="bold"
                                    className="uppercase tracking-widest font-mono"
                                >
                                    {actualGpuLength > 0 ? `${actualGpuLength}MM` : "GPU"}
                                    {actualGpuThickness > 0 && actualGpuThickness < 120 ? ` × ${Math.round(actualGpuThickness)}MM` : ""}
                                    {gpuOuterX > baseWidth + padding ? " (BLOCKED)" : ""}
                                </text>
                            </g>
                        )}

                        {/* PSU Shroud and Unit */}
                        <g transform={`translate(${padding}, ${padding + baseHeight - 120})`}>
                            {/* Shroud */}
                            <rect width={baseWidth} height={120} rx={12} fill="#0d0d0d" stroke="#222" strokeWidth={2} />

                            {/* PSU Box */}
                            {psuData && (
                                <g transform={`translate(20, 20)`}>
                                    <rect
                                        width={actualPsuLength > 0 ? actualPsuLength : 160}
                                        height={80}
                                        rx={4}
                                        fill={psuOuterX > baseWidth + padding ? "url(#diagonalHatch)" : "url(#psuGrad)"}
                                        stroke={psuOuterX > baseWidth + padding ? "#ef4444" : "#f59e0b"}
                                        strokeWidth={psuOuterX > baseWidth + padding ? 2.5 : 1.5}
                                        strokeDasharray="4 4"
                                        className="transition-all duration-500"
                                    />
                                    <text
                                        x={15}
                                        y={45}
                                        fill={psuOuterX > baseWidth + padding ? "#ef4444" : "#f59e0b"}
                                        fontSize="12"
                                        fontWeight="bold"
                                        className="uppercase tracking-widest"
                                        opacity={0.6}
                                    >
                                        PSU {actualPsuLength > 0 ? `(${actualPsuLength}mm)` : "ATX"}
                                        {psuOuterX > baseWidth + padding ? " (TOO LONG)" : ""}
                                    </text>
                                </g>
                            )}
                        </g>

                        {/* Rear PCIe Slot Covers */}
                        <g transform={`translate(${padding + 5}, ${padding + 160})`}>
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <rect key={`pcie-${i}`} y={i * 20} width={8} height={16} rx={2} fill="#222" />
                            ))}
                        </g>
                    </>
                )}
            </svg>

            {/* Empty State Overlay */}
            {!hasCase && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 backdrop-blur-[2px]">
                    <p className="text-[11px] font-bold text-white tracking-[0.2em] uppercase bg-black/80 px-6 py-3 rounded-full border border-white/5 shadow-2xl">
                        Select a PC Case to begin clearance preview
                    </p>
                </div>
            )}
        </div>
    );
}



