"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/loading-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Package, Shield, ChevronRight, FileText, LayoutDashboard, Settings, Database, Activity, Heart, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/auth/route-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";

// Custom Hooks
import { useProfileState } from "./hooks/use-profile-state";
import { useReservations } from "./hooks/use-reservations";
import { useEmergencyControls } from "./hooks/use-emergency-controls";
import { useAdminKeys } from "./hooks/use-admin-keys";
import { useAuditLogs } from "./hooks/use-audit-logs";
import { useUserAuditLogs } from "./hooks/use-user-audit-logs";
import { useFavorites } from "./hooks/use-favorites";

// Components
import { ProfileHero } from "./components/profile-hero";
import { AccountDetails } from "./components/account-details";
import { ReservationsList } from "./components/reservations-list";
import { SuperAdminSettings } from "@/components/super-admin-settings";
import { AboutManagement } from "@/components/about-management";
import { AuditLogsSection } from "./components/audit-logs-section";
import { UserAuditLogsSection } from "./components/user-audit-logs-section";
import { FavoritesList } from "./components/favorites-list";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

/**
 * Profile Page Orchestrator
 * Modularized to separate user management, reservations, and admin controls.
 */
export default function ProfilePage() {
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const router = useRouter();

    // Logic Layers
    const profileState = useProfileState();
    const reservations = useReservations();
    const emergency = useEmergencyControls();
    const adminKeys = useAdminKeys();
    const audit = useAuditLogs();
    const userAudit = useUserAuditLogs();
    const favoritesHook = useFavorites();

    const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
    const [deleteActionId, setDeleteActionId] = useState<string | null>(null);

    // Initial Effects

    return (
        <RouteGuard requiredPermission="isRegisteredUser">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
            )}>
            {/* Circuit Pattern Background */}
            <div className={cn(
                "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
                isDark ? "invert" : ""
            )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10">
                <ProfileHero profile={profile} authUser={authUser} stats={reservations.stats} />

                <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar: Profile Info & Emergency Controls */}
                        <div className="lg:col-span-4 space-y-6">
                            <AccountDetails 
                                profile={profile}
                                {...profileState}
                                {...adminKeys}
                                emergency={emergency}
                            />
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-8">
                            <Tabs 
                                defaultValue={profile?.isSuperAdmin ? "management" : (profile?.isManager ? "audit" : "overview")} 
                                className="w-full"
                            >
                                <TabsList className={cn(
                                    "flex flex-wrap h-auto p-1 bg-transparent border-b border-white/5 rounded-none mb-8 w-full justify-start gap-4",
                                    isDark ? "border-white/5" : "border-slate-200"
                                    )}>
                                    {(!profile?.isManager && !profile?.isSuperAdmin) && (
                                        <>
                                            <TabsTrigger 
                                                value="overview" 
                                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                            >
                                                <LayoutDashboard className="h-4 w-4" /> Overview
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="favorites" 
                                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                            >
                                                <Heart className="h-4 w-4" /> Favorites
                                                {favoritesHook.favorites.length > 0 && (
                                                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[9px] font-bold bg-rose-500/20 text-rose-500 border-rose-500/30">
                                                        {favoritesHook.favorites.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="activity" 
                                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                            >
                                                <Activity className="h-4 w-4" /> Activity Log
                                                {userAudit.logs.length > 0 && (
                                                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[9px] font-bold bg-primary/20 text-primary border-primary/30">
                                                        {userAudit.logs.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                        </>
                                    )}
                                    
                                    {profile?.isSuperAdmin && (
                                        <>
                                            <TabsTrigger 
                                                value="management" 
                                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                            >
                                                <Settings className="h-4 w-4" /> Management
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="content" 
                                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                            >
                                                <Database className="h-4 w-4" /> Site Content
                                            </TabsTrigger>
                                        </>
                                    )}

                                    {(profile?.isManager || profile?.isSuperAdmin) && (
                                        <TabsTrigger 
                                            value="audit" 
                                            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                        >
                                            <Activity className="h-4 w-4" /> Audit Logs
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {/* Overview Tab: Reservations (Standard Users Only) */}
                                {(!profile?.isManager && !profile?.isSuperAdmin) && (
                                    <>
                                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-end justify-between px-1">
                                            <div className="space-y-1">
                                                <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                                                    <Package className="h-6 w-6 text-primary" /> Reserved Builds
                                                </h2>
                                                <p className="text-sm text-muted-foreground">Manage your custom and pre-built system reservations.</p>
                                            </div>
                                            <Badge variant="secondary" className="mb-1">
                                                {reservations.reservations.length} total
                                            </Badge>
                                        </div>

                                        <ReservationsList 
                                            reservations={reservations.reservations}
                                            loading={reservations.loading}
                                            onCancel={(id) => {
                                                const target = reservations.reservations.find(r => r.id === id);
                                                if (target) setCancelModalOrder(target);
                                            }}
                                            onDelete={(id) => setDeleteActionId(id)}
                                            onConfirm={({ id, type, order }) => {
                                                if (type === 'cancel') {
                                                    const target = order || reservations.reservations.find(r => r.id === id);
                                                    if (target) setCancelModalOrder(target);
                                                } else {
                                                    setDeleteActionId(id);
                                                }
                                            }}
                                        />
                                    </TabsContent>

                                    <TabsContent value="favorites" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-end justify-between px-1">
                                            <div className="space-y-1">
                                                <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                                                    <Heart className="h-6 w-6 text-rose-500" /> Favorite Builds
                                                </h2>
                                                <p className="text-sm text-muted-foreground">Saved PC builds from the Builder and AI Advisor. Load them instantly.</p>
                                            </div>
                                            <Badge variant="secondary" className="mb-1">
                                                {favoritesHook.favorites.length} saved
                                            </Badge>
                                        </div>
                                        <FavoritesList
                                            favorites={favoritesHook.favorites}
                                            loading={favoritesHook.loading}
                                            onDelete={favoritesHook.deleteFavorite}
                                            onRename={favoritesHook.renameFavorite}
                                        />
                                    </TabsContent>

                                    <TabsContent value="activity" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <UserAuditLogsSection logs={userAudit.logs} loading={userAudit.loading} />
                                    </TabsContent>
                                    </>
                                )}

                                {/* Management Tab: Super Admin Only */}
                                {profile?.isSuperAdmin && (
                                    <TabsContent value="management" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-1 px-1 mb-6">
                                            <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                                                <Shield className="h-6 w-6 text-primary" /> Management Portal
                                            </h2>
                                            <p className="text-sm text-muted-foreground">Manage manager accounts and system-wide configurations.</p>
                                        </div>
                                        <SuperAdminSettings />
                                    </TabsContent>
                                )}

                                {/* Content Tab: Super Admin Only */}
                                {profile?.isSuperAdmin && (
                                    <TabsContent value="content" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-1 px-1 mb-6">
                                            <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                                                <FileText className="h-6 w-6 text-cyan-400" /> Site Content
                                            </h2>
                                            <p className="text-sm text-muted-foreground">Update public-facing information and brand messaging.</p>
                                        </div>
                                        <AboutManagement />
                                    </TabsContent>
                                )}

                                {/* Audit Logs Tab: Manager & Super Admin */}
                                {(profile?.isManager || profile?.isSuperAdmin) && (
                                    <TabsContent value="audit" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <AuditLogsSection logs={audit.auditLogs} loading={audit.auditLogsLoading} />
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    </div>
                </main>

                {/* Cancel Reservation Modal (Matches Reservation Dialog Layout) */}
                <Dialog open={!!cancelModalOrder} onOpenChange={(open) => !open && setCancelModalOrder(null)}>
                    <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0e131f]/95 border border-white/10 text-white rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-2.5 text-emerald-400">
                                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                                <DialogTitle className="text-xl md:text-2xl font-bold font-headline tracking-tight text-white">
                                    Cancel Reservation
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-xs md:text-sm text-slate-400">
                                Review your components before requesting cancellation of this build.
                            </DialogDescription>
                        </DialogHeader>

                        {cancelModalOrder && (
                            <div className="space-y-6 my-2">
                                {/* Components List - Clean expansion without inner scroll */}
                                <div className="space-y-2.5 py-1 divide-y divide-white/5">
                                    {cancelModalOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-xs pt-2 gap-4">
                                            <span className="text-slate-300 font-medium">
                                                <span className="text-slate-500 font-bold mr-1">{(item as any).category || 'Part'}:</span>
                                                {item.name}
                                            </span>
                                            <span className="font-mono font-bold text-white shrink-0">
                                                {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Price */}
                                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                    <span className="text-base md:text-lg font-bold text-white">Total Price</span>
                                    <span className="text-xl md:text-2xl font-headline font-bold text-cyan-400">
                                        {formatCurrency(cancelModalOrder.totalPrice)}
                                    </span>
                                </div>

                                {/* Reservation Notice Box */}
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        To cancel this reservation, please contact our representative. As hardware components are held and allocated in stock upon reservation, cancellations must be processed by our team.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 rounded-xl border-white/10 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 font-semibold text-xs uppercase tracking-wider"
                                        onClick={() => setCancelModalOrder(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-900/30"
                                        onClick={() => {
                                            const orderId = cancelModalOrder.id;
                                            setCancelModalOrder(null);
                                            router.push(`/contact?subject=Cancellation+Request+for+Order+%23${orderId.substring(0, 8).toUpperCase()}`);
                                        }}
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Contact Representative
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Cancelled Record Confirmation */}
                <AlertDialog open={!!deleteActionId} onOpenChange={(open) => !open && setDeleteActionId(null)}>
                    <AlertDialogContent className="bg-slate-900 border-white/10 rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold font-headline uppercase">
                                Remove Reservation Record?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                This will remove the reservation record from your history.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => {
                                    if (deleteActionId) {
                                        reservations.handleDeleteReservation(deleteActionId);
                                        setDeleteActionId(null);
                                    }
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                            >
                                Delete Record
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        </RouteGuard>
    );
}
