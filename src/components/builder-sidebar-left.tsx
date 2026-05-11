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
import { calculateBottleneck, calculateSynergyScore } from "@/lib/bottleneck";
import { estimateFPS } from "@/lib/fps-estimator";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, CheckCircle2, ArrowRight, Zap, X, Monitor } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface BuilderSidebarLeftProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (workload: WorkloadType) => void;
    analysis?: any;
    onApplySuggestion?: (category: string, partId: string) => void;
    onClose?: () => void;
    className?: string;
}

function CountUp({ value }: { value: number }) {
    const count = useMotionValue(value);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    
    React.useEffect(() => {
        const controls = animate(count, value, { 
            duration: 1, 
            ease: "easeOut"
        });
        return controls.stop;
    }, [value, count]);
    
    return <motion.span>{rounded}</motion.span>;
}

function SynergyMeter({ build, resolution }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution }) {
    const result = calculateSynergyScore(build, resolution);

    return (
        <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Synergy Rating</span>
                <Badge className={cn("text-[11px] font-bold px-2 py-0.5", result.score < 40 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary dark:text-primary")}>
                    {result.status}
                </Badge>
            </div>
            
            <div className="relative h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"
                    style={{ 
                        boxShadow: `0 0 15px ${result.color}80`,
                        backgroundColor: result.color 
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/60 tracking-widest mix-blend-difference">
                    {result.score}/100
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
                {Object.entries(result.breakdown).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-cyan-500/50" 
                                style={{ width: `${(val / (key === 'balance' ? 35 : key === 'completeness' ? 25 : 20)) * 100}%` }} 
                            />
                        </div>
                        <span className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-300 tracking-tighter">{key}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OptimizationSuggestions({ analysis, onApply }: { analysis: any, onApply?: (category: string, partId: string) => void }) {
    if (!analysis?.suggestions || analysis.suggestions.length === 0) return null;

    return (
        <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2 px-1 mb-2">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">AI Optimization Swaps</span>
            </div>
            <div className="space-y-2">
                {analysis.suggestions.map((suggestion: any, idx: number) => (
                    <div key={idx} className="group p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 transition-all">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-bold text-zinc-400 line-through truncate">{suggestion.originalComponent}</span>
                                    <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
                                    <span className="text-sm font-bold text-cyan-400 truncate">{suggestion.suggestedComponent}</span>
                                </div>
                                {suggestion.suggestedPartId && onApply && (
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 px-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-none text-[9px] font-black uppercase tracking-wider rounded-lg shrink-0"
                                        onClick={() => {
                                            // Extract category from original component name if possible, or heuristic
                                            // The AI flow should ideally provide category. For now we assume the AI 
                                            // identifies the component correctly.
                                            // We'll pass the ID and the parent will handle it.
                                            onApply("", suggestion.suggestedPartId);
                                        }}
                                    >
                                        <Zap className="w-2.5 h-2.5 mr-1" /> Swap
                                    </Button>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-300 leading-tight italic">
                                "{suggestion.reason}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FpsMeter({ build, resolution, workload }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution, workload: WorkloadType }) {
    const fpsData = estimateFPS(build, resolution);

    if (!fpsData) return null;

    // Adjust FPS based on workload visual only for now (purely cosmetic logic to give meaning to the preset)
    let displayFps = fpsData.averageFps;
    if (workload === 'AAA') displayFps = Math.round(displayFps * 0.7);
    if (workload === 'Esports') displayFps = Math.round(displayFps * 1.5);

    return (
        <div className="space-y-1 mb-6 bg-slate-50 dark:bg-[#1a1c23] p-4 rounded-xl border border-slate-200 dark:border-white/5 relative shadow-inner">
            {/* Header matches mockup: "Estimated FPS Performance" and right cyan pill + ellipsis */}
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 font-sans tracking-wide">
                    Estimated FPS Performance
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-muted-foreground/70 tracking-[2px] leading-none mb-2">...</span>
                </div>
            </div>

            {/* Primary Metrics Summary */}
            <div className="flex items-center gap-6 mb-6 px-1">
                <div className="flex flex-col">
                    <span className="text-3xl font-bold font-sans text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] tracking-tight">
                        <CountUp value={displayFps} />+ <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 drop-shadow-none tracking-normal">avg</span>
                    </span>
                </div>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-0.5">1% Lows</span>
                    <span className="text-lg font-bold font-sans text-fuchsia-600 dark:text-fuchsia-400/90 tracking-tight">
                        <CountUp value={fpsData.lowsFps} /> <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest">fps</span>
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Peak</span>
                    <span className="text-lg font-bold font-sans text-amber-600 dark:text-amber-400/90 tracking-tight">
                        <CountUp value={fpsData.peakFps} /> <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest">fps</span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[240px] w-full -ml-3">
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
                            <filter id="neonGlowGold" x="-20%" y="-20%" width="140%" height="140%">
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
                            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.10} />
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
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
                            domain={[0, 400]}
                            ticks={[0, 100, 200, 300, 400]}
                        />

                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-lg shadow-2xl">
                                            <div className="text-[10px] text-zinc-500 font-bold mb-2 tracking-widest uppercase border-b border-slate-100 dark:border-white/5 pb-1">Performance Details</div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">Peak</span>
                                                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">{payload[2].value} FPS</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">Avg</span>
                                                    <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">{payload[1].value} FPS</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">Lows</span>
                                                    <span className="text-sm font-black text-fuchsia-600 dark:text-fuchsia-400">{payload[0].value} FPS</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />

                        {/* Lows Line (Magenta) */}
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

                        {/* Peak Line (Gold) */}
                        <Area
                            type="monotone"
                            dataKey="peak"
                            stroke="#fbbf24"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPeak)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            style={{ filter: "url(#neonGlowGold)" }}
                        />

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Axes Labels */}
            <div className="absolute -left-1 bottom-1/2 -rotate-90 origin-center text-[10px] font-semibold text-zinc-400 tracking-widest">
                FPS
            </div>
            <div className="text-center text-[10px] font-semibold text-zinc-400 tracking-widest mt-2">
                RESOLUTION
            </div>

            {/* Legend Section */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-1 bg-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(232,121,249,0.8)]"></div>
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">1% Lows</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Average</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Peak FPS</span>
                </div>
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
            className="p-3 border rounded-md bg-slate-50 dark:bg-background/50 transition-colors duration-300 relative overflow-hidden group shadow-sm dark:shadow-none"
            style={{ borderColor: result.color, boxShadow: `0 0 15px ${glowColor} inset` }}
        >
            <div className="relative z-10">
                <h4 className={`font-headline font-bold text-base mb-1 flex items-center gap-1 ${textColor}`}>
                    <Gauge className="w-4 h-4" /> {result.status}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.message}
                </p>
            </div>
        </div>
    );
}

export function BuilderSidebarLeft({ build, resolution, onResolutionChange, workload, onWorkloadChange, analysis, onApplySuggestion, onClose, className }: BuilderSidebarLeftProps) {
    return (
        <div className={`flex flex-col gap-4 ${className || ""}`}>
            {/* Analytics Dashboard */}
            <Card className="flex-none border-slate-200 dark:border-primary/20 shadow-xl dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden bg-white dark:bg-[#0f1115] relative">
                <CardHeader className="py-5 px-6 bg-slate-50/80 dark:bg-white/5 flex flex-col gap-4 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse"></div>
                    
                    <div className="relative flex items-center justify-center w-full">
                        <CardTitle className="font-headline text-base font-black flex items-center gap-3 text-primary tracking-[0.3em] uppercase">
                            <Activity className="w-5 h-5" /> ANALYTICS
                        </CardTitle>
                        {onClose && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onClose} 
                                className="absolute right-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1">
                            <Select value={resolution} onValueChange={(val: any) => onResolutionChange(val)}>
                                <SelectTrigger className="h-9 text-xs font-bold w-full bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-primary/50 transition-all rounded-xl gap-3 px-4">
                                    <Monitor className="w-4 h-4 text-primary/70" />
                                    <SelectValue placeholder="Resolution" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1a1c23] border-slate-200 dark:border-white/10 shadow-2xl rounded-xl">
                                    <SelectItem value="1080p" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">1080p Full HD</SelectItem>
                                    <SelectItem value="1440p" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">1440p Quad HD</SelectItem>
                                    <SelectItem value="4K" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">4K Ultra HD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex-1">
                            <Select value={workload} onValueChange={(val: any) => onWorkloadChange(val)}>
                                <SelectTrigger className="h-9 text-xs font-bold w-full bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-primary/50 transition-all rounded-xl gap-3 px-4">
                                    <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400/70" />
                                    <SelectValue placeholder="Performance" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1a1c23] border-slate-200 dark:border-white/10 shadow-2xl rounded-xl">
                                    <SelectItem value="Balanced" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">Balanced</SelectItem>
                                    <SelectItem value="Esports" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">Esports High</SelectItem>
                                    <SelectItem value="AAA" className="text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">AAA Ultra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <SynergyMeter build={build} resolution={resolution} />
                    <FpsMeter build={build} resolution={resolution} workload={workload} />
                    <BottleneckMeter build={build} resolution={resolution} />
                    
                    {analysis && (
                        <OptimizationSuggestions analysis={analysis} onApply={onApplySuggestion} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
