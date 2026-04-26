"use client";

import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp, TrendingDown, DollarSign, Package,
    ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon,
    BarChart3, Calendar, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order, Part, PrebuiltSystem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/theme-provider';

interface SalesAnalyticsProps {
    orders: Order[];
    parts: Part[];
    prebuilts: PrebuiltSystem[];
}

const COLORS = {
    primary: '#22d3ee', // cyan-400
    secondary: '#818cf8', // indigo-400
    accent: '#fbbf24', // amber-400
    success: '#10b981', // emerald-500
    destructive: '#ef4444', // red-500
    chart: [
        '#22d3ee', '#818cf8', '#10b981', '#fbbf24', '#f472b6', '#a78bfa'
    ]
};

export function SalesAnalytics({ orders, parts, prebuilts }: SalesAnalyticsProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    // Process Revenue Data based on time range
    const revenueData = useMemo(() => {
        const now = new Date();
        let dataPoints: { name: string, date: Date }[] = [];

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

        orders.filter(o => o.status !== 'cancelled').forEach(order => {
            const date = order.createdAt?.toDate?.() || new Date(order.createdAt);
            let key = "";
            if (timeRange === 'year') {
                key = date.toLocaleDateString(undefined, { month: 'short' }) + " '" + date.getFullYear().toString().slice(-2);
            } else {
                key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }

            if (dataMap.has(key)) {
                dataMap.set(key, (dataMap.get(key) || 0) + order.totalPrice);
            }
        });

        return dataPoints.map(p => ({
            name: p.name,
            revenue: dataMap.get(p.name) || 0
        }));
    }, [orders, timeRange]);

    // Process Status Distribution
    const statusData = useMemo(() => {
        const counts = {
            pending: 0,
            building: 0,
            'finished building': 0,
            cancelled: 0
        };

        orders.forEach(o => {
            if (o.status in counts) {
                counts[o.status as keyof typeof counts]++;
            }
        });

        return [
            { name: 'Pending', value: counts.pending, color: COLORS.chart[1] },
            { name: 'Building', value: counts.building, color: COLORS.chart[5] },
            { name: 'Finished', value: counts['finished building'], color: COLORS.chart[2] },
            { name: 'Cancelled', value: counts.cancelled, color: COLORS.destructive }
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

        orders.filter(o => o.status !== 'cancelled' && (o as any).type === 'prebuilt').forEach(order => {
            const prebuiltId = (order as any).prebuiltId;
            const system = prebuilts.find(s => s.id === prebuiltId);
            const tier = system?.tier || (order as any).prebuiltTier; // Fallback to order metadata if exists

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
        orders.filter(o => o.status !== 'cancelled').forEach(order => {
            order.items.forEach(item => {
                catMap.set(item.category, (catMap.get(item.category) || 0) + item.price);
            });
        });

        return Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [orders]);

    const metrics = useMemo(() => {
        const validOrders = orders.filter(o => o.status !== 'cancelled');
        const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        const aov = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
        const cancellationRate = orders.length > 0
            ? (orders.filter(o => o.status === 'cancelled').length / orders.length) * 100
            : 0;

        return { totalRevenue, aov, cancellationRate, orderCount: validOrders.length };
    }, [orders]);

    return (
        <div className="space-y-6">
            {/* Metric Cards - Bento Grid Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Gross Revenue"
                    value={formatCurrency(metrics.totalRevenue)}
                    icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                    trend="+12.5%"
                    trendUp={true}
                    delay={0}
                />
                <MetricCard
                    title="Total Reservations"
                    value={metrics.orderCount.toString()}
                    icon={<Package className="w-5 h-5 text-blue-400" />}
                    trend="+5 today"
                    trendUp={true}
                    delay={0.1}
                />
                <MetricCard
                    title="Avg. Order Value"
                    value={formatCurrency(metrics.aov)}
                    icon={<Activity className="w-5 h-5 text-purple-400" />}
                    trend="-2.4%"
                    trendUp={false}
                    delay={0.2}
                />
                <MetricCard
                    title="Cancellation Rate"
                    value={`${metrics.cancellationRate.toFixed(1)}%`}
                    icon={<ArrowDownRight className="w-5 h-5 text-red-400" />}
                    trend="+0.5%"
                    trendUp={false}
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Revenue Performance
                            </CardTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">
                                {timeRange === 'week' ? 'Daily revenue tracking (Last 7 Days)' : 
                                 timeRange === 'month' ? 'Daily revenue tracking (Last 30 Days)' : 
                                 'Monthly revenue tracking (Last 12 Months)'}
                            </p>
                        </div>
                        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                            <SelectTrigger className="w-[140px] bg-muted/30 border-border hover:bg-muted/50 transition-colors text-[10px] font-bold uppercase tracking-widest h-8">

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-primary" />
                                    <SelectValue placeholder="Select Range" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-popover/95 border-border backdrop-blur-xl">
                                <SelectItem value="week" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Last Week</SelectItem>
                                <SelectItem value="month" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Last Month</SelectItem>
                                <SelectItem value="year" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Last Year</SelectItem>
                            </SelectContent>

                        </Select>
                    </CardHeader>
                    <CardContent className="pt-4 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 10 }}
                                    tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="p-3 rounded-xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-2xl">

                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{label}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                        <span className="font-bold text-sm">Revenue:</span>
                                                        <span className="font-mono font-bold text-sm text-primary">{formatCurrency(payload[0].value as number)}</span>
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
                    </CardContent>
                </Card>                {/* Status Distribution */}
                <Card className="bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                            <PieIcon className="w-5 h-5 text-indigo-400" />
                            Order Status
                        </CardTitle>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Inventory lifecycle distribution</p>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationDuration={1500}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="p-3 rounded-xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-2xl">

                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (payload[0].payload as any)?.color || payload[0].color || COLORS.primary }} />
                                                        <span className="font-bold text-sm">{payload[0].name} :</span>
                                                        <span className="font-mono font-bold text-sm">{payload[0].value}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 w-full px-4 mt-2">
                            {statusData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 group/legend cursor-default">
                                    <div className="w-2 h-2 rounded-full transition-transform group-hover/legend:scale-125" style={{ backgroundColor: d.color }} />
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider transition-colors",
                                        isDark ? "text-slate-400 group-hover/legend:text-white" : "text-slate-500 group-hover/legend:text-slate-900"
                                    )}>{d.name}</span>
                                    <span className={cn(
                                        "text-xs font-mono ml-auto",
                                        isDark ? "text-slate-300" : "text-slate-700"
                                    )}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Prebuilt Tier Distribution & Revenue by Category Row - ALIGNED */}
                <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prebuilt Tier Distribution */}
                    <Card className="bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                                <Package className="w-5 h-5 text-emerald-400" />
                                Prebuilt Sales
                            </CardTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Performance tier distribution</p>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={prebuiltTierData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {prebuiltTierData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="p-3 rounded-xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-2xl">

                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (payload[0].payload as any)?.color || payload[0].color || COLORS.primary }} />
                                                            <span className="font-bold text-sm">{payload[0].name} :</span>
                                                            <span className="font-mono font-bold text-sm">{payload[0].value}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-3 w-full px-4 mt-2">
                                {prebuiltTierData.length > 0 ? prebuiltTierData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 group/legend cursor-default">
                                        <div className="w-1.5 h-1.5 rounded-full transition-transform group-hover/legend:scale-125" style={{ backgroundColor: d.color }} />
                                        <span className={cn(
                                            "text-[9px] uppercase font-bold tracking-wider transition-colors",
                                            isDark ? "text-slate-400 group-hover/legend:text-white" : "text-slate-500 group-hover/legend:text-slate-900"
                                        )}>{d.name}</span>
                                        <span className={cn(
                                            "text-xs font-mono ml-auto",
                                            isDark ? "text-slate-300" : "text-slate-700"
                                        )}>{d.value}</span>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center text-[9px] text-muted-foreground uppercase tracking-widest py-2">
                                        No data
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Performance */}
                    <Card className="lg:col-span-2 bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                                <BarChart3 className="w-5 h-5 text-emerald-400" />
                                Revenue by Category
                            </CardTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Top performing component segments</p>
                        </CardHeader>
                        <CardContent className="pt-4 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: isDark ? '#fff' : '#000', fontSize: 10, fontWeight: 'bold' }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="p-3 rounded-xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-2xl">

                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{label}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || (payload[0].payload as any)?.fill || COLORS.primary }} />
                                                            <span className="font-bold text-sm">Revenue:</span>
                                                            <span className="font-mono font-bold text-sm">{formatCurrency(payload[0].value as number)}</span>
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
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                        animationDuration={1500}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS.chart[index % COLORS.chart.length]}
                                                fillOpacity={0.8}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Most Popular Components by Category */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-primary animate-pulse" />
                        <div>
                            <h3 className="text-2xl font-headline font-bold uppercase tracking-tight">Popularity Matrix</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Top 5 most purchased components per segment</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Object.entries(
                            parts.reduce((acc, part) => {
                                if (!acc[part.category]) acc[part.category] = [];
                                acc[part.category].push(part);
                                return acc;
                            }, {} as Record<string, Part[]>)
                        ).map(([category, catParts]) => {
                            const topParts = catParts
                                .filter(p => (p as any).popularity > 0)
                                .sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0))
                                .slice(0, 5);

                            if (topParts.length === 0) return null;

                            return (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Card className="bg-background/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden h-full group">
                                        <CardHeader className="pb-3 border-b border-border bg-muted/20">

                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm font-headline font-bold uppercase tracking-[0.2em] text-primary">
                                                    {category}
                                                </CardTitle>
                                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary/60">
                                                    Top Segment
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-border">

                                                {topParts.map((item, index) => (
                                                    <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-primary/5 transition-all group/item">
                                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 border border-primary/20 group-hover/item:scale-110 transition-transform">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate leading-tight group-hover/item:text-primary transition-colors">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                                                                {item.brand}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                <span className="font-mono font-bold text-sm">{(item as any).popularity || 0}</span>
                                                                <Activity className="w-3 h-3 text-primary/40" />
                                                            </div>
                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-tighter opacity-60">Purchases</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        }).filter(card => card !== null)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, trendUp, delay }: {
    title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean, delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="bg-background/40 backdrop-blur-xl border-border/50 shadow-xl hover:bg-background/50 transition-colors group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 group-hover:scale-110 transition-transform duration-300">
                            {icon}
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
                        <h3 className="text-2xl font-headline font-bold tracking-tight">{value}</h3>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
