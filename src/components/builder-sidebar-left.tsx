/**
 * BuilderSidebarLeft — Left-side analytics panel for the Builder page.
 * Displays FPS estimation charts (via Recharts) and bottleneck analysis
 * based on the user's current hardware build, resolution, and workload preset.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Gauge } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { calculateBottleneck } from "@/lib/bottleneck";
import { estimateFPS } from "@/lib/fps-estimator";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface BuilderSidebarLeftProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (workload: WorkloadType) => void;
    className?: string;
}

function FpsMeter({ build, resolution, workload }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution, workload: WorkloadType }) {
    const fpsData = estimateFPS(build, resolution);

    if (!fpsData) return null;

    // Adjust FPS based on workload visual only for now (purely cosmetic logic to give meaning to the preset)
    let displayFps = fpsData.averageFps;
    if (workload === 'AAA') displayFps = Math.round(displayFps * 0.7);
    if (workload === 'Esports') displayFps = Math.round(displayFps * 1.5);

    return (
        <div className="space-y-1 mb-6 bg-[#1a1c23] p-4 rounded-xl border border-white/5 relative shadow-inner">
            {/* Header matches mockup: "Estimated FPS Performance" and right cyan pill + ellipsis */}
            <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide">
                    Estimated FPS Performance
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-muted-foreground/50 tracking-[2px] leading-none mb-2">...</span>
                </div>
            </div>

            {/* Giant Number matches mockup: "144+ FPS average" */}
            <div className="mb-4">
                <span className="text-3xl font-bold font-sans text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] tracking-tight">
                    {displayFps}+ FPS <span className="text-sm font-normal text-zinc-400 drop-shadow-none tracking-normal">average</span>
                </span>
            </div>

            {/* Chart Area */}
            <div className="h-[140px] w-full -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fpsData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            {/* Neon Glow Filters */}
                            <filter id="neonGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <filter id="neonGlowMagenta" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>

                            {/* Area Fill Gradient for Cyan */}
                            <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorLows" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.10} />
                                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        {/* Faint Horizontal Grid Lines */}
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.05)" />

                        {/* Axes matching mockup styled faint */}
                        <XAxis
                            dataKey="resolution"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 10 }}
                            domain={[0, 200]}
                            ticks={[0, 40, 80, 120, 160, 200]}
                        />

                        {/* Lows Line (Magenta) - Drawn first so Average is on top */}
                        <Area
                            type="monotone"
                            dataKey="lows"
                            stroke="#e879f9"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorLows)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            style={{ filter: "url(#neonGlowMagenta)" }}
                        />

                        {/* Average Line (Cyan) */}
                        <Area
                            type="monotone"
                            dataKey="average"
                            stroke="#22d3ee"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAverage)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            style={{ filter: "url(#neonGlowCyan)" }}
                        />

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Axes Labels */}
            <div className="absolute -left-1 bottom-1/2 -rotate-90 origin-center text-[9px] font-semibold text-zinc-500 tracking-widest">
                FPS
            </div>
            <div className="text-center text-[9px] font-semibold text-zinc-500 tracking-widest mt-2">
                RESOLUTION
            </div>
        </div>
    );
}

function BottleneckMeter({ build, resolution }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution }) {
    const result = calculateBottleneck(build, resolution);

    if (result.status === 'Incomplete') {
        return (
            <div className="p-4 border rounded-md bg-secondary/10 border-border/50 text-center mt-2">
                <p className="text-xs text-muted-foreground">Add CPU and GPU to analyze bottleneck and estimate FPS.</p>
            </div>
        );
    }

    // Adapt color for neon aesthetic
    let glowColor = "rgba(6, 182, 212, 0.5)"; // cyan
    let textColor = "text-cyan-400";
    if (result.status.includes('High')) {
        glowColor = "rgba(239, 68, 68, 0.5)"; // red
        textColor = "text-red-400";
    } else if (result.status.includes('Moderate')) {
        glowColor = "rgba(217, 70, 239, 0.5)"; // fuchsia
        textColor = "text-fuchsia-400";
    }

    return (
        <div
            className="p-3 border rounded-md bg-background/50 transition-colors duration-300 relative overflow-hidden group"
            style={{ borderColor: result.color, boxShadow: `0 0 15px ${glowColor} inset` }}
        >
            <div className="relative z-10">
                <h4 className={`font-headline font-bold text-sm mb-1 flex items-center gap-1 ${textColor}`}>
                    <Gauge className="w-4 h-4" /> {result.status}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {result.message}
                </p>
            </div>
        </div>
    );
}

export function BuilderSidebarLeft({ build, resolution, onResolutionChange, workload, onWorkloadChange, className }: BuilderSidebarLeftProps) {
    return (
        <div className={`flex flex-col gap-4 ${className || ""}`}>
            {/* Analytics Dashboard */}
            <Card className="flex-none border-primary/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden bg-background/40 backdrop-blur-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse"></div>
                <CardHeader className="py-4 px-5 bg-white/5 flex flex-row items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                    <CardTitle className="font-headline text-xs font-bold flex items-center gap-2 text-primary tracking-[0.2em] shrink-0">
                        <Activity className="w-4 h-4" /> ANALYTICS
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={resolution} onValueChange={(val: any) => onResolutionChange(val)}>
                            <SelectTrigger className="h-7 text-[10px] w-[70px] bg-white/5 border-primary/20 text-slate-300 hover:border-primary/40 transition-colors">
                                <SelectValue placeholder="Res" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-primary/20">
                                <SelectItem value="1080p" className="text-[10px]">1080p</SelectItem>
                                <SelectItem value="1440p" className="text-[10px]">1440p</SelectItem>
                                <SelectItem value="4K" className="text-[10px]">4K</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={workload} onValueChange={(val: any) => onWorkloadChange(val)}>
                            <SelectTrigger className="h-7 text-[10px] w-[85px] bg-white/5 border-primary/20 text-slate-300 hover:border-primary/40 transition-colors">
                                <SelectValue placeholder="Profile" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-primary/20">
                                <SelectItem value="Balanced" className="text-[10px]">Balanced</SelectItem>
                                <SelectItem value="Esports" className="text-[10px]">Esports</SelectItem>
                                <SelectItem value="AAA" className="text-[10px]">AAA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <FpsMeter build={build} resolution={resolution} workload={workload} />
                    <BottleneckMeter build={build} resolution={resolution} />
                </CardContent>
            </Card>
        </div>
    );
}
