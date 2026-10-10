"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Paper,
  Title,
  Text,
  Badge,
  Group,
  ThemeIcon,
  Button,
  SegmentedControl,
} from "@mantine/core";
import {
  User,
  Package,
  Shield,
  FileText,
  Settings,
  Activity,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  History,
  Truck,
  Bot,
  FileCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RouteGuard } from "@/components/auth/route-guard";
import type { Order } from "@/lib/types";

// Custom Hooks
import { useProfileState } from "./hooks/use-profile-state";
import { useReservations } from "./hooks/use-reservations";
import { useEmergencyControls } from "./hooks/use-emergency-controls";
import { useAdminKeys } from "./hooks/use-admin-keys";
import { useAuditLogs } from "./hooks/use-audit-logs";
import { useUserAuditLogs } from "./hooks/use-user-audit-logs";
import { useFavorites } from "./hooks/use-favorites";

// Sub-components
import { ProfileHero } from "./components/profile-hero";
import { ProfileSidebar } from "./components/profile-sidebar";
import { AccountDetails } from "./components/account-details";
import { MantineProfileView } from "./components/mantine-profile-view";
import { MantineSettingsView } from "./components/mantine-settings-view";
import { EmergencyControlsCard } from "./components/emergency-controls-card";
import { ReservationsList } from "./components/reservations-list";
import { FavoritesList } from "./components/favorites-list";
import { UserAuditLogsSection } from "./components/user-audit-logs-section";
import { CompactInfo } from "@/components/ui/compact-info";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Profile Page Orchestrator (Facebook & Mantine UI Architecture)
 * Features a sticky left navigation sidebar, full-bleed right workspace,
 * smooth framer-motion transitions, and strict RBAC isolation.
 */
