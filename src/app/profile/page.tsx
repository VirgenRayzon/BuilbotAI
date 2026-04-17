"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Loader2, Package, CheckCircle2, Clock, Truck, ServerCrash, 
    User, Mail, Calendar, Shield, Trash2, ChevronRight, 
    ArrowUpRight, ShoppingBag, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SuperAdminSettings } from "@/components/super-admin-settings";
import { Separator } from "@/components/ui/separator";
import { updateReservationStatus } from "@/app/checkout-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProfilePage() {
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [reservations, setReservations] = useState<Order[]>([]);
    const [reservationsLoading, setReservationsLoading] = useState(true);

    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'cancel' | 'delete' } | null>(null);

    useEffect(() => {
        // Force unlock scroll on mount in case of stale state from other pages/modals
        document.body.classList.remove('antigravity-scroll-lock');
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
    }, []);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    const fetchReservations = async () => {
        if (!authUser || !firestore) return;
        setReservationsLoading(true);
        try {
            const q = query(
                collection(firestore, "orders"),
                where("userId", "==", authUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedOrders: Order[] = [];
            querySnapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            // Sort by date descending
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || 0;
                const dateB = b.createdAt?.toDate?.() || 0;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            setReservations(fetchedOrders);
        } catch (error) {
            console.error("Error fetching reservations:", error);
            toast({
                title: "Error",
                description: "Failed to load reserved builds.",
                variant: "destructive"
            });
        } finally {
            setReservationsLoading(false);
        }
    };

    useEffect(() => {
        if (authUser) {
            fetchReservations();
        } else if (!userLoading) {
            setReservationsLoading(false);
        }
    }, [authUser, firestore, userLoading]);

    const handleSaveProfile = async () => {
        if (!authUser || !firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, "users", authUser.uid), {
                name,
                email
            });
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: "There was an error updating your profile.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!firestore) return;

        try {
            const result = await updateReservationStatus(reservationId, 'cancelled');
            if (result.success) {
                setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'cancelled' } : r));
                toast({
                    title: "Reservation Cancelled",
                    description: "Your reservation has been cancelled successfully.",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error cancelling reservation:", error);
            toast({
                title: "Error",
                description: "Failed to cancel the reservation.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteReservation = async (reservationId: string) => {
        if (!firestore) return;

        try {
            await deleteDoc(doc(firestore, "orders", reservationId));
            setReservations(prev => prev.filter(r => r.id !== reservationId));
            toast({
                title: "Reservation Removed",
                description: "Your reserved build has been deleted.",
            });
        } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({
                title: "Error",
                description: "Failed to delete the reservation.",
                variant: "destructive"
            });
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { icon: <Clock className="h-4 w-4" />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Pending Approval" };
            case 'building': return { icon: <Truck className="h-4 w-4" />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Building Phase" };
            case 'finished building': return { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Ready for Pickup" };
            case 'cancelled': return { icon: <ServerCrash className="h-4 w-4" />, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Cancelled" };
            default: return { icon: <Package className="h-4 w-4" />, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-white/5", label: "Processing" };
        }
    };

    const stats = useMemo(() => {
        const totalValue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        return {
            totalBuilds: reservations.length,
            totalValue: totalValue,
            activeBuilds: reservations.filter(r => r.status === 'pending' || r.status === 'building').length
        };
    }, [reservations]);

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="p-12 text-center space-y-4 max-w-md">
                    <User className="h-16 w-16 mx-auto opacity-20" />
                    <h1 className="text-3xl font-headline font-bold">Sign in Required</h1>
                    <p className="text-muted-foreground">Please sign in to view your profile and manage your PC build reservations.</p>
                    <Button className="w-full mt-4" asChild>
                        <a href="/signin">Sign In Now</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/50">
            {/* Profile Hero Section */}
            <div className="w-full bg-muted/30 border-b border-white/5 py-12 mb-8">
                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary/20">
                                {profile?.name?.substring(0, 1).toUpperCase() || authUser.email?.substring(0, 1).toUpperCase()}
                            </div>
                            {profile?.isSuperAdmin && (
                                <div className="absolute -bottom-2 -right-2 bg-background border border-white/10 rounded-lg p-1.5 shadow-lg">
                                    <Shield className="h-4 w-4 text-primary" />
                                </div>
                            )}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-4xl font-headline font-bold tracking-tight">
                                {profile?.name || "Member Name"}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                                <span className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5" /> {authUser.email}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <span className="flex items-center gap-1.5 text-sm">
                                    <Calendar className="h-3.5 w-3.5" /> Joined {authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1" />
                        
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full md:w-auto">
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start min-w-[120px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Total Builds</p>
                                <p className="text-2xl font-headline font-bold">{stats.totalBuilds}</p>
                            </div>
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start min-w-[120px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Active</p>
                                <p className="text-2xl font-headline font-bold text-primary">{stats.activeBuilds}</p>
                            </div>
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 hidden md:flex flex-col items-start min-w-[140px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Investment</p>
                                <p className="text-xl font-headline font-bold text-emerald-500">{formatCurrency(stats.totalValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar: Profile Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-white/5 bg-muted/10 overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Account Details</CardTitle>
                                        <CardDescription>Manage your identity</CardDescription>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(!isEditing);
                                        }}
                                        className={cn("relative z-30", isEditing ? "text-primary" : "text-muted-foreground")}
                                    >
                                        {isEditing ? "Cancel" : "Edit"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-focus-within:opacity-100" />
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={!isEditing}
                                            className="pl-10 h-10 bg-background/50 border-white/5 focus-visible:ring-primary/30"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Contact Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-focus-within:opacity-100" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={!isEditing}
                                            className="pl-10 h-10 bg-background/50 border-white/5 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 italic px-1">Used for build updates and notifications.</p>
                                </div>

                                {isEditing && (
                                    <Button className="relative z-30 w-full mt-2 shadow-lg shadow-primary/20" onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                                        Update Profile
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {profile?.isSuperAdmin && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                <SuperAdminSettings />
                            </div>
                        )}
                        
                        <Card className="border-white/5 bg-background/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Need help?</p>
                                        <p className="text-xs text-muted-foreground">Contact support regarding your builds.</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="ml-auto" asChild>
                                        <a href="mailto:support@buildbotai.com"><ChevronRight className="h-4 w-4" /></a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content: Reservations */}
                    <div className="lg:col-span-8 space-y-8">
                        {(!profile?.isManager && !profile?.isSuperAdmin) && (
                            <>
                                <div className="flex items-end justify-between px-1">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                                            <Package className="h-6 w-6 text-primary" /> Reserved Builds
                                        </h2>
                                        <p className="text-sm text-muted-foreground">Manage your custom and pre-built system reservations.</p>
                                    </div>
                                    <Badge variant="secondary" className="mb-1">
                                        {reservations.length} total
                                    </Badge>
                                </div>

                                {reservationsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-48 w-full bg-muted/20 animate-pulse rounded-2xl border border-white/5" />
                                        ))}
                                    </div>
                                ) : reservations.length > 0 ? (
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
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setConfirmAction({ id: reservation.id, type: 'cancel' });
                                                                            }}
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
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (reservation.status === 'cancelled') {
                                                                                setConfirmAction({ id: reservation.id, type: 'delete' });
                                                                            } else {
                                                                                toast({
                                                                                    title: "Action Restricted",
                                                                                    description: "Please cancel the order first before deleting the reservation.",
                                                                                    variant: "destructive"
                                                                                });
                                                                            }
                                                                        }}
                                                                        title={reservation.status === 'cancelled' ? "Delete Reservation" : "Cancel order first to delete"}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Items Preview */}
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
                                ) : (
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
                                )}
                            </>
                        )}

                        {(profile?.isManager || profile?.isSuperAdmin) && (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                                <Shield className="h-20 w-20 text-primary opacity-20" />
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-headline font-bold uppercase tracking-tight">Administrative Access</h2>
                                    <p className="text-muted-foreground max-w-md">You are logged in as an administrator. Personal build reservations are disabled for staff accounts to prioritize inventory management.</p>
                                </div>
                                <Button size="lg" className="rounded-2xl px-8" asChild>
                                    <a href="/admin">Return to Dashboard</a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction?.type === 'cancel' ? "Cancel Reservation?" : "Delete Reservation?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.type === 'cancel' 
                                ? "This will mark your order as cancelled. You can still see it in your history."
                                : "This will permanently remove this build from your history. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                if (confirmAction) {
                                    if (confirmAction.type === 'cancel') handleCancelReservation(confirmAction.id);
                                    else handleDeleteReservation(confirmAction.id);
                                    setConfirmAction(null);
                                }
                            }}
                            className={confirmAction?.type === 'delete' ? "bg-rose-600 hover:bg-rose-700" : ""}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
