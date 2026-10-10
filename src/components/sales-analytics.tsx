"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    PieChart as PieIcon,
    BarChart3,
    Calendar,
    Cpu,
    HardDrive,
    Zap,
    Wind,
    Monitor,
    Keyboard,
    Headphones,
    Box,
    Grid,
    Layers,
    FileSpreadsheet,
    Search,
    XCircle,
    ArrowUpDown,
    Award,
    CheckCircle2,
    Clock,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import {
    Paper,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    ActionIcon,
    ThemeIcon,
    Tooltip,
    Select,
    TextInput,
    Tabs,
    Chip,
    ScrollArea,
    SimpleGrid,
    SegmentedControl,
    Box as MantineBox
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, Part, PrebuiltSystem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { exportSalesAnalyticsToExcel } from '@/lib/export-excel';

interface SalesAnalyticsProps {
    orders: Order[];
    parts: Part[];
    prebuilts: PrebuiltSystem[];
}

const COLORS = {
    primary: '#22d3ee', // Cyan
    secondary: '#818cf8', // Indigo
    accent: '#fbbf24', // Amber/Yellow
    success: '#10b981', // Emerald
    destructive: '#ef4444', // Red
    chart: [
        '#22d3ee', '#818cf8', '#10b981', '#fbbf24', '#f472b6', '#a78bfa'
    ]
};

export function SalesAnalytics({ orders, parts, prebuilts }: SalesAnalyticsProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { toast } = useToast();

    // SSR safety for Recharts
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Main Sub-Tab: 'overview' vs 'popularity'
    const [activeTab, setActiveTab] = useState<'overview' | 'popularity'>('overview');

    // Revenue Range
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    // Exporting State
    const [isExporting, setIsExporting] = useState(false);

    // Process Revenue Data based on time range
    const revenueData = useMemo(() => {
        const now = new Date();
        let dataPoints: { name: string; date: Date }[] = [];

        if (timeRange === 'week') {
            dataPoints = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - i));
                return {
                    name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    date: d
                };
            });
        } else if (timeRange === 'month') {
            dataPoints = Array.from({ length: 30 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (29 - i));
                return {
                    name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    date: d
                };
            });
        } else if (timeRange === 'year') {
            dataPoints = Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
                return {
                    name: d.toLocaleDateString(undefined, { month: 'short' }) + " '" + d.getFullYear().toString().slice(-2),
                    date: d
                };
            });
        }

        const dataMap = new Map<string, number>();
        dataPoints.forEach(p => dataMap.set(p.name, 0));

        (orders || []).filter(o => o.status !== 'cancelled').forEach(order => {
            const date = order.createdAt?.toDate?.() || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt));
            let key = "";
            if (timeRange === 'year') {
                key = date.toLocaleDateString(undefined, { month: 'short' }) + " '" + date.getFullYear().toString().slice(-2);
            } else {
                key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }

            if (dataMap.has(key)) {
                dataMap.set(key, (dataMap.get(key) || 0) + (order.totalPrice || 0));
            }
        });

        return dataPoints.map(p => ({
            name: p.name,
            revenue: dataMap.get(p.name) || 0
        }));
    }, [orders, timeRange]);

    // Process Status Distribution (Yellow for Pending!)
    const statusData = useMemo(() => {
        const counts = {
            pending: 0,
            building: 0,
            'finished building': 0,
            cancelled: 0
        };

        (orders || []).forEach(o => {
            const st = o.status || 'pending';
            if (st === 'pending') counts.pending++;
            else if (st === 'building') counts.building++;
            else if (st === 'finished building' || (st as any) === 'finished') counts['finished building']++;
            else if (st === 'cancelled') counts.cancelled++;
        });

        return [
            { name: 'Pending', value: counts.pending, color: '#eab308' }, // Yellow
            { name: 'Building', value: counts.building, color: '#3b82f6' }, // Blue
            { name: 'Finished', value: counts['finished building'], color: '#10b981' }, // Emerald
            { name: 'Cancelled', value: counts.cancelled, color: '#ef4444' } // Red
        ].filter(d => d.value > 0);
    }, [orders]);

    // Process Prebuilt Sales by Tier
    const prebuiltTierData = useMemo(() => {
        const counts = {
            'Entry': 0,
            'Mid-Range': 0,
            'High-End': 0,
            'Workstation': 0
        };

        (orders || []).filter(o => o.status !== 'cancelled' && (o as any).type === 'prebuilt').forEach(order => {
            const prebuiltId = (order as any).prebuiltId;
            const system = (prebuilts || []).find(s => s.id === prebuiltId);
            const tier = system?.tier || (order as any).prebuiltTier || 'Mid-Range';

            if (tier && tier in counts) {
                counts[tier as keyof typeof counts]++;
            }
        });

        return [
            { name: 'Entry Level', value: counts['Entry'], color: COLORS.chart[2] }, // Emerald
            { name: 'Mid-Range', value: counts['Mid-Range'], color: COLORS.chart[0] }, // Cyan
            { name: 'High-End', value: counts['High-End'], color: COLORS.chart[1] }, // Indigo
            { name: 'Workstation', value: counts['Workstation'], color: COLORS.chart[3] } // Amber
        ].filter(d => d.value > 0);
    }, [orders, prebuilts]);

    // Process Category Performance
    const categoryData = useMemo(() => {
        const catMap = new Map<string, number>();
        (orders || []).filter(o => o.status !== 'cancelled').forEach(order => {
            order.items?.forEach(item => {
                catMap.set(item.category, (catMap.get(item.category) || 0) + item.price);
            });
        });

        return Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [orders]);

    // High Level KPI Metrics
    const metrics = useMemo(() => {
        const validOrders = (orders || []).filter(o => o.status !== 'cancelled');
        const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const aov = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
        const cancellationRate = (orders || []).length > 0
            ? ((orders || []).filter(o => o.status === 'cancelled').length / (orders || []).length) * 100
            : 0;

        return { totalRevenue, aov, cancellationRate, orderCount: validOrders.length };
    }, [orders]);

    // Popularity Matrix Data grouped by Category and sorted by Popularity
    const popularityCategories = useMemo(() => {
        const grouped = (parts || []).reduce((acc, part) => {
            if (!acc[part.category]) acc[part.category] = [];
            acc[part.category].push(part);
            return acc;
        }, {} as Record<string, Part[]>);

        const result: { category: string; parts: Part[]; maxPopularity: number }[] = [];

        Object.entries(grouped).forEach(([category, catParts]) => {
            if (catParts.length === 0) return;

            // Sort parts by popularity descending
            const sortedParts = [...catParts].sort((a, b) => {
                const popA = (a as any).popularity || 0;
                const popB = (b as any).popularity || 0;
                return popB - popA;
            });

            const top5 = sortedParts.slice(0, 5);
            const maxPop = top5[0] ? ((top5[0] as any).popularity || 1) : 1;

            result.push({
                category,
                parts: top5,
                maxPopularity: Math.max(maxPop, 1)
            });
        });

        return result.sort((a, b) => a.category.localeCompare(b.category));
    }, [parts]);

    // Top 3 Spotlight Components for Overview
    const topSpotlightParts = useMemo(() => {
        return [...(parts || [])]
            .filter(p => ((p as any).popularity || 0) > 0)
            .sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0))
            .slice(0, 3);
    }, [parts]);

    // Handle Export to Excel
    const handleExport = () => {
        setIsExporting(true);
        try {
            exportSalesAnalyticsToExcel({
                orders,
                parts,
                prebuilts,
                revenueData,
                timeRange
            });
            toast({
                title: "Excel Export Complete",
                description: "Your comprehensive multi-sheet Sales & Analytics workbook has been downloaded.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "Failed to generate Excel file. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Category icon helper
    const getCategoryIcon = (cat: string) => {
        const lower = cat.toLowerCase();
        if (lower.includes('cpu')) return <Cpu className="w-4 h-4 text-cyan-500" />;
        if (lower.includes('gpu')) return <Cpu className="w-4 h-4 text-purple-500" />;
        if (lower.includes('ram') || lower.includes('memory')) return <Layers className="w-4 h-4 text-emerald-500" />;
        if (lower.includes('motherboard')) return <Grid className="w-4 h-4 text-pink-500" />;
        if (lower.includes('psu') || lower.includes('power')) return <Zap className="w-4 h-4 text-amber-500" />;
        if (lower.includes('storage') || lower.includes('ssd') || lower.includes('hdd')) return <HardDrive className="w-4 h-4 text-blue-500" />;
        if (lower.includes('case')) return <Box className="w-4 h-4 text-indigo-500" />;
        if (lower.includes('cooler') || lower.includes('fan')) return <Wind className="w-4 h-4 text-teal-500" />;
        if (lower.includes('monitor')) return <Monitor className="w-4 h-4 text-rose-500" />;
        if (lower.includes('keyboard')) return <Keyboard className="w-4 h-4 text-orange-500" />;
        if (lower.includes('mouse')) return <Zap className="w-4 h-4 text-violet-500" />;
        if (lower.includes('headset') || lower.includes('headphones')) return <Headphones className="w-4 h-4 text-green-500" />;
        return <Package className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Top Navigation & Excel Export Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Mantine Sub-Tabs */}
                    <Tabs
                        value={activeTab}
                        onChange={(val) => val && setActiveTab(val as 'overview' | 'popularity')}
                        variant="pills"
                        radius="md"
                        color="cyan"
                    >
                        <Tabs.List className="inline-flex flex-wrap gap-1">
                            <Tabs.Tab
                                value="overview"
                                leftSection={<TrendingUp className="h-4 w-4" />}
                                className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                            >
                                Performance & Revenue
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="popularity"
                                leftSection={<Activity className="h-4 w-4" />}
                                className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                            >
                                Popularity Matrix
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    {/* Excel Export Button */}
                    <Button
                        onClick={handleExport}
                        loading={isExporting}
                        color="teal"
                        variant="filled"
                        radius="md"
                        size="sm"
                        leftSection={<FileSpreadsheet className="h-4 w-4" />}
                        className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                        Export to Excel
                    </Button>
            </div>

            {/* TAB 1: Performance & Revenue Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* 4 Metric Bento Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Gross Revenue"
                            value={formatCurrency(metrics.totalRevenue)}
                            icon={<DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
                            color="teal"
                            trend="+12.5%"
                            trendUp={true}
                            delay={0}
                        />
                        <MetricCard
                            title="Total Reservations"
                            value={metrics.orderCount.toString()}
                            icon={<Package className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
                            color="blue"
                            trend="+5 today"
                            trendUp={true}
                            delay={0.1}
                        />
                        <MetricCard
                            title="Avg. Order Value"
                            value={formatCurrency(metrics.aov)}
                            icon={<Activity className="w-5 h-5 text-purple-500 dark:text-purple-400" />}
                            color="grape"
                            trend="-2.4%"
                            trendUp={false}
                            delay={0.2}
                        />
                        <MetricCard
                            title="Cancellation Rate"
                            value={`${metrics.cancellationRate.toFixed(1)}%`}
                            icon={<ArrowDownRight className="w-5 h-5 text-red-500 dark:text-red-400" />}
                            color="red"
                            trend="+0.5%"
                            trendUp={false}
                            delay={0.3}
                        />
                    </div>

                    {/* Revenue Performance & Order Status Distribution Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue Area Chart */}
                        <Paper
                            withBorder
                            radius="lg"
                            p={12}
                            className="lg:col-span-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                                <div>
                                    <Title order={3} className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                        Revenue Performance
                                    </Title>
                                    <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                        {timeRange === 'week' ? 'Daily revenue tracking (Last 7 Days)' : 
                                         timeRange === 'month' ? 'Daily revenue tracking (Last 30 Days)' : 
                                         'Monthly revenue tracking (Last 12 Months)'}
                                    </Text>
                                </div>

                                <SegmentedControl
                                    value={timeRange}
                                    onChange={(v) => v && setTimeRange(v as any)}
                                    data={[
                                        { label: '7 Days', value: 'week' },
                                        { label: '30 Days', value: 'month' },
                                        { label: '12 Months', value: 'year' },
                                    ]}
                                    size="xs"
                                    radius="md"
                                    color="cyan"
                                    classNames={{
                                        root: "bg-slate-100 dark:bg-[#141a23] border border-slate-200 dark:border-white/10 p-0.5",
                                        label: "font-headline font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 data-[active=true]:text-slate-900 dark:data-[active=true]:text-white",
                                        indicator: "bg-white dark:bg-[#1e2634] shadow-sm"
                                    }}
                                />
                            </div>

                            <div className="h-[280px] pt-4">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                                                tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                            />
                                            <RechartsTooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl">
                                                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">Revenue:</span>
                                                                    <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">{formatCurrency(payload[0].value as number)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke={COLORS.primary}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
                                )}
                            </div>
                        </Paper>

                        {/* Order Status Distribution (Donut Pie Chart with Yellow for Pending!) */}
                        <Paper
                            withBorder
                            radius="lg"
                            p={12}
                            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
                        >
                            <div className="pb-3 border-b border-slate-200 dark:border-white/10">
                                <Title order={3} className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    <PieIcon className="w-5 h-5 text-indigo-500" />
                                    Order Status
                                </Title>
                                <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                    Inventory lifecycle distribution
                                </Text>
                            </div>

                            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
                            <div className="h-[230px] min-w-0 flex-1 flex items-center justify-center relative">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                strokeWidth={2}
                                                stroke={isDark ? '#111722' : '#ffffff'}
                                                animationDuration={1500}
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const p = payload[0];
                                                        return (
                                                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload?.color }} />
                                                                    <span className="font-bold text-slate-900 dark:text-white">{p.name}:</span>
                                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.value} orders</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
                                )}

                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
                                        {(orders || []).length}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Total
                                    </span>
                                </div>
                            </div>

                            {/* Status legend beside the chart on larger screens */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:min-w-[168px]">
                                {statusData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-md bg-slate-50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-[11px] leading-none uppercase font-semibold tracking-wide text-slate-600 dark:text-slate-400 truncate">
                                                {d.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white ml-2">
                                            {d.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            </div>
                        </Paper>
                    </div>

                    {/* Prebuilt Tier Distribution & Revenue by Category Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Prebuilt Tier Distribution */}
                        <Paper
                            withBorder
                            radius="lg"
                            p={12}
                            className="lg:order-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
                        >
                            <div className="pb-3 border-b border-slate-200 dark:border-white/10">
                                <Title order={3} className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    <Package className="w-5 h-5 text-emerald-500" />
                                    Prebuilt Sales
                                </Title>
                                <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                    Performance tier distribution
                                </Text>
                            </div>

                            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
                            <div className="h-[230px] min-w-0 flex-1 flex items-center justify-center relative">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={prebuiltTierData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                strokeWidth={2}
                                                stroke={isDark ? '#111722' : '#ffffff'}
                                                animationDuration={1500}
                                            >
                                                {prebuiltTierData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const p = payload[0];
                                                        return (
                                                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload?.color }} />
                                                                    <span className="font-bold text-slate-900 dark:text-white">{p.name}:</span>
                                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.value} units</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
                                )}

                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
                                        {prebuiltTierData.reduce((total, tier) => total + tier.value, 0)}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Total
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:min-w-[168px]">
                                {prebuiltTierData.length > 0 ? prebuiltTierData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-md bg-slate-50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-[11px] leading-none uppercase font-semibold tracking-wide text-slate-600 dark:text-slate-400 truncate">
                                                {d.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white ml-2">
                                            {d.value}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center text-xs text-slate-400 py-2 font-mono">
                                        No prebuilt sales data recorded
                                    </div>
                                )}
                            </div>
                            </div>
                        </Paper>

                        {/* Revenue by Category (Horizontal Bar Chart) */}
                        <Paper
                            withBorder
                            radius="lg"
                            p={12}
                            className="lg:order-1 lg:col-span-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
                        >
                            <div className="pb-3 border-b border-slate-200 dark:border-white/10">
                                <Title order={3} className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-cyan-500" />
                                    Revenue by Category
                                </Title>
                                <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                    Top performing component segments
                                </Text>
                            </div>

                            <div className="h-[280px] pt-4">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 700 }}
                                                width={90}
                                            />
                                            <RechartsTooltip
                                                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl text-xs">
                                                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color || COLORS.primary }} />
                                                                    <span className="font-bold text-slate-900 dark:text-white">Revenue:</span>
                                                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(payload[0].value as number)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill={COLORS.primary}
                                                radius={[0, 6, 6, 0]}
                                                barSize={20}
                                                animationDuration={1500}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS.chart[index % COLORS.chart.length]}
                                                        fillOpacity={0.85}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
                                )}
                            </div>
                        </Paper>
                    </div>
                </div>
            )}

            {/* TAB 2: Dedicated Component Popularity Matrix */}
            {activeTab === 'popularity' && (
                <div className="space-y-6">
                    {/* Popularity Matrix Category Grid */}
                    {popularityCategories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {popularityCategories.map(({ category, parts: topParts, maxPopularity }) => (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Paper
                                        withBorder
                                        radius="lg"
                                        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden h-full flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
                                    >
                                        <div>
                                            {/* Category Card Header */}
                                            <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(category)}
                                                    <span className="font-headline font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                                                        {category}
                                                    </span>
                                                </div>
                                                <Badge size="xs" variant="light" color="cyan" className="font-bold uppercase tracking-wider">
                                                    {topParts.length} Tracked
                                                </Badge>
                                            </div>

                                            {/* Ranked Component Items List */}
                                            <div className="divide-y divide-slate-200 dark:divide-white/5">
                                                {topParts.map((item, index) => {
                                                    const pop = (item as any).popularity || 0;
                                                    const relativeStrength = maxPopularity > 0 ? (pop / maxPopularity) * 100 : 0;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 flex flex-col hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/item"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {/* Rank Badge */}
                                                                <div className={cn(
                                                                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-all duration-300 group-hover/item:scale-105",
                                                                    index === 0
                                                                        ? "bg-amber-500/15 text-amber-500 border-amber-500/40 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                                                        : index === 1
                                                                            ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 font-bold"
                                                                            : index === 2
                                                                                ? "bg-orange-500/15 text-orange-500 border-orange-500/30 font-bold"
                                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5"
                                                                )}>
                                                                    #{index + 1}
                                                                </div>

                                                                {/* Component Name & Brand */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-xs truncate leading-tight text-slate-900 dark:text-white group-hover/item:text-cyan-600 dark:group-hover/item:text-cyan-400 transition-colors">
                                                                        {item.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                                                                            {item.brand || 'Standard'}
                                                                        </span>
                                                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                                                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                            {formatCurrency(item.price)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Purchases Count */}
                                                                <div className="text-right shrink-0">
                                                                    <div className="flex items-center gap-1.5 justify-end">
                                                                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                                                            {pop}
                                                                        </span>
                                                                        <Activity className="w-3.5 h-3.5 text-cyan-500" />
                                                                    </div>
                                                                    <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Orders</p>
                                                                </div>
                                                            </div>

                                                            {/* Relative Demand Progress Bar with framer-motion */}
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="text-[8px] text-slate-400 uppercase font-mono tracking-tighter">Relative Demand</span>
                                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                                                    <motion.div
                                                                        className={cn(
                                                                            "h-full rounded-full",
                                                                            index === 0
                                                                                ? "bg-gradient-to-r from-amber-500 to-amber-300"
                                                                                : index === 1
                                                                                    ? "bg-gradient-to-r from-slate-400 to-slate-200"
                                                                                    : index === 2
                                                                                        ? "bg-gradient-to-r from-orange-500 to-orange-300"
                                                                                        : "bg-gradient-to-r from-cyan-500 to-blue-500"
                                                                        )}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${relativeStrength}%` }}
                                                                        transition={{ duration: 0.8, delay: index * 0.08 }}
                                                                    />
                                                                </div>
                                                                <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 font-bold shrink-0">
                                                                    {Math.round(relativeStrength)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Paper>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Paper
                            withBorder
                            radius="lg"
                            p={12}
                            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 text-center py-16"
                        >
                            <Stack align="center" gap="md" className="max-w-md mx-auto">
                                <ThemeIcon size={56} radius="xl" color="gray" variant="light">
                                    <Activity className="h-7 w-7 text-slate-400" />
                                </ThemeIcon>
                                <div className="space-y-1">
                                    <Title order={3} className="text-lg font-headline font-bold text-slate-900 dark:text-white">
                                        No Popularity Data
                                    </Title>
                                    <Text size="xs" className="text-slate-600 dark:text-slate-400">
                                        No component parts have been registered yet.
                                    </Text>
                                </div>
                            </Stack>
                        </Paper>
                    )}
                </div>
            )}
        </div>
    );
}

// Bento KPI Metric Card with framer-motion animation & Mantine surface
function MetricCard({
    title,
    value,
    icon,
    trend,
    trendUp,
    delay,
    color
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    trendUp: boolean;
    delay: number;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
            <Paper
                withBorder
                radius="lg"
                p={12}
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
            >
                <div className="flex items-center justify-between mb-3">
                    <ThemeIcon
                        size={40}
                        radius="md"
                        color={color}
                        variant="light"
                        className="group-hover:scale-110 transition-transform duration-300"
                    >
                        {icon}
                    </ThemeIcon>

                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        trendUp
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono">
                        {title}
                    </p>
                    <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                        {value}
                    </h3>
                </div>
            </Paper>
        </motion.div>
    );
}
