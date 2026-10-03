"use client";

import React, { useState } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  SegmentedControl,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import {
  Package,
  Shield,
  FileText,
  Settings,
  Database,
  Activity,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AccountDetails } from "./components/account-details";
import { EmergencyControlsCard } from "./components/emergency-controls-card";
import { ReservationsList } from "./components/reservations-list";
import { FavoritesList } from "./components/favorites-list";
import { UserAuditLogsSection } from "./components/user-audit-logs-section";
import { AuditLogsSection } from "./components/audit-logs-section";
import { SuperAdminSettings } from "@/components/super-admin-settings";
import { AboutManagement } from "@/components/about-management";

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
 * Profile Page Orchestrator (Mantine UI Redesign)
 * Features modular groupings: Profile & Safeguards Sidebar, Grouped Hardware Rig Workspace,
 * and high-contrast styling across light and dark modes.
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
  const audit = useAuditLogs();
  const userAudit = useUserAuditLogs();
  const favoritesHook = useFavorites();

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [deleteActionId, setDeleteActionId] = useState<string | null>(null);

  // Grouped sub-tab for hardware builds (Reservations vs Favorites)
  const [hardwareSubTab, setHardwareSubTab] = useState<string>("reservations");

  const defaultTab = profile?.isSuperAdmin
    ? "management"
    : profile?.isManager
      ? "audit"
      : "hardware";

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const syncTabs = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "management" && profile?.isSuperAdmin) {
          setActiveTab("management");
        } else if (tab === "content" && profile?.isSuperAdmin) {
          setActiveTab("content");
        } else if (tab === "reservations" && !profile?.isSuperAdmin && !profile?.isManager) {
          setActiveTab("hardware");
          setHardwareSubTab("reservations");
        } else if (tab === "favorites" && !profile?.isSuperAdmin && !profile?.isManager) {
          setActiveTab("hardware");
          setHardwareSubTab("favorites");
        } else if (tab === "audit-logs" || tab === "audit") {
          setActiveTab(profile?.isSuperAdmin || profile?.isManager ? "audit" : "activity");
        } else if (tab === "account") {
          const el = document.getElementById("account-details-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      };

      syncTabs();
      window.addEventListener("popstate", syncTabs);
      return () => window.removeEventListener("popstate", syncTabs);
    }
  }, [profile]);

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

        <div className="relative z-10">
          {/* Hero Section */}
          <ProfileHero profile={profile} authUser={authUser} stats={reservations.stats} />

          <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar: Grouped Profile Details & Safeguards */}
              <div id="account-details-section" className="lg:col-span-4 space-y-6">
                {/* 1. Account Details & Credentials */}
                <AccountDetails
                  profile={profile}
                  {...profileState}
                  {...adminKeys}
                />

                {/* 2. Emergency Controls (Super Admin Only) */}
                {profile?.isSuperAdmin && (
                  <EmergencyControlsCard emergency={emergency} />
                )}
              </div>

              {/* Main Content Area: Grouped Workspaces */}
              <div className="lg:col-span-8">
                <Tabs value={activeTab} onChange={(val) => val && setActiveTab(val)} variant="pills" radius="md">
                  <TabsList className="border-b border-slate-200 dark:border-white/10 pb-4 mb-6 gap-2">
                    {/* Standard User / Builder Tabs */}
                    {(!profile?.isManager && !profile?.isSuperAdmin) && (
                      <>
                        <TabsTab
                          value="hardware"
                          leftSection={<Cpu size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          PC Rig Hub
                        </TabsTab>

                        <TabsTab
                          value="activity"
                          leftSection={<History size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Audit Logs
                          {userAudit.logs.length > 0 && (
                            <Badge size="xs" color="cyan" variant="light" className="ml-2">
                              {userAudit.logs.length}
                            </Badge>
                          )}
                        </TabsTab>
                      </>
                    )}

                    {/* Super Admin Tabs */}
                    {profile?.isSuperAdmin && (
                      <>
                        <TabsTab
                          value="management"
                          leftSection={<Settings size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Management Portal
                        </TabsTab>

                        <TabsTab
                          value="content"
                          leftSection={<Database size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Site Content
                        </TabsTab>

                        <TabsTab
                          value="audit"
                          leftSection={<Shield size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Audit Logs
                        </TabsTab>

                        <TabsTab
                          value="hardware"
                          leftSection={<Cpu size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Personal Rig Hub
                        </TabsTab>
                      </>
                    )}

                    {/* Manager Tabs */}
                    {profile?.isManager && !profile?.isSuperAdmin && (
                      <>
                        <TabsTab
                          value="audit"
                          leftSection={<Shield size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Staff Audit Logs
                        </TabsTab>

                        <TabsTab
                          value="hardware"
                          leftSection={<Cpu size={16} />}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          Personal Rig Hub
                        </TabsTab>
                      </>
                    )}
                  </TabsList>

                  {/* TAB 1: Hardware Builds Group (Reservations + Saved Favorites) */}
                  <TabsPanel value="hardware" className="space-y-6">
                    <Paper
                      withBorder
                      radius="lg"
                      p="md"
                      className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white">
                            Hardware Rig Workspace
                          </Title>
                          <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium">
                            Manage your active store reservations and saved builder favorites in one place.
                          </Text>
                        </div>

                        {/* Grouping Segmented Control */}
                        <SegmentedControl
                          value={hardwareSubTab}
                          onChange={setHardwareSubTab}
                          size="sm"
                          radius="md"
                          data={[
                            {
                              label: `Reservations (${reservations.reservations.length})`,
                              value: "reservations",
                            },
                            {
                              label: `Saved Favorites (${favoritesHook.favorites.length})`,
                              value: "favorites",
                            },
                          ]}
                          classNames={{
                            root: "bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-white/10",
                            label: "font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300",
                          }}
                        />
                      </div>
                    </Paper>

                    {/* Sub-Panel: Reservations */}
                    {hardwareSubTab === "reservations" && (
                      <div className="space-y-4">
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

                    {/* Sub-Panel: Favorites */}
                    {hardwareSubTab === "favorites" && (
                      <div className="space-y-4">
                        <FavoritesList
                          favorites={favoritesHook.favorites}
                          loading={favoritesHook.loading}
                          onDelete={favoritesHook.deleteFavorite}
                          onRename={favoritesHook.renameFavorite}
                        />
                      </div>
                    )}
                  </TabsPanel>

                  {/* TAB 2: Activity Log (Standard Users) */}
                  {(!profile?.isManager && !profile?.isSuperAdmin) && (
                    <TabsPanel value="activity" className="space-y-6">
                      <UserAuditLogsSection
                        logs={userAudit.logs}
                        loading={userAudit.loading}
                      />
                    </TabsPanel>
                  )}

                  {/* TAB 3: Management Portal (Super Admin) */}
                  {profile?.isSuperAdmin && (
                    <TabsPanel value="management" className="space-y-6">
                      <Paper
                        withBorder
                        radius="lg"
                        p="lg"
                        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm mb-6"
                      >
                        <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <span>Management Portal</span>
                        </Title>
                        <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium">
                          Manage staff credentials, AI model routing, and system parameters.
                        </Text>
                      </Paper>
                      <SuperAdminSettings />
                    </TabsPanel>
                  )}

                  {/* TAB 4: Site Content (Super Admin) */}
                  {profile?.isSuperAdmin && (
                    <TabsPanel value="content" className="space-y-6">
                      <Paper
                        withBorder
                        radius="lg"
                        p="lg"
                        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm mb-6"
                      >
                        <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                          <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span>Site Content & Branding</span>
                        </Title>
                        <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium">
                          Update customer-facing company information and story text.
                        </Text>
                      </Paper>
                      <AboutManagement />
                    </TabsPanel>
                  )}

                  {/* TAB 5: Staff / System Audit Logs (Managers & Super Admins) */}
                  {(profile?.isManager || profile?.isSuperAdmin) && (
                    <TabsPanel value="audit" className="space-y-6">
                      <AuditLogsSection
                        logs={audit.auditLogs}
                        loading={audit.auditLogsLoading}
                      />
                    </TabsPanel>
                  )}
                </Tabs>
              </div>
            </div>
          </main>

          {/* Cancel Reservation Modal with Noticeable Text in Both Modes */}
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
                      className="h-11 rounded-xl border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700"
                      onClick={() => setCancelModalOrder(null)}
                    >
                      Keep Reservation
                    </Button>
                    <Button
                      type="button"
                      className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-900/30"
                      onClick={() => {
                        const orderId = cancelModalOrder.id;
                        setCancelModalOrder(null);
                        router.push(
                          `/contact?subject=Cancellation+Request+for+Order+%23${orderId.substring(0, 8).toUpperCase()}`
                        );
                      }}
                    >
                      <ShieldCheck className="h-4 w-4" />
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
