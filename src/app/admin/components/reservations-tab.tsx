"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Package,
    Monitor,
    Trash2,
    ChevronDown,
    Clock,
    Wrench,
    CheckCircle2,
    XCircle,
    Calendar,
    Search,
    ArrowUpDown,
    PieChart as PieIcon,
    DollarSign,
    RefreshCw,
    AlertCircle,
    Layers,
    SlidersHorizontal,
    Filter
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
    SegmentedControl,
    Chip,
    ScrollArea,
    SimpleGrid,
    Collapse,
    Modal,
    Box
} from '@mantine/core';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import { PaginationControls } from "@/components/pagination-controls";
import { formatCurrency, cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/lib/types';

interface ReservationsTabProps {
    orders: Order[];
    ordersLoading: boolean;
    onDeleteOrder: (id: string, skipConfirm?: boolean) => Promise<void>;
    onUpdateOrder: (id: string, status: Order['status']) => Promise<void>;
}

// Visual configuration for the 4 reservation statuses
const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        color: "yellow",
        hex: "#eab308", // Warm Yellow
        borderHex: "#ca8a04",
        badgeBg: "bg-yellow-400 text-slate-950 font-bold",
        textClass: "text-yellow-600 dark:text-yellow-400",
        bgClass: "bg-yellow-500/10 dark:bg-yellow-500/15",
        borderClass: "border-yellow-500/40 dark:border-yellow-500/30",
        cardHover: "hover:border-yellow-500/60 dark:hover:border-yellow-500/50 shadow-[0_4px_20px_rgba(234,179,8,0.06)]",
        icon: Clock,
        shortDesc: "Awaiting Confirmation",
    },
    building: {
        label: "Building",
        color: "blue",
        hex: "#3b82f6", // Vibrant Blue
        borderHex: "#2563eb",
        badgeBg: "bg-blue-500 text-white font-bold",
        textClass: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-500/10 dark:bg-blue-500/15",
        borderClass: "border-blue-500/40 dark:border-blue-500/30",
        cardHover: "hover:border-blue-500/60 dark:hover:border-blue-500/50 shadow-[0_4px_20px_rgba(59,130,246,0.06)]",
        icon: Wrench,
        shortDesc: "In Assembly",
    },
    "finished building": {
        label: "Finished Building",
        shortLabel: "Finished",
        color: "teal",
        hex: "#10b981", // Emerald
        borderHex: "#059669",
        badgeBg: "bg-emerald-500 text-white font-bold",
        textClass: "text-emerald-600 dark:text-emerald-400",
        bgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
        borderClass: "border-emerald-500/40 dark:border-emerald-500/30",
        cardHover: "hover:border-emerald-500/60 dark:hover:border-emerald-500/50 shadow-[0_4px_20px_rgba(16,185,129,0.06)]",
        icon: CheckCircle2,
        shortDesc: "Ready for Pickup",
    },
    cancelled: {
        label: "Cancelled",
        color: "red",
        hex: "#ef4444", // Rose / Red
        borderHex: "#dc2626",
        badgeBg: "bg-rose-500 text-white font-bold",
        textClass: "text-rose-600 dark:text-rose-400",
        bgClass: "bg-rose-500/10 dark:bg-rose-500/15",
        borderClass: "border-rose-500/40 dark:border-rose-500/25",
        cardHover: "hover:border-rose-500/50 opacity-90",
        icon: XCircle,
        shortDesc: "Voided Order",
    }
} as const;

