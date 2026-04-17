"use client";

import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    TrendingUp, TrendingDown, DollarSign, Package, 
    ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon,
    BarChart3, Calendar
} from 'lucide-react';
import { Order, Part } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/theme-provider';

interface SalesAnalyticsProps {
    orders: Order[];
    parts: Part[];
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

export function SalesAnalytics({ orders, parts }: SalesAnalyticsProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Process Revenue Data (Last 7 Days)
    const revenueData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });

        const dataMap = new Map<string, number>();
        last7Days.forEach(day => dataMap.set(day, 0));

        orders.filter(o => o.status !== 'cancelled').forEach(order => {
            const date = order.createdAt?.toDate?.() || new Date(order.createdAt);
            const dayStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (dataMap.has(dayStr)) {
                dataMap.set(dayStr, (dataMap.get(dayStr) || 0) + order.totalPrice);
            }
        });

        return last7Days.map(name => ({
            name,
            revenue: dataMap.get(name) || 0
        }));
    }, [orders]);

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
                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Daily revenue tracking (Last 7 Days)</p>
                        </div>
                        <Calendar className="w-5 h-5 text-muted-foreground opacity-40" />
                    </CardHeader>
                    <CardContent className="pt-4 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: isDark ? '#888' : '#666', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: isDark ? '#888' : '#666', fontSize: 10 }}
                                    tickFormatter={(val) => `₱${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                                        borderRadius: '12px', 
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                        backdropFilter: 'blur(8px)',
                                        fontSize: '12px',
                                        color: isDark ? '#fff' : '#000'
                                    }}
                                    itemStyle={{ color: COLORS.primary }}
                                    formatter={(val: number) => [formatCurrency(val), 'Revenue']}
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
                </Card>

                {/* Status Distribution */}
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
                                    contentStyle={{ 
                                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                                        borderRadius: '12px', 
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                        backdropFilter: 'blur(8px)',
                                        fontSize: '12px',
                                        color: isDark ? '#fff' : '#000'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 w-full px-4 mt-2">
                            {statusData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{d.name}</span>
                                    <span className="text-xs font-mono ml-auto">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Category Performance */}
                <Card className="lg:col-span-3 bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
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
                                    contentStyle={{ 
                                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                                        borderRadius: '12px', 
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                        backdropFilter: 'blur(8px)',
                                        color: isDark ? '#fff' : '#000'
                                    }}
                                    formatter={(val: number) => [formatCurrency(val), 'Revenue']}
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
