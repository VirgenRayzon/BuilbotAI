/**
 * BuilderSidebarLeft — Left-side analytics panel for the Builder page.
 * Displays FPS estimation charts (via Recharts), synergy score, and bottleneck analysis
 * based on the user's current hardware build, resolution, and workload preset.
 * Built with Mantine UI primitives, high-contrast light/dark theming, and smooth animations.
 */
import React from "react";
import {
    Paper,
    Badge,
    Select,
    Text,
    Group,
    Stack,
    Box,
    ActionIcon,
    ThemeIcon,
    Button as MantineButton,
    SimpleGrid,
    Divider,
} from "@mantine/core";
import { Activity, Gauge, Monitor, Zap, X, Sparkles, ArrowRight, Info } from "lucide-react";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { calculateBottleneck, calculateSynergyScore } from "@/lib/bottleneck";
import { estimateFPS } from "@/lib/fps-estimator";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useTheme } from "@/context/theme-provider";

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

    const breakdownItems = [
        { key: 'balance', label: 'Balance', val: result.breakdown.balance, max: 35 },
        { key: 'power', label: 'Power', val: result.breakdown.power, max: 20 },
        { key: 'completeness', label: 'Complete', val: result.breakdown.completeness, max: 25 },
        { key: 'tierConsistency', label: 'Tier Match', val: result.breakdown.tierConsistency, max: 20 },
    ];

    const getStatusBadgeColor = (status: string, score: number) => {
        if (status === 'Incomplete') return 'red';
        if (score >= 80) return 'teal';
        if (score >= 65) return 'cyan';
        if (score >= 40) return 'yellow';
        return 'red';
    };

    return (
        <Paper
            radius="md"
            p="sm"
            withBorder
            className="bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-sm"
        >
            <Group justify="space-between" align="center" className="mb-2.5">
                <Text size="xs" fw={800} className="tracking-[0.18em] font-headline uppercase text-slate-800 dark:text-slate-200">
                    Synergy Rating
                </Text>
                <Badge
                    color={getStatusBadgeColor(result.status, result.score)}
                    variant={result.status === 'Incomplete' ? 'light' : 'filled'}
                    size="sm"
                    radius="md"
                    fw={700}
                    className={cn(
                        "tracking-wider text-[10px] uppercase font-bold",
                        result.status === 'Incomplete' && "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                    )}
                >
                    {result.status}
                </Badge>
            </Group>
            
            {/* Animated Progress Bar Container with High-Contrast Score */}
            <div className="relative h-6 bg-slate-200/90 dark:bg-slate-800/90 rounded-full overflow-hidden border border-slate-300 dark:border-white/10 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(result.score, 0)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full"
                    style={{ 
                        boxShadow: result.score > 0 ? `0 0 16px rgba(34,211,238,0.6)` : "none",
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-black tracking-widest font-mono text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {result.score}
                        <span className="text-[10px] font-semibold opacity-80">/100</span>
                    </span>
                </div>
            </div>

            {/* Breakdown Sub-metrics */}
            <SimpleGrid cols={4} spacing="xs" className="mt-3 pt-2 border-t border-slate-200/80 dark:border-white/5">
                {breakdownItems.map((item) => {
                    const pct = Math.min(100, Math.max(0, Math.round((item.val / item.max) * 100)));
                    return (
                        <Box key={item.key} className="flex flex-col items-center gap-1.5">
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/40 dark:border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.9, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                                />
                            </div>
                            <Text size="9px" fw={700} className="tracking-tight uppercase text-slate-700 dark:text-slate-300 text-center leading-none">
                                {item.label}
                            </Text>
                        </Box>
                    );
                })}
            </SimpleGrid>
        </Paper>
    );
}

function OptimizationSuggestions({ analysis, onApply }: { analysis: any, onApply?: (category: string, partId: string) => void }) {
    if (!analysis?.suggestions || analysis.suggestions.length === 0) return null;

    return (
        <Paper
            radius="md"
            p="sm"
            withBorder
            className="bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-500/30 shadow-sm space-y-3"
        >
            <Group gap={6} align="center">
                <ThemeIcon size="xs" variant="transparent" color="cyan">
                    <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
                </ThemeIcon>
                <Text size="xs" fw={800} className="text-cyan-700 dark:text-cyan-400 uppercase tracking-[0.18em]">
                    AI Optimization Swaps
                </Text>
            </Group>
            <div className="space-y-2">
                {analysis.suggestions.map((suggestion: any, idx: number) => (
                    <Paper
                        key={idx}
                        radius="sm"
                        p="xs"
                        withBorder
                        className="bg-white/80 dark:bg-slate-900/60 border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                    >
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 line-through truncate">
                                        {suggestion.originalComponent}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 truncate">
                                        {suggestion.suggestedComponent}
                                    </span>
                                </div>
                                {suggestion.suggestedPartId && onApply && (
                                    <MantineButton 
                                        size="xs" 
                                        variant="light" 
                                        color="cyan"
                                        radius="md"
                                        className="h-6 px-2 text-[10px] font-black uppercase tracking-wider shrink-0"
                                        leftSection={<Zap size={11} />}
                                        onClick={() => onApply("", suggestion.suggestedPartId)}
                                    >
                                        Swap
                                    </MantineButton>
                                )}
                            </div>
                            <Text size="11px" className="text-slate-700 dark:text-slate-300 italic leading-tight">
                                "{suggestion.reason}"
                            </Text>
                        </div>
                    </Paper>
                ))}
            </div>
        </Paper>
    );
}

function FpsMeter({ build, resolution, workload, isDark }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution, workload: WorkloadType, isDark: boolean }) {
    const fpsData = estimateFPS(build, resolution, workload);

    if (!fpsData) return null;

    const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const tickColor = isDark ? "#94a3b8" : "#475569";

    return (
        <Paper
            radius="md"
            p="sm"
            withBorder
            className="bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-sm relative"
        >
            {/* Header */}
            <Group justify="space-between" align="center" className="mb-2">
                <Text size="xs" fw={800} className="tracking-wide uppercase font-headline text-slate-800 dark:text-slate-200">
                    Estimated FPS Performance
                </Text>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                </div>
            </Group>

            {/* Primary Metrics Summary */}
            <Paper radius="sm" p="xs" withBorder className="bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/5 mb-3 shadow-none">
                <Group justify="space-around" align="center" gap="xs">
                    {/* Average */}
                    <Stack gap={0} align="center">
                        <Text size="9px" fw={800} className="tracking-widest uppercase text-cyan-700 dark:text-cyan-400">
                            Average
                        </Text>
                        <Text fw={900} className="text-2xl font-sans tracking-tight text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                            <CountUp value={fpsData.averageFps} />+ <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-normal">avg</span>
                        </Text>
                    </Stack>
                    
                    <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-7" />
                    
                    {/* 1% Lows */}
                    <Stack gap={0} align="center">
                        <Text size="9px" fw={800} className="tracking-widest uppercase text-fuchsia-700 dark:text-fuchsia-400">
                            1% Lows
                        </Text>
                        <Text fw={900} className="text-lg font-sans tracking-tight text-fuchsia-600 dark:text-fuchsia-400">
                            <CountUp value={fpsData.lowsFps} /> <span className="text-[10px] font-semibold text-slate-500 uppercase">fps</span>
                        </Text>
                    </Stack>
                    
                    <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-7" />
                    
                    {/* Peak */}
                    <Stack gap={0} align="center">
                        <Text size="9px" fw={800} className="tracking-widest uppercase text-amber-700 dark:text-amber-400">
                            Peak
                        </Text>
                        <Text fw={900} className="text-lg font-sans tracking-tight text-amber-600 dark:text-amber-400">
                            <CountUp value={fpsData.peakFps} /> <span className="text-[10px] font-semibold text-slate-500 uppercase">fps</span>
                        </Text>
                    </Stack>
                </Group>
            </Paper>

            {/* Chart Area */}
            <div className="h-[210px] w-full -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fpsData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
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

                            <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.22} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorLows" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />

                        <XAxis
                            dataKey="resolution"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                            domain={[0, 400]}
                            ticks={[0, 100, 200, 300, 400]}
                        />

                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/95 dark:bg-[#151922]/95 backdrop-blur-md border border-slate-300 dark:border-white/15 p-3 rounded-xl shadow-2xl">
                                            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-2 tracking-widest uppercase border-b border-slate-200 dark:border-white/10 pb-1">
                                                Performance Details
                                            </div>
                                            <div className="space-y-1.5 min-w-[130px]">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Peak</span>
                                                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">{payload[2]?.value} FPS</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Avg</span>
                                                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{payload[1]?.value} FPS</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Lows</span>
                                                    <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400">{payload[0]?.value} FPS</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', strokeWidth: 1 }}
                        />

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

            {/* Legend Section */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-1.5 bg-fuchsia-500 rounded-full shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">1% Lows</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Average</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Peak FPS</span>
                </div>
            </div>
        </Paper>
    );
}

function BottleneckMeter({ build, resolution }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution }) {
    const result = calculateBottleneck(build, resolution);

    if (result.status === 'Incomplete') {
        return (
            <Paper
                radius="md"
                p="sm"
                withBorder
                className="bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-center shadow-sm"
            >
                <Group justify="center" gap="xs">
                    <ThemeIcon size="xs" variant="transparent" color="gray">
                        <Info size={14} className="text-slate-500 dark:text-slate-400" />
                    </ThemeIcon>
                    <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300">
                        Add CPU and GPU to analyze bottleneck and estimate FPS.
                    </Text>
                </Group>
            </Paper>
        );
    }

    const isBalanced = result.status === 'Balanced';
    const isSevere = result.status.includes('Severe');
    const statusColor = isSevere ? 'red' : isBalanced ? 'teal' : 'yellow';

    return (
        <Paper
            radius="md"
            p="sm"
            withBorder
            className={cn(
                "transition-all relative overflow-hidden group shadow-sm",
                isBalanced && "bg-teal-500/5 border-teal-500/30 dark:bg-teal-950/20 dark:border-teal-500/30",
                !isBalanced && !isSevere && "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-500/30",
                isSevere && "bg-red-500/5 border-red-500/30 dark:bg-red-950/20 dark:border-red-500/30",
            )}
        >
            <div className="relative z-10 space-y-1">
                <Group justify="space-between" align="center">
                    <Group gap={6} align="center">
                        <ThemeIcon size="sm" radius="md" variant="light" color={statusColor}>
                            <Gauge size={14} />
                        </ThemeIcon>
                        <Text size="xs" fw={800} className={cn(
                            "tracking-wider uppercase",
                            isSevere && "text-red-700 dark:text-red-400",
                            isBalanced && "text-teal-700 dark:text-teal-300",
                            !isBalanced && !isSevere && "text-amber-700 dark:text-amber-300"
                        )}>
                            {result.status}
                        </Text>
                    </Group>
                    <Badge size="xs" radius="sm" color={statusColor} variant="light" fw={700}>
                        {isBalanced ? "Optimal Match" : "Mismatch Alert"}
                    </Badge>
                </Group>
                <Text size="xs" fw={500} className="text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
                    {result.message}
                </Text>
            </div>
        </Paper>
    );
}

export function BuilderSidebarLeft({ build, resolution, onResolutionChange, workload, onWorkloadChange, analysis, onApplySuggestion, onClose, className }: BuilderSidebarLeftProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <Paper
                radius="lg"
                withBorder
                shadow="xl"
                className="overflow-hidden bg-white/95 dark:bg-[#0d1117]/95 border-slate-200 dark:border-cyan-500/20 backdrop-blur-xl relative shadow-xl dark:shadow-[0_0_35px_rgba(0,0,0,0.6)]"
            >
                {/* Header Container */}
                <Box className="p-4 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 relative">
                    {/* Title + Close */}
                    <Group justify="space-between" align="center" className="mb-3.5">
                        <Group gap="xs" align="center">
                            <ThemeIcon size={28} radius="md" variant="light" color="cyan" className="shadow-sm">
                                <Gauge size={16} className="text-cyan-500 dark:text-cyan-400" />
                            </ThemeIcon>
                            <Text fw={900} size="sm" className="font-headline tracking-[0.18em] uppercase text-cyan-700 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                Bottleneck Analyzer
                            </Text>
                        </Group>
                        
                        {onClose && (
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                radius="md"
                                onClick={onClose}
                                aria-label="Close bottleneck analyzer"
                                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <X size={18} />
                            </ActionIcon>
                        )}
                    </Group>

                    {/* Resolution and Workload Selects */}
                    <Group grow gap="xs">
                        <Select
                            value={resolution}
                            onChange={(val) => val && onResolutionChange(val as Resolution)}
                            data={[
                                { value: "1080p", label: "1080p Full HD" },
                                { value: "1440p", label: "1440p Quad HD" },
                                { value: "4K", label: "4K Ultra HD" },
                            ]}
                            leftSection={<Monitor size={15} className="text-cyan-600 dark:text-cyan-400" />}
                            allowDeselect={false}
                            size="xs"
                            radius="md"
                            comboboxProps={{ shadow: "md", transitionProps: { transition: "pop", duration: 150 } }}
                            classNames={{
                                input: "font-bold bg-white dark:bg-[#151922] border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 focus:border-cyan-500 shadow-sm",
                            }}
                        />

                        <Select
                            value={workload}
                            onChange={(val) => val && onWorkloadChange(val as WorkloadType)}
                            data={[
                                { value: "Balanced", label: "Balanced" },
                                { value: "Esports", label: "Esports High" },
                                { value: "AAA", label: "AAA Ultra" },
                            ]}
                            leftSection={<Zap size={15} className="text-amber-500" />}
                            allowDeselect={false}
                            size="xs"
                            radius="md"
                            comboboxProps={{ shadow: "md", transitionProps: { transition: "pop", duration: 150 } }}
                            classNames={{
                                input: "font-bold bg-white dark:bg-[#151922] border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 focus:border-cyan-500 shadow-sm",
                            }}
                        />
                    </Group>
                </Box>

                {/* Body Content */}
                <Box className="p-4 space-y-3.5">
                    <SynergyMeter build={build} resolution={resolution} />
                    <FpsMeter build={build} resolution={resolution} workload={workload} isDark={isDark} />
                    <BottleneckMeter build={build} resolution={resolution} />
                    
                    {analysis && (
                        <OptimizationSuggestions analysis={analysis} onApply={onApplySuggestion} />
                    )}
                </Box>
            </Paper>
        </div>
    );
}