export function ReservationsTab({
    orders,
    ordersLoading,
    onDeleteOrder,
    onUpdateOrder
}: ReservationsTabProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Client mount state for Recharts SSR safety
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter, Search, and Pagination States
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
    const [orderCurrentPage, setOrderCurrentPage] = useState(1);
    const [orderItemsPerPage, setOrderItemsPerPage] = useState(8);
    const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
    const [showAllSpecs, setShowAllSpecs] = useState(false);

    // Delete confirmation modal state
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Compute Status Metrics & Pie Chart Data
    const metrics = useMemo(() => {
        let pending = 0;
        let building = 0;
        let finished = 0;
        let cancelled = 0;

        let pendingValue = 0;
        let buildingValue = 0;
        let finishedValue = 0;
        let cancelledValue = 0;

        (orders || []).forEach(order => {
            const st = order.status || 'pending';
            const price = order.totalPrice || 0;

            if (st === 'pending') {
                pending++;
                pendingValue += price;
            } else if (st === 'building') {
                building++;
                buildingValue += price;
            } else if (st === 'finished building' || (st as any) === 'finished') {
                finished++;
                finishedValue += price;
            } else if (st === 'cancelled') {
                cancelled++;
                cancelledValue += price;
            }
        });

        const totalOrders = (orders || []).length;
        const totalRevenue = pendingValue + buildingValue + finishedValue + cancelledValue;

        const pieData = [
            {
                name: 'Pending',
                statusKey: 'pending',
                value: pending,
                amount: pendingValue,
                color: STATUS_CONFIG.pending.hex,
                percentage: totalOrders > 0 ? Math.round((pending / totalOrders) * 100) : 0
            },
            {
                name: 'Building',
                statusKey: 'building',
                value: building,
                amount: buildingValue,
                color: STATUS_CONFIG.building.hex,
                percentage: totalOrders > 0 ? Math.round((building / totalOrders) * 100) : 0
            },
            {
                name: 'Finished',
                statusKey: 'finished building',
                value: finished,
                amount: finishedValue,
                color: STATUS_CONFIG['finished building'].hex,
                percentage: totalOrders > 0 ? Math.round((finished / totalOrders) * 100) : 0
            },
            {
                name: 'Cancelled',
                statusKey: 'cancelled',
                value: cancelled,
                amount: cancelledValue,
                color: STATUS_CONFIG.cancelled.hex,
                percentage: totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0
            },
        ];

        return {
            pending,
            building,
            finished,
            cancelled,
            totalOrders,
            pendingValue,
            buildingValue,
            finishedValue,
            cancelledValue,
            totalRevenue,
            pieData
        };
    }, [orders]);

    // Filtered & Sorted Orders
    const filteredOrders = useMemo(() => {
        if (!orders) return [];

        let result = orders.filter(order => {
            // Status Filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'finished') {
                    if (order.status !== 'finished building' && (order.status as any) !== 'finished') return false;
                } else if (order.status !== statusFilter) {
                    return false;
                }
            }

            // Search Query Filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const emailMatch = order.userEmail?.toLowerCase().includes(query);
                const idMatch = order.id?.toLowerCase().includes(query);
                const rigMatch = ((order as any).prebuiltName || '')?.toLowerCase().includes(query);
                const partsMatch = order.items?.some(it => it.name?.toLowerCase().includes(query));
                if (!emailMatch && !idMatch && !rigMatch && !partsMatch) return false;
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;

            if (sortBy === 'newest') return timeB - timeA;
            if (sortBy === 'oldest') return timeA - timeB;
            if (sortBy === 'price-high') return (b.totalPrice || 0) - (a.totalPrice || 0);
            if (sortBy === 'price-low') return (a.totalPrice || 0) - (b.totalPrice || 0);
            return 0;
        });

        return result;
    }, [orders, statusFilter, searchQuery, sortBy]);

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setOrderCurrentPage(1);
    }, [statusFilter, searchQuery, sortBy, orderItemsPerPage]);

    // Paginated Orders for the Grid
    const paginatedOrders = useMemo(() => {
        const startIndex = (orderCurrentPage - 1) * orderItemsPerPage;
        return filteredOrders.slice(startIndex, startIndex + orderItemsPerPage);
    }, [filteredOrders, orderCurrentPage, orderItemsPerPage]);

    const orderTotalPages = Math.ceil(filteredOrders.length / orderItemsPerPage) || 1;

    // Toggle all cards specs breakdown
    const toggleShowAllSpecs = () => {
        const next = !showAllSpecs;
        setShowAllSpecs(next);
        setExpandedCardIds({});
    };

    // Toggle card component breakdown expand
    const toggleExpand = (orderId: string) => {
        setExpandedCardIds(prev => ({
            ...prev,
            [orderId]: !(prev[orderId] !== undefined ? prev[orderId] : showAllSpecs)
        }));
    };

    // Execute Delete
    const handleConfirmDelete = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        try {
            await onDeleteOrder(orderToDelete.id, true);
            setOrderToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // Active status data for Recharts (filter out 0-value items so labels look clean)
    const activePieData = useMemo(() => {
        const nonZero = metrics.pieData.filter(d => d.value > 0);
        if (nonZero.length === 0) {
            return [{ name: 'No Orders', value: 1, amount: 0, color: isDark ? '#273142' : '#e2e8f0', percentage: 0, statusKey: 'none' }];
        }
        return nonZero;
    }, [metrics.pieData, isDark]);

    // Recharts Custom Tooltip
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            if (data.statusKey === 'none') return null;

            return (
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl p-3 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="font-headline font-bold text-sm text-slate-900 dark:text-white">
                            {data.name} Reservations
                        </span>
                    </div>
                    <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p className="flex justify-between gap-4">
                            <span>Count:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {data.value} ({data.percentage}%)
                            </span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span>Total Value:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data.amount)}
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* SECTION 1: Status Breakdown Analytics & Interactive Pie Chart */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
            >
                <Paper
                    withBorder
                    radius="lg"
                    p={12}
                    className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
                >
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                        {/* Left: Donut Pie Chart */}
                        <div className="w-full lg:w-[320px] flex flex-col items-center justify-center shrink-0">
                            <div className="relative w-full h-[220px] flex items-center justify-center">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <RechartsTooltip content={<CustomPieTooltip />} />
                                            <Pie
                                                data={activePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={62}
                                                outerRadius={94}
                                                paddingAngle={metrics.totalOrders > 0 ? 4 : 0}
                                                dataKey="value"
                                                nameKey="name"
                                                strokeWidth={2}
                                                stroke={isDark ? '#111722' : '#ffffff'}
                                                animationDuration={1500}
                                            >
                                                {activePieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        className="cursor-pointer transition-opacity hover:opacity-85 focus:outline-none"
                                                        onClick={() => {
                                                            if (entry.statusKey !== 'none') {
                                                                setStatusFilter(entry.statusKey === statusFilter ? 'all' : entry.statusKey);
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[220px] w-full flex items-center justify-center text-xs text-muted-foreground">
                                        Loading visualizer...
                                    </div>
                                )}

                                {/* Centered Donut Summary */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-3xl font-bold font-headline text-slate-900 dark:text-white tracking-tight leading-none">
                                        {metrics.totalOrders}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                        Total Orders
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Right: 4 Interactive Status Metric Cards with Framer Motion */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
                            {/* 1. PENDING CARD (YELLOW ACCENT) */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="h-full"
                            >
                                <Paper
                                    withBorder
                                    radius="lg"
                                    p={12}
                                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                                    className={cn(
                                        "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full",
                                        statusFilter === 'pending' && "ring-2 ring-yellow-500/50 dark:ring-yellow-500/40 bg-yellow-500/[0.04] dark:bg-yellow-500/[0.08] border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.12)]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <ThemeIcon
                                                size={40}
                                                radius="md"
                                                color="yellow"
                                                variant="light"
                                                className="group-hover:scale-110 transition-transform duration-300"
                                            >
                                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            </ThemeIcon>

                                            <Badge
                                                size="xs"
                                                variant="light"
                                                color="yellow"
                                                className="font-bold uppercase tracking-wider"
                                            >
                                                Action Required
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono">
                                                Pending
                                            </p>
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                                                    {metrics.pending}
                                                </h3>
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                                    {metrics.totalOrders > 0 ? Math.round((metrics.pending / metrics.totalOrders) * 100) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Relative Progress Bar */}
                                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.totalOrders > 0 ? (metrics.pending / metrics.totalOrders) * 100 : 0}%` }}
                                                transition={{ duration: 0.8, delay: 0.1 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                            Pipeline:
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(metrics.pendingValue)}
                                        </span>
                                    </div>
                                </Paper>
                            </motion.div>

                            {/* 2. BUILDING CARD (BLUE ACCENT) */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.08 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="h-full"
                            >
                                <Paper
                                    withBorder
                                    radius="lg"
                                    p={12}
                                    onClick={() => setStatusFilter(statusFilter === 'building' ? 'all' : 'building')}
                                    className={cn(
                                        "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full",
                                        statusFilter === 'building' && "ring-2 ring-blue-500/50 dark:ring-blue-500/40 bg-blue-500/[0.04] dark:bg-blue-500/[0.08] border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <ThemeIcon
                                                size={40}
                                                radius="md"
                                                color="blue"
                                                variant="light"
                                                className="group-hover:scale-110 transition-transform duration-300"
                                            >
                                                <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </ThemeIcon>

                                            <Badge
                                                size="xs"
                                                variant="light"
                                                color="blue"
                                                className="font-bold uppercase tracking-wider"
                                            >
                                                In Progress
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono">
                                                Building
                                            </p>
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                                                    {metrics.building}
                                                </h3>
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    {metrics.totalOrders > 0 ? Math.round((metrics.building / metrics.totalOrders) * 100) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Relative Progress Bar */}
                                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.totalOrders > 0 ? (metrics.building / metrics.totalOrders) * 100 : 0}%` }}
                                                transition={{ duration: 0.8, delay: 0.18 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                            Pipeline:
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(metrics.buildingValue)}
                                        </span>
                                    </div>
                                </Paper>
                            </motion.div>

                            {/* 3. FINISHED CARD (EMERALD ACCENT) */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.16 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="h-full"
                            >
                                <Paper
                                    withBorder
                                    radius="lg"
                                    p={12}
                                    onClick={() => setStatusFilter(statusFilter === 'finished building' || statusFilter === 'finished' ? 'all' : 'finished building')}
                                    className={cn(
                                        "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full",
                                        (statusFilter === 'finished building' || statusFilter === 'finished') && "ring-2 ring-emerald-500/50 dark:ring-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <ThemeIcon
                                                size={40}
                                                radius="md"
                                                color="teal"
                                                variant="light"
                                                className="group-hover:scale-110 transition-transform duration-300"
                                            >
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </ThemeIcon>

                                            <Badge
                                                size="xs"
                                                variant="light"
                                                color="teal"
                                                className="font-bold uppercase tracking-wider"
                                            >
                                                Ready
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono">
                                                Finished
                                            </p>
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                                                    {metrics.finished}
                                                </h3>
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    {metrics.totalOrders > 0 ? Math.round((metrics.finished / metrics.totalOrders) * 100) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Relative Progress Bar */}
                                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.totalOrders > 0 ? (metrics.finished / metrics.totalOrders) * 100 : 0}%` }}
                                                transition={{ duration: 0.8, delay: 0.26 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                            Total Fulfilled:
                                        </span>
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(metrics.finishedValue)}
                                        </span>
                                    </div>
                                </Paper>
                            </motion.div>

                            {/* 4. CANCELLED CARD (RED ACCENT) */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.24 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="h-full"
                            >
                                <Paper
                                    withBorder
                                    radius="lg"
                                    p={12}
                                    onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
                                    className={cn(
                                        "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full",
                                        statusFilter === 'cancelled' && "ring-2 ring-red-500/50 dark:ring-red-500/40 bg-red-500/[0.04] dark:bg-red-500/[0.08] border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.12)]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <ThemeIcon
                                                size={40}
                                                radius="md"
                                                color="red"
                                                variant="light"
                                                className="group-hover:scale-110 transition-transform duration-300"
                                            >
                                                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                            </ThemeIcon>

                                            <Badge
                                                size="xs"
                                                variant="light"
                                                color="red"
                                                className="font-bold uppercase tracking-wider"
                                            >
                                                Voided
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono">
                                                Cancelled
                                            </p>
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                                                    {metrics.cancelled}
                                                </h3>
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-rose-600 dark:text-rose-400">
                                                    {metrics.totalOrders > 0 ? Math.round((metrics.cancelled / metrics.totalOrders) * 100) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Relative Progress Bar */}
                                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-400"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.totalOrders > 0 ? (metrics.cancelled / metrics.totalOrders) * 100 : 0}%` }}
                                                transition={{ duration: 0.8, delay: 0.34 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                            Void Value:
                                        </span>
                                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                                            {formatCurrency(metrics.cancelledValue)}
                                        </span>
                                    </div>
                                </Paper>
                            </motion.div>
                        </div>
                    </div>
                </Paper>
            </motion.div>

            {/* SECTION 2: Search Bar & Dropdown Filter Controls */}
            <Paper
                withBorder
                radius="lg"
                p="xs"
                className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10 shadow-xs"
            >
                <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
                    {/* Left: Search Input */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <TextInput
                            placeholder="Search by email, rig, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            leftSection={<Search size={14} className="text-slate-400" />}
                            rightSection={
                                searchQuery ? (
                                    <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery('')}>
                                        <XCircle className="h-3.5 w-3.5" />
                                    </ActionIcon>
                                ) : null
                            }
                            radius="md"
                            size="xs"
                            className="w-44 sm:w-56 lg:w-64 shrink-0"
                        />
                    </div>

                    {/* Right: Filter, Sort, and Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Status Filter Dropdown */}
                        <Select
                            value={statusFilter}
                            onChange={(val) => setStatusFilter((val as string) || 'all')}
                            leftSection={<Filter size={13} className="text-cyan-500 dark:text-cyan-400" />}
                            data={[
                                { label: `All (${metrics.totalOrders})`, value: 'all' },
                                { label: `Pending (${metrics.pending})`, value: 'pending' },
                                { label: `Building (${metrics.building})`, value: 'building' },
                                { label: `Finished (${metrics.finished})`, value: 'finished building' },
                                { label: `Cancelled (${metrics.cancelled})`, value: 'cancelled' },
                            ]}
                            size="xs"
                            radius="md"
                            className="w-32 sm:w-40 shrink-0"
                        />

                        {/* Sort Selector */}
                        <Select
                            value={sortBy}
                            onChange={(val) => setSortBy((val as any) || 'newest')}
                            leftSection={<ArrowUpDown size={13} className="text-slate-400" />}
                            data={[
                                { label: 'Newest First', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' },
                                { label: 'Price: High to Low', value: 'price-high' },
                                { label: 'Price: Low to High', value: 'price-low' },
                            ]}
                            size="xs"
                            radius="md"
                            className="w-32 sm:w-36 shrink-0"
                        />

                        {/* Global Show/Hide Specs Toggle Button */}
                        <Button
                            variant={showAllSpecs ? "light" : "default"}
                            color={showAllSpecs ? "cyan" : "gray"}
                            size="xs"
                            radius="md"
                            onClick={toggleShowAllSpecs}
                            leftSection={<Layers size={13} />}
                            className="shrink-0"
                        >
                            <span className="hidden sm:inline">{showAllSpecs ? "Hide Specs" : "Show Specs"}</span>
                            <span className="sm:hidden">Specs</span>
                        </Button>

                        {/* Reset Filters button if any filter is active */}
                        {(statusFilter !== 'all' || searchQuery.trim() !== '') && (
                            <Button
                                size="xs"
                                variant="subtle"
                                color="gray"
                                radius="md"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setSearchQuery('');
                                }}
                                leftSection={<RefreshCw size={13} />}
                                className="shrink-0"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </Paper>

            {/* SECTION 3: Cards Grid */}
            {ordersLoading ? (
                <div className="py-20 text-center space-y-3">
                    <ThemeIcon size={56} radius="xl" color="cyan" variant="light" className="animate-spin mx-auto">
                        <RefreshCw className="h-7 w-7 text-cyan-500" />
                    </ThemeIcon>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading customer reservations...</p>
                </div>
            ) : paginatedOrders.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 } as any} spacing="sm">
                    {paginatedOrders.map(order => {
                        const currentStatus = order.status || 'pending';
                        const isPrebuilt = (order as any).type === 'prebuilt';
                        const isPending = currentStatus === 'pending';
                        const isExpanded = expandedCardIds[order.id] !== undefined
                            ? expandedCardIds[order.id]
                            : showAllSpecs;

                        const dateFormatted = order.createdAt?.toDate
                            ? order.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' })
                            : (order.createdAt?.seconds
                                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString(undefined, { dateStyle: 'medium' })
                                : 'Recent');

                        return (
                            <Paper
                                key={order.id}
                                withBorder
                                radius="lg"
                                p={12}
                                className={cn(
                                    "flex flex-col justify-between transition-all duration-300 relative group min-w-0",
                                    "bg-white/80 dark:bg-[#141a23]/90 hover:shadow-md hover:-translate-y-1",
                                    "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40",
                                    currentStatus === 'cancelled' && "opacity-75 grayscale-[0.3]"
                                )}
                            >
                                <div className="space-y-2.5 min-w-0">
                                    {/* Card Header: Type Icon, Email, Status Badge, and Delete Button */}
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <ThemeIcon
                                                size={36}
                                                radius="md"
                                                color={isPrebuilt ? "cyan" : isPending ? "yellow" : "gray"}
                                                variant="light"
                                                className="shrink-0"
                                            >
                                                {isPrebuilt ? (
                                                    <Monitor className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                ) : (
                                                    <Package className={cn(
                                                        "h-4 w-4",
                                                        isPending ? "text-yellow-600 dark:text-yellow-400" : "text-slate-600 dark:text-slate-400"
                                                    )} />
                                                )}
                                            </ThemeIcon>

                                            <div className="min-w-0 flex-1">
                                                <Tooltip label={order.userEmail} withArrow position="top">
                                                    <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 truncate block leading-snug">
                                                        {order.userEmail}
                                                    </Text>
                                                </Tooltip>

                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    {isPrebuilt ? (
                                                        <Badge
                                                            variant="light"
                                                            color="cyan"
                                                            size="xs"
                                                            radius="sm"
                                                            className="font-semibold text-[9px] uppercase tracking-wide"
                                                        >
                                                            Prebuilt
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="light"
                                                            color="gray"
                                                            size="xs"
                                                            radius="sm"
                                                            className="font-semibold text-[9px] uppercase tracking-wide"
                                                        >
                                                            Custom Build
                                                        </Badge>
                                                    )}

                                                    {isPending && (
                                                        <Badge
                                                            color="yellow"
                                                            variant="light"
                                                            size="xs"
                                                            radius="sm"
                                                            className="text-[9px] font-bold uppercase tracking-wide"
                                                        >
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Action Button */}
                                        <Tooltip label="Delete reservation" withArrow>
                                            <ActionIcon
                                                size="sm"
                                                color="red"
                                                variant="subtle"
                                                radius="md"
                                                onClick={() => setOrderToDelete(order)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                                                aria-label="Delete reservation"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </ActionIcon>
                                        </Tooltip>
                                    </div>

                                    {/* Card Metadata: Rig / ID and Date */}
                                    <Paper
                                        withBorder
                                        radius="md"
                                        p="xs"
                                        className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 space-y-1 min-w-0"
                                    >
                                        <div className="flex items-center justify-between gap-2 text-xs font-mono min-w-0">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
                                                {isPrebuilt ? "Rig Name" : "Build ID"}
                                            </span>
                                            <Tooltip label={isPrebuilt ? ((order as any).prebuiltName || 'Custom Prebuilt') : `#${order.id.toUpperCase()}`} withArrow position="top">
                                                <span className="text-slate-900 dark:text-slate-200 font-bold truncate text-xs text-right flex-1 min-w-0">
                                                    {isPrebuilt
                                                        ? ((order as any).prebuiltName || 'Custom Prebuilt')
                                                        : `#${order.id.substring(0, 10).toUpperCase()}`
                                                    }
                                                </span>
                                            </Tooltip>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                                            <span className="flex items-center gap-1.5 font-medium text-[11px] shrink-0">
                                                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{dateFormatted}</span>
                                            </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] shrink-0">
                                                {order.items?.length || 0} Components
                                            </span>
                                        </div>
                                    </Paper>

                                    {/* Amount and Status Change Dropdown */}
                                    <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="tracking-wider text-[10px] truncate block">
                                                Total Price
                                            </Text>
                                            <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100 font-mono leading-tight truncate block">
                                                {formatCurrency(order.totalPrice)}
                                            </Text>
                                        </div>

                                        {/* Status Dropdown - Adaptive Responsive Width */}
                                        <div className="w-[125px] sm:w-[135px] shrink-0">
                                            <Select
                                                value={currentStatus}
                                                onChange={(val) => val && onUpdateOrder(order.id, val as Order['status'])}
                                                data={[
                                                    { label: 'Pending', value: 'pending' },
                                                    { label: 'Building', value: 'building' },
                                                    { label: 'Finished', value: 'finished building' },
                                                    { label: 'Cancelled', value: 'cancelled' },
                                                ]}
                                                size="xs"
                                                radius="md"
                                                classNames={{
                                                    input: cn(
                                                        "text-[10px] font-bold uppercase tracking-wider h-7 pl-2 pr-5 transition-colors font-mono",
                                                        isPending && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:border-amber-500",
                                                        currentStatus === 'building' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:border-blue-500",
                                                        currentStatus === 'finished building' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500",
                                                        currentStatus === 'cancelled' && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:border-rose-500"
                                                    )
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expandable Components Breakdown Drawer */}
                                    <div className="pt-0.5">
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="xs"
                                            radius="md"
                                            fullWidth
                                            onClick={() => toggleExpand(order.id)}
                                            leftSection={<Layers size={13} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />}
                                            rightSection={
                                                <ChevronDown
                                                    size={14}
                                                    className={cn(
                                                        "transition-transform duration-200 text-slate-400",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            }
                                            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white h-7 mt-0.5"
                                        >
                                            {isExpanded ? "Hide Specs" : `Show Specs (${order.items?.length || 0})`}
                                        </Button>

                                        <Collapse in={isExpanded}>
                                            <Paper
                                                withBorder
                                                radius="md"
                                                p="xs"
                                                mt="xs"
                                                className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 space-y-1 max-h-52 overflow-y-auto"
                                            >
                                                <div className="flex justify-between items-center px-1 pb-1 border-b border-slate-200/70 dark:border-white/5 text-[9px] uppercase tracking-wider font-bold text-slate-400">
                                                    <span>Component</span>
                                                    <span>Price</span>
                                                </div>
                                                {order.items?.map((item, idx) => (
                                                    <div
                                                        key={`${order.id}-item-${idx}`}
                                                        className="flex justify-between items-start text-xs py-1 border-t border-slate-200/40 dark:border-white/[0.03] first:border-t-0"
                                                    >
                                                        <div className="flex flex-col pr-2 min-w-0">
                                                            <span className="text-[9px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                                                                {(item as any).category || 'Part'}
                                                            </span>
                                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </Paper>
                                        </Collapse>
                                    </div>
                                </div>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            ) : (
                /* Empty Filter State */
                <Paper
                    withBorder
                    radius="lg"
                    p="xl"
                    className="bg-white dark:bg-[#111722] border-dashed border-slate-300 dark:border-white/10 text-center py-16"
                >
                    <Stack align="center" gap="md" className="max-w-md mx-auto">
                        <ThemeIcon size={56} radius="xl" color="gray" variant="light">
                            <Layers className="h-7 w-7 text-slate-400" />
                        </ThemeIcon>
                        <div className="space-y-1">
                            <Title order={3} className="text-lg font-headline font-bold text-slate-900 dark:text-white">
                                No Reservations Found
                            </Title>
                            <Text size="xs" className="text-slate-600 dark:text-slate-400">
                                {searchQuery || statusFilter !== 'all'
                                    ? "No reservations match your current filter criteria. Try clearing your filters or searching another keyword."
                                    : "There are currently no reservations in the system database."}
                            </Text>
                        </div>
                        {(searchQuery || statusFilter !== 'all') && (
                            <Button
                                size="sm"
                                color="cyan"
                                variant="light"
                                radius="md"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setSearchQuery('');
                                }}
                                className="font-bold uppercase tracking-wider text-xs"
                            >
                                Reset Filters
                            </Button>
                        )}
                    </Stack>
                </Paper>
            )}

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && (
                <div className="pt-2">
                    <PaginationControls
                        currentPage={orderCurrentPage}
                        totalPages={orderTotalPages}
                        itemsPerPage={orderItemsPerPage}
                        onPageChange={setOrderCurrentPage}
                        onItemsPerPageChange={setOrderItemsPerPage}
                    />
                </div>
            )}

            {/* Mantine Modal for Delete Confirmation */}
            <Modal
                opened={!!orderToDelete}
                onClose={() => setOrderToDelete(null)}
                title={
                    <Group gap="xs">
                        <ThemeIcon size="md" color="red" variant="light" radius="md">
                            <Trash2 size={16} />
                        </ThemeIcon>
                        <Text fw={700} className="font-headline text-base text-slate-900 dark:text-white uppercase tracking-tight">
                            Confirm Deletion
                        </Text>
                    </Group>
                }
                centered
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
                classNames={{
                    content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
                    header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
                    body: "!p-3",
                    close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
                }}
            >
                <div className="space-y-4 pt-2">
                    <Text size="sm" className="text-slate-600 dark:text-slate-300">
                        Are you sure you want to permanently delete the reservation for{' '}
                        <strong className="text-slate-900 dark:text-white">{orderToDelete?.userEmail}</strong>?
                    </Text>

                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1 text-xs">
                        <p><span className="text-slate-500">Order ID:</span> <strong className="font-mono text-slate-800 dark:text-slate-200">#{orderToDelete?.id}</strong></p>
                        <p><span className="text-slate-500">Total Price:</span> <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(orderToDelete?.totalPrice || 0)}</strong></p>
                        <p><span className="text-slate-500">Status:</span> <strong className="uppercase text-slate-800 dark:text-slate-200">{orderToDelete?.status}</strong></p>
                    </div>

                    <Text size="xs" c="red" className="font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        This action cannot be undone. All data for this order will be permanently erased.
                    </Text>

                    <Group justify="flex-end" gap="sm" className="pt-2">
                        <Button
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="sm"
                            onClick={() => setOrderToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            radius="md"
                            size="sm"
                            onClick={handleConfirmDelete}
                            loading={isDeleting}
                            className="font-bold uppercase tracking-wider text-xs"
                        >
                            Delete Permanently
                        </Button>
                    </Group>
                </div>
            </Modal>
        </div>
    );
}
