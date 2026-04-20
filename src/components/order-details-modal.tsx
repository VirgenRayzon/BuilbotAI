"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
    Dialog as ShdnDialog, 
    DialogContent as ShdnDialogContent, 
    DialogHeader as ShdnDialogHeader, 
    DialogTitle as ShdnDialogTitle,
    DialogDescription as ShdnDialogDescription,
    DialogFooter as ShdnDialogFooter
} from "@/components/ui/dialog";
import { Loader2, Package, Calendar, CreditCard, ChevronRight, User } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderDetailsModalProps {
    orderId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
    const firestore = useFirestore();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId || !firestore) return;
            setLoading(true);
            try {
                const docRef = doc(firestore, "orders", orderId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (open && orderId) {
            fetchOrder();
        } else if (!open) {
            // Reset order when closed to avoid showing old data next time
            setTimeout(() => setOrder(null), 300);
        }
    }, [orderId, open, firestore]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { variant: 'outline', label: 'Pending Approval', color: 'text-amber-500 bg-amber-500/10' };
            case 'building': return { variant: 'secondary', label: 'Building Phase', color: 'text-blue-500 bg-blue-500/10' };
            case 'finished building': return { variant: 'default', label: 'Ready for Pickup', color: 'text-emerald-500 bg-emerald-500/10' };
            case 'cancelled': return { variant: 'destructive', label: 'Cancelled', color: 'text-rose-500 bg-rose-500/10' };
            default: return { variant: 'outline', label: 'Processing', color: 'text-muted-foreground bg-muted/50' };
        }
    };

    return (
        <ShdnDialog open={open} onOpenChange={onOpenChange}>
            <ShdnDialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                
                <ShdnDialogHeader className="p-6 pb-2 relative">
                    <div className="flex items-center justify-between mb-2">
                        <ShdnDialogTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Order Details</ShdnDialogTitle>
                        {order && (
                            <Badge className={cn("px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest border-white/5", getStatusInfo(order.status).color)}>
                                {getStatusInfo(order.status).label}
                            </Badge>
                        )}
                    </div>
                    <ShdnDialogDescription className="text-muted-foreground font-mono text-xs">
                        {order ? `Reference: #${order.id.toUpperCase()}` : "Loading build information..."}
                    </ShdnDialogDescription>
                </ShdnDialogHeader>

                <div className="px-6 space-y-6 relative">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                            <p className="text-xs text-muted-foreground animate-pulse">Retrieving system specs...</p>
                        </div>
                    ) : order ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Summary Card */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Reserved On</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        <p className="font-semibold text-sm">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Total Investment</p>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                                        <p className="font-headline font-bold text-emerald-500 whitespace-nowrap">
                                            {formatCurrency(order.totalPrice)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="opacity-30" />

                            {/* Components List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" /> Hardware Specifications
                                </h4>
                                <div className="bg-background/40 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                                    <div className="max-h-[220px] overflow-y-auto">
                                        {order.items.map((item, idx) => (
                                            <div key={`${item.id}-${idx}`} className="p-3 px-4 flex justify-between items-center group hover:bg-white/[0.02] transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-tighter opacity-70">
                                                        {(item as any).category || 'Part'}
                                                    </span>
                                                    <span className="text-sm font-medium truncate max-w-[280px]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                            <p className="text-sm text-muted-foreground">Order data could not be retrieved. It may have been removed or archived.</p>
                        </div>
                    )}
                </div>

                <ShdnDialogFooter className="p-6 pt-2 bg-muted/20 relative mt-4">
                    <Button variant="ghost" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
                        Dismiss
                    </Button>
                    <Button className="shadow-lg shadow-primary/20 group" asChild onClick={() => onOpenChange(false)}>
                        <a href="/profile" className="flex items-center gap-2">
                            Go to My Profile
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                    </Button>
                </ShdnDialogFooter>
            </ShdnDialogContent>
        </ShdnDialog>
    );
}
