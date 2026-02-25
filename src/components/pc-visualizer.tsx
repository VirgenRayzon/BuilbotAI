"use client";

import React from "react";
import { ComponentData } from "@/lib/types";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const hasCPU = !!build["CPU"];
    const hasGPU = !!build["GPU"];
    const hasMobo = !!build["Motherboard"];
    const hasRAM = !!build["RAM"];
    const hasPSU = !!build["PSU"];
    const hasCooler = !!build["Cooler"];
    const hasStorage = Array.isArray(build["Storage"]) ? build["Storage"].length > 0 : !!build["Storage"];
    const hasCase = !!build["Case"];

    const caseData = build["Case"] as ComponentData | null;
    const moboData = build["Motherboard"] as ComponentData | null;
    const gpuData = build["GPU"] as ComponentData | null;

    // Default dimensions if not specified (in pixels/arbitrary units for SVG)
    const caseWidth = caseData?.dimensions?.width || 210;
    const caseHeight = caseData?.dimensions?.height || 450;

    // Scale factor to fit 400px height relative to case height
    const scale = 350 / caseHeight;
    const padding = 20;

    const svgWidth = (caseWidth * scale) + (padding * 2);
    const svgHeight = (caseHeight * scale) + (padding * 2);

    return (
        <div className="w-full h-[400px] bg-black/5 rounded-xl border border-primary/10 relative overflow-hidden group flex items-center justify-center">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-headline font-bold text-muted-foreground uppercase tracking-widest">2D Build Preview</h3>
            </div>

            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="drop-shadow-2xl"
            >
                {/* Case Outline */}
                <rect
                    x={padding}
                    y={padding}
                    width={caseWidth * scale}
                    height={caseHeight * scale}
                    rx={8}
                    fill="#1a1a1a"
                    stroke="#333"
                    strokeWidth={2}
                />

                {/* Motherboard */}
                {hasMobo && (
                    <rect
                        x={padding + 5}
                        y={padding + 50}
                        width={(moboData?.dimensions?.width || 244) * scale}
                        height={(moboData?.dimensions?.height || 305) * scale}
                        fill="#1b4332"
                        stroke="#2d6a4f"
                        strokeWidth={1}
                        rx={4}
                    />
                )}

                {/* CPU */}
                {hasCPU && (
                    <rect
                        x={padding + 40}
                        y={padding + 100}
                        width={40 * scale}
                        height={40 * scale}
                        fill="#555"
                        rx={2}
                    />
                )}

                {/* RAM */}
                {hasRAM && (
                    <rect
                        x={padding + 90}
                        y={padding + 80}
                        width={10 * scale}
                        height={100 * scale}
                        fill="#333"
                        rx={1}
                    />
                )}

                {/* GPU */}
                {hasGPU && (
                    <rect
                        x={padding + 20}
                        y={padding + 200}
                        width={(gpuData?.dimensions?.width || 280) * scale}
                        height={(gpuData?.dimensions?.height || 120) * scale}
                        fill="#b91c1c"
                        stroke="#991b1b"
                        strokeWidth={1}
                        rx={4}
                    />
                )}

                {/* PSU */}
                {hasPSU && (
                    <rect
                        x={padding + 5}
                        y={padding + (caseHeight * scale) - (86 * scale) - 5}
                        width={150 * scale}
                        height={86 * scale}
                        fill="#111"
                        rx={4}
                    />
                )}

                {/* Storage */}
                {hasStorage && (
                    <rect
                        x={padding + (caseWidth * scale) - (100 * scale) - 10}
                        y={padding + 100}
                        width={100 * scale}
                        height={20 * scale}
                        fill="#222"
                        rx={2}
                    />
                )}

                {/* Cooler */}
                {hasCooler && (
                    <circle
                        cx={padding + 60}
                        cy={padding + 120}
                        r={30 * scale}
                        fill="#3b82f6"
                        fillOpacity={0.6}
                    />
                )}
            </svg>

            {!hasMobo && !hasGPU && !hasCPU && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full border border-border shadow-sm">
                        Add parts to see your build in 2D
                    </p>
                </div>
            )}
        </div>
    );
}