export default function ProfilePage() {
  const { authUser, profile } = useUserProfile();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Logic Layers
  const profileState = useProfileState();
  const reservations = useReservations();
  const emergency = useEmergencyControls();
  const adminKeys = useAdminKeys();
  const userAudit = useUserAuditLogs();
  const favoritesHook = useFavorites();

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [deleteActionId, setDeleteActionId] = useState<string | null>(null);

  // Role booleans
  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);
  const isRegularUser = !isSuperAdmin && !isManager;

  // Define permitted tabs per role (Safeguards remains for Super Admin)
  const getAllowedTabs = useCallback(() => {
    if (isSuperAdmin) {
      return ["profile", "settings", "account", "safeguards"];
    }
    if (isManager) {
      return ["profile", "settings", "account"];
    }
    return ["profile", "settings", "account", "reservations", "favorites", "activity"];
  }, [isSuperAdmin, isManager]);

  const defaultTab = "profile";
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Synchronize and sanitize URL query params with legacy redirections to /admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const syncTabs = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");

        // Graceful automatic redirections for relocated tabs
        if (tab === "audit" || tab === "audit-logs") {
          router.replace("/admin?tab=audit");
          return;
        }
        if (tab === "management") {
          router.replace("/admin?tab=management");
          return;
        }
        if (tab === "ai-models" || tab === "prompts") {
          router.replace("/admin?tab=ai");
          return;
        }
        if (tab === "content") {
          router.replace("/admin?tab=content");
          return;
        }

        const allowed = getAllowedTabs();

        if (tab && allowed.includes(tab)) {
          if (tab === "account" || tab === "overview") {
            setActiveTab("profile");
          } else {
            setActiveTab(tab);
          }
        } else {
          setActiveTab(defaultTab);
        }
      };

      syncTabs();
      window.addEventListener("popstate", syncTabs);
      return () => window.removeEventListener("popstate", syncTabs);
    }
  }, [profile, isSuperAdmin, isManager, getAllowedTabs]);

  // Tab switch handler with URL synchronization
  const handleTabChange = (tabId: string) => {
    const allowed = getAllowedTabs();
    if (!allowed.includes(tabId)) return;

    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      url.searchParams.delete("sub");
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <RouteGuard requiredPermission="isRegisteredUser">
      <div
        className={cn(
          "min-h-screen transition-colors duration-300 overflow-x-hidden",
          isDark ? "bg-[#0a0d14] text-slate-100" : "bg-slate-50 text-slate-900"
        )}
      >
        {/* Subtle Background Pattern */}
        <div
          className={cn(
            "fixed inset-0 opacity-[0.025] pointer-events-none z-0",
            isDark ? "invert" : ""
          )}
          style={{
            backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 pt-6 md:pt-8">
          {/* Full-Width Prominent User Identity Banner below Header */}
          <ProfileHero
            profile={profile}
            authUser={authUser}
            stats={reservations.stats}
          />

          <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-12">
            {/* Facebook / Mantine UI 2-Column Architecture */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: Sticky Navigation Sidebar */}
              <aside className="w-full lg:w-[325px] shrink-0 lg:sticky lg:top-24">
                <ProfileSidebar
                  profile={profile}
                  authUser={authUser}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  reservationsCount={reservations.reservations.length}
                  favoritesCount={favoritesHook.favorites.length}
                  userLogsCount={userAudit.logs.length}
                />
              </aside>

              {/* Right Column: Full-Bleed Dynamic Workspace */}
              <section className="flex-1 w-full min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* TAB: Profile (Mantine UI apps/profile) */}
                    {(activeTab === "profile" || activeTab === "account") && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <span>Profile Overview</span>
                            <CompactInfo message="Manage your public identity, personal details, and community presence." />
                          </Title>
                        </Paper>
                        <MantineProfileView
                          profile={profile}
                          authUser={authUser}
                          onNavigateToSettings={() => handleTabChange("settings")}
                          reservations={reservations.reservations}
                          favorites={favoritesHook.favorites}
                          stats={reservations.stats}
                        />
                      </div>
                    )}

                    {/* TAB: Settings (Mantine UI apps/settings) */}
                    {activeTab === "settings" && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <span>Account Settings</span>
                            <CompactInfo message="Configure security preferences, linked accounts, and notification options." />
                          </Title>
                        </Paper>
                        <MantineSettingsView
                          profile={profile}
                          authUser={authUser}
                          {...profileState}
                          {...adminKeys}
                        />
                      </div>
                    )}

                    {/* TAB 2: Store Reservations (Regular Customers Only) */}
                    {activeTab === "reservations" && isRegularUser && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <span>Store Reservations</span>
                                <CompactInfo message="Track active component reservation tickets, assembly progress, and pick-up readiness." />
                              </Title>
                            </div>
                            <Badge size="md" variant="light" color="blue" className="font-mono font-bold">
                              {reservations.reservations.length} Reserved Rigs
                            </Badge>
                          </div>
                        </Paper>

                        <ReservationsList
                          reservations={reservations.reservations}
                          loading={reservations.loading}
                          onCancel={(id) => {
                            const target = reservations.reservations.find((r) => r.id === id);
                            if (target) setCancelModalOrder(target);
                          }}
                          onDelete={(id) => setDeleteActionId(id)}
                          onConfirm={({ id, type, order }) => {
                            if (type === "cancel") {
                              const target = order || reservations.reservations.find((r) => r.id === id);
                              if (target) setCancelModalOrder(target);
                            } else {
                              setDeleteActionId(id);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* TAB 3: Saved Rigs & Builds (Regular Customers Only) */}
                    {activeTab === "favorites" && isRegularUser && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                                <Heart className="h-5 w-5 text-rose-500" />
                                <span>Saved Favourites</span>
                                <CompactInfo message="Access and modify your custom PC builds saved from the PC Builder." />
                              </Title>
                            </div>
                            <Button
                              size="xs"
                              variant="light"
                              color="cyan"
                              onClick={() => router.push("/builder")}
                              leftSection={<Cpu size={14} />}
                              className="font-bold uppercase tracking-wider text-xs"
                            >
                              Create New Build
                            </Button>
                          </div>
                        </Paper>

                        <FavoritesList
                          favorites={favoritesHook.favorites}
                          loading={favoritesHook.loading}
                          onDelete={favoritesHook.deleteFavorite}
                          onRename={favoritesHook.renameFavorite}
                        />
                      </div>
                    )}

                    {/* TAB 4: Activity History (Regular Customers Only) */}
                    {activeTab === "activity" && isRegularUser && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                            <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <span>Activity Logs</span>
                            <CompactInfo message="Review your recent account actions, build updates, and reservation events." />
                          </Title>
                        </Paper>

                        <UserAuditLogsSection
                          logs={userAudit.logs}
                          loading={userAudit.loading}
                        />
                      </div>
                    )}

                    {/* System Safeguards (Super Admin Only - Retained in Profile) */}
                    {activeTab === "safeguards" && isSuperAdmin && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Activity className="h-5 w-5 text-amber-500" />
                            <span>System Safeguards & Emergency Overrides</span>
                            <CompactInfo message="Real-time emergency kill switches, maintenance mode locks, and storage fallbacks." />
                          </Title>
                        </Paper>

                        <EmergencyControlsCard emergency={emergency} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>
          </main>

          {/* Cancel Reservation Modal */}
          <Dialog
            open={!!cancelModalOrder}
            onOpenChange={(open) => !open && setCancelModalOrder(null)}
          >
            <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0e131f] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                  <DialogTitle className="text-xl md:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">
                    Cancel Build Reservation
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Review components before submitting a cancellation request for this rig.
                </DialogDescription>
              </DialogHeader>

              {cancelModalOrder && (
                <div className="space-y-5 my-2">
                  {/* Components List */}
                  <div className="space-y-2 py-1 divide-y divide-slate-200 dark:divide-white/10">
                    {cancelModalOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs pt-2 gap-4">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          <span className="text-cyan-700 dark:text-cyan-400 font-bold mr-1.5 uppercase text-[10px]">
                            {(item as any).category || "Part"}:
                          </span>
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Price */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/10">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Total Value</span>
                    <span className="text-xl font-headline font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cancelModalOrder.totalPrice)}
                    </span>
                  </div>

                  {/* Reservation Notice Box */}
                  <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      To cancel this reservation, please reach out to our representative. Hardware components are reserved from real-time store inventory upon booking.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      color="gray"
                      className="h-11 rounded-xl font-semibold text-xs uppercase tracking-wider"
                      onClick={() => setCancelModalOrder(null)}
                    >
                      Keep Reservation
                    </Button>
                    <Button
                      type="button"
                      color="teal"
                      className="h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-900/30"
                      onClick={() => {
                        const orderId = cancelModalOrder.id;
                        setCancelModalOrder(null);
                        router.push(
                          `/contact?subject=Cancellation+Request+for+Order+%23${orderId.substring(0, 8).toUpperCase()}`
                        );
                      }}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      Contact Staff
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Cancelled Record Confirmation */}
          <AlertDialog open={!!deleteActionId} onOpenChange={(open) => !open && setDeleteActionId(null)}>
            <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold font-headline uppercase text-slate-900 dark:text-white">
                  Remove Reservation Record?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-300 font-medium">
                  This will remove the cancelled reservation entry from your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (deleteActionId) {
                      reservations.handleDeleteReservation(deleteActionId);
                      setDeleteActionId(null);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
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
