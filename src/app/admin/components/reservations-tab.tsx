"use client";

import React, { useState, useMemo } from 'react';
import { Package, Monitor, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from "@/components/pagination-controls";
import { formatCurrency, cn } from "@/lib/utils";
import type { Order } from '@/lib/types';

interface ReservationsTabProps {
    orders: Order[];
    ordersLoading: boolean;
    onDeleteOrder: (id: string) => Promise<void>;
    onUpdateOrder: (id: string, status: Order['status']) => Promise<void>;
}

export function ReservationsTab({
    orders,
    ordersLoading,
    onDeleteOrder,
    onUpdateOrder
}: ReservationsTabProps) {
    const [orderCurrentPage, setOrderCurrentPage] = useState(1);
    const [orderItemsPerPage, setOrderItemsPerPage] = useState(5);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const paginatedOrders = useMemo(() => {
        if (!orders) return [];
        const sorted = [...orders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const startIndex = (orderCurrentPage - 1) * orderItemsPerPage;
        return sorted.slice(startIndex, startIndex + orderItemsPerPage);
    }, [orders, orderCurrentPage, orderItemsPerPage]);

    const orderTotalPages = Math.ceil((orders?.length || 0) / orderItemsPerPage);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2 uppercase">
                <Package className="h-6 w-6 text-primary" /> Current Reservations
            </h2>
            <Card>
                <CardContent className="p-0">
                    {ordersLoading ? null : (
                        orders && orders.length > 0 ? (
                            <>
                                <div className="divide-y overflow-hidden rounded-md border border-white/5">
                                    {paginatedOrders.map(order => (
                                        <div
                                            key={order.id}
                                            className={cn(
                                                "flex flex-col transition-all duration-300",
                                                order.status === 'pending'
                                                    ? "border-l-4 border-l-primary shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                                                    : "border-l-4 border-l-transparent",
                                                order.status === 'cancelled' && "opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors",
                                                    expandedOrderId === order.id && "bg-muted/30 pb-3"
                                                )}
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-muted/50 border border-white/5 shadow-sm">
                                                        {(order as any).type === 'prebuilt' ? (
                                                            <Monitor className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <p className="font-bold text-base tracking-tight">{order.userEmail}</p>
                                                            {(order as any).type === 'prebuilt' && (
                                                                <Badge variant="outline" className="border-primary/30 text-primary text-[8px] h-3.5 uppercase tracking-tighter bg-primary/5">PREBUILT</Badge>
                                                            )}
                                                            {order.status === 'pending' && <Badge className="bg-primary hover:bg-primary text-[10px] h-4 animate-pulse">NEW</Badge>}
                                                        </div>
                                                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-70">
                                                            {(order as any).type === 'prebuilt' ? (
                                                                <>RIG: {(order as any).prebuiltName || 'Custom Prebuilt'}</>
                                                            ) : (
                                                                <>ID: {order.id.substring(0, 12)} • {order.items.length} items</>
                                                            )}
                                                            • {order.createdAt?.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row items-center justify-between md:justify-end gap-5 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter mb-0.5">Amount</p>
                                                        <p className="font-headline font-bold text-base text-emerald-500 tracking-tight">{formatCurrency(order.totalPrice)}</p>
                                                    </div>
                                                    <Select
                                                        defaultValue={order.status || 'pending'}
                                                        onValueChange={(val) => onUpdateOrder(order.id, val as Order['status'])}
                                                    >
                                                        <SelectTrigger className={cn(
                                                            "w-[140px] h-9 text-[10px] font-bold uppercase tracking-wider",
                                                            order.status === 'pending' && "border-primary/50 text-primary",
                                                            order.status === 'cancelled' && "text-destructive border-destructive/30"
                                                        )}>
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending" className="font-bold text-primary">Pending</SelectItem>
                                                            <SelectItem value="building" className="font-bold text-blue-400">Building</SelectItem>
                                                            <SelectItem value="finished building" className="font-bold text-emerald-400">Finished Building</SelectItem>
                                                            <SelectItem value="cancelled" className="text-destructive font-bold bg-destructive/5">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteOrder(order.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 transition-transform", expandedOrderId === order.id && "rotate-180")}>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {expandedOrderId === order.id && (
                                                <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="grid grid-cols-1 gap-1.5 bg-background/40 rounded-xl p-4 border border-white/5 shadow-inner">
                                                        <div className="flex justify-between items-center mb-2 px-1 pb-1 border-b border-white/5">
                                                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Full Component List</span>
                                                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Price</span>
                                                        </div>
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-baseline group py-1 border-t border-white/[0.03] first:border-t-0">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] uppercase font-bold text-primary/60 tracking-tighter">{item.category}</span>
                                                                    <span className="text-sm font-medium text-foreground/80 leading-tight group-hover:text-primary transition-colors pr-4">{item.name}</span>
                                                                </div>
                                                                <span className="font-mono text-xs text-primary/70 shrink-0">{formatCurrency(item.price)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <PaginationControls
                                        currentPage={orderCurrentPage}
                                        totalPages={orderTotalPages}
                                        itemsPerPage={orderItemsPerPage}
                                        onPageChange={setOrderCurrentPage}
                                        onItemsPerPageChange={setOrderItemsPerPage}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">No reservations yet.</div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
