"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Package, Calendar, Clock, Truck, CheckCircle2, ServerCrash, 
    Trash2, ChevronRight, CreditCard 
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

interface ReservationsListProps {
    reservations: Order[];
    loading: boolean;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    onConfirm: (action: { id: string, type: 'cancel' | 'delete' }) => void;
}

export function ReservationsList({
    reservations,
    loading,
    onCancel,
    onDelete,
    onConfirm
}: ReservationsListProps) {
    if (loading) {
        return null;
    }

    if (reservations.length === 0) {
        return (
            <Card className="border-dashed border-white/10 bg-transparent">
                <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center border border-white/5">
                        <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-bold">No active builds</h3>
                        <p className="text-sm text-muted-foreground">Your reservation list is empty. Start building your custom PC today and reserve it here.</p>
                    </div>
                    <Button className="relative z-30 mt-4 shadow-xl shadow-primary/20 group" asChild>
                        <a href="/builder">
                            Start a New Build
                            <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </a>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {reservations.map((reservation) => {
                const status = getStatusInfo(reservation.status || 'pending');
                return (
                    <Card key={reservation.id} className="group border-white/5 bg-muted/5 hover:bg-muted/10 transition-all duration-300 overflow-hidden shadow-inner">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold tracking-tight">Order #{reservation.id.substring(0, 8).toUpperCase()}</p>
                                        <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider", status.bg, status.color, status.border)}>
                                            {status.icon}
                                            {status.label}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" /> Reserved on {reservation.createdAt?.toDate().toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 md:text-right self-start sm:self-center">
                                    <div className="text-right pr-4 border-r border-white/10 hidden sm:block">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Price</p>
                                        <p className="text-xl font-headline font-bold text-emerald-500 leading-none">{formatCurrency(reservation.totalPrice)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(reservation.status === 'pending' || reservation.status === 'building') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="relative z-30 h-8 text-[10px] font-bold uppercase tracking-wider text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                                                onClick={() => onConfirm({ id: reservation.id, type: 'cancel' })}
                                            >
                                                Cancel Order
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "relative z-30 h-9 w-9 transition-colors",
                                                reservation.status === 'cancelled'
                                                    ? "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                    : "text-muted-foreground/20 cursor-not-allowed"
                                            )}
                                            onClick={() => reservation.status === 'cancelled' && onConfirm({ id: reservation.id, type: 'delete' })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background/40 rounded-xl border border-white/5 overflow-hidden">
                                <div className="max-h-[160px] overflow-y-auto divide-y divide-white/5">
                                    {reservation.items.map((item, idx) => (
                                        <div key={`${reservation.id}-item-${idx}`} className="p-3 px-4 flex justify-between items-center text-sm hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center border border-white/5">
                                                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-tighter opacity-70">{(item as any).category || 'Component'}</span>
                                                    <span className="font-medium truncate max-w-[180px] sm:max-w-md">{item.name}</span>
                                                </div>
                                            </div>
                                            <span className="text-muted-foreground font-mono text-xs">{formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 px-4 bg-muted/30 flex justify-between items-center sm:hidden">
                                    <span className="text-xs font-bold text-muted-foreground">Total</span>
                                    <span className="font-bold text-emerald-500">{formatCurrency(reservation.totalPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

function getStatusInfo(status: string) {
    switch (status) {
        case 'pending': return { icon: <Clock className="h-4 w-4" />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Pending Approval" };
        case 'building': return { icon: <Truck className="h-4 w-4" />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Building Phase" };
        case 'finished building': return { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Ready for Pickup" };
        case 'cancelled': return { icon: <ServerCrash className="h-4 w-4" />, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Cancelled" };
        default: return { icon: <Package className="h-4 w-4" />, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-white/5", label: "Processing" };
    }
}
