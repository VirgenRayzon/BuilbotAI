"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/loading-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Package, Shield, ChevronRight, FileText, LayoutDashboard, Settings, Database, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/auth/route-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom Hooks
import { useProfileState } from "./hooks/use-profile-state";
import { useReservations } from "./hooks/use-reservations";
import { useEmergencyControls } from "./hooks/use-emergency-controls";
import { useAdminKeys } from "./hooks/use-admin-keys";
import { useAuditLogs } from "./hooks/use-audit-logs";

// Components
import { ProfileHero } from "./components/profile-hero";
import { AccountDetails } from "./components/account-details";
import { ReservationsList } from "./components/reservations-list";
import { SuperAdminSettings } from "@/components/super-admin-settings";
import { AboutManagement } from "@/components/about-management";
import { AuditLogsSection } from "./components/audit-logs-section";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

/**
 * Profile Page Orchestrator
 * Modularized to separate user management, reservations, and admin controls.
 */
export default function ProfilePage() {
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const router = useRouter();
    const { setIsPageLoading } = useLoading();

    // Logic Layers
    const profileState = useProfileState();
    const reservations = useReservations();
    const emergency = useEmergencyControls();
    const adminKeys = useAdminKeys();
    const audit = useAuditLogs();

    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'cancel' | 'delete' } | null>(null);

    // Initial Effects
    useEffect(() => {
        setIsPageLoading(userLoading || reservations.loading);
        return () => setIsPageLoading(false);
    }, [userLoading, reservations.loading, setIsPageLoading]);

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
                                        <TabsTrigger 
                                            value="overview" 
                                            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-6 py-2.5 transition-all flex items-center gap-2"
                                        >
                                            <LayoutDashboard className="h-4 w-4" /> Overview
                                        </TabsTrigger>
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
                                            onCancel={reservations.handleCancelReservation}
                                            onDelete={reservations.handleDeleteReservation}
                                            onConfirm={setConfirmAction}
                                        />
                                    </TabsContent>
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

                <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                    <AlertDialogContent className="bg-slate-900 border-white/10 rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold font-headline uppercase">
                                {confirmAction?.type === 'cancel' ? "Cancel Reservation?" : "Remove Reservation?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                {confirmAction?.type === 'cancel' 
                                    ? "This will cancel your reservation request. This action is permanent." 
                                    : "This will remove the reservation record from your history."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5">Stay</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => {
                                    if (!confirmAction) return;
                                    if (confirmAction.type === 'cancel') {
                                        reservations.handleCancelReservation(confirmAction.id);
                                    } else {
                                        reservations.handleDeleteReservation(confirmAction.id);
                                    }
                                    setConfirmAction(null);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                            >
                                {confirmAction?.type === 'cancel' ? "Confirm Cancellation" : "Delete Record"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        </RouteGuard>
    );
}
