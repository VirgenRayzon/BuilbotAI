"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useTheme } from "@/context/theme-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Paper,
  Title,
  Text,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import {
  User,
  Package,
  Settings,
  Activity,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  History,
  Truck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  MapPin,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RouteGuard } from "@/components/auth/route-guard";
import { ProtectedPageLoading } from "@/components/auth/protected-page-loading";
import type { Order } from "@/lib/types";
import { useSiteSettings } from "@/context/site-settings-context";

// Custom Hooks
import { useProfileState } from "./hooks/use-profile-state";
import { useReservations } from "./hooks/use-reservations";
import { useEmergencyControls } from "./hooks/use-emergency-controls";
import { useAdminKeys } from "./hooks/use-admin-keys";
import { useUserAuditLogs } from "./hooks/use-user-audit-logs";
import { useFavorites } from "./hooks/use-favorites";

// Sub-components
import { ProfileHero } from "./components/profile-hero";
import { ProfileSidebar } from "./components/profile-sidebar";
import { MantineProfileView } from "./components/mantine-profile-view";
import { MantineSettingsView } from "./components/mantine-settings-view";
import { AddressBookSection } from "./components/address-book-section";
import { EmergencyControlsCard } from "./components/emergency-controls-card";
import { ReservationsList } from "./components/reservations-list";
import { FavoritesList } from "./components/favorites-list";
import { UserAuditLogsSection } from "./components/user-audit-logs-section";
import { ContactInboxTab } from "./components/contact-inbox-tab";
import { CustomerSupportTab } from "./components/customer-support-tab";
import { MockOrdersSection } from "@/components/ecommerce/mock-orders-section";
import { CompactInfo } from "@/components/ui/compact-info";
import { useEcommerce } from "@/context/ecommerce-context";
import {
  getReservationQueue,
  isReservationInPendingQueue,
  isReservationInReceiveQueue,
  isReservationCompleted,
  isShipmentCompleted,
  isShipmentInReceiveQueue,
  requiresStaffCancellation,
} from "@/lib/customer-order-workflow";

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
  const searchParams = useSearchParams();
  const { isEcommerceMode } = useSiteSettings();

  // Logic Layers
  const profileState = useProfileState();
  const reservations = useReservations();
  const { orders: ecommerceOrders } = useEcommerce();
  const activeOrders = reservations.reservations.filter((r) => r.status !== "cancelled");
  const cancelledOrders = reservations.reservations.filter((r) => r.status === "cancelled");
  const cancelledOrderIds = new Set(cancelledOrders.map((order) => order.id));
  const activeOrderIds = new Set(activeOrders.map((order) => order.id));

  const toReceiveReservationOrders = activeOrders.filter(isReservationInReceiveQueue);

  const mockReceiveOrders = ecommerceOrders.filter(
    (order) =>
      (!order.firestoreOrderId ||
        (!activeOrderIds.has(order.firestoreOrderId) &&
          !cancelledOrderIds.has(order.firestoreOrderId))) &&
      isShipmentInReceiveQueue(order)
  );
  const completedOrders = ecommerceOrders.filter(
    (order) =>
      (!order.firestoreOrderId || !cancelledOrderIds.has(order.firestoreOrderId)) &&
      isShipmentCompleted(order)
  );
  const fulfilledOrderIds = new Set(
    [...mockReceiveOrders, ...completedOrders]
      .map((order) => order.firestoreOrderId)
      .filter((id): id is string => Boolean(id))
  );
  const queuedOrders = activeOrders.filter(
    (order) =>
      isReservationInPendingQueue(order) && !fulfilledOrderIds.has(order.id)
  );
  const toPayOrders = queuedOrders.filter(
    (order) => getReservationQueue(order) === "to-pay"
  );
  const toShipOrders = queuedOrders.filter(
    (order) => getReservationQueue(order) === "to-ship"
  );
  const toBuildOrders = queuedOrders.filter(
    (order) => getReservationQueue(order) === "to-build"
  );
  const completedReservationOrders = activeOrders.filter(isReservationCompleted);
  const toReceiveCount = toReceiveReservationOrders.length + mockReceiveOrders.length;
  const emergency = useEmergencyControls();
  const adminKeys = useAdminKeys();
  const userAudit = useUserAuditLogs();
  const favoritesHook = useFavorites();

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  const handleOrderCancelAction = useCallback(
    (order: Order) => {
      setCancelModalOrder(order);
    },
    []
  );

  // Role booleans
  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);
  const isRegularUser = !isSuperAdmin && !isManager;

  // Define permitted tabs per role (Safeguards remains for Super Admin)
  const getAllowedTabs = useCallback(() => {
    if (isSuperAdmin) {
      return ["profile", "address-book", "settings", "account", "contact-inbox", "safeguards"];
    }
    if (isManager) {
      return ["profile", "address-book", "settings", "account", "contact-inbox"];
    }
    return [
      "profile",
      "address-book",
      "settings",
      "account",
      "to-pay",
      "to-ship",
      "to-build",
      "to-receive",
      "completed",
      "orders",
      "reservations",
      "shipments",
      "cancelled",
      "favorites",
      "contact-inbox",
      "activity",
    ];
  }, [isSuperAdmin, isManager]);

  const defaultTab = "profile";
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Synchronize and sanitize URL query params with legacy redirections to /admin.
  // App Router navigations do not emit `popstate`, so the search params must be
  // observed directly for links that change tabs while this page stays mounted.
  useEffect(() => {
    const tab = searchParams.get("tab");

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

    const normalizedTab =
      tab === "orders" || tab === "reservations"
        ? "to-ship"
        : tab === "shipments"
          ? "to-receive"
          : tab;

    if (normalizedTab && allowed.includes(normalizedTab)) {
      setActiveTab(normalizedTab === "account" || normalizedTab === "overview" ? "profile" : normalizedTab);
    } else {
      setActiveTab(defaultTab);
    }
  }, [getAllowedTabs, router, searchParams]);

  // Tab switch handler with URL synchronization
  const handleTabChange = (tabId: string) => {
    const allowed = getAllowedTabs();
    if (!allowed.includes(tabId)) return;

    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      url.searchParams.delete("sub");
      if (tabId !== "contact-inbox") url.searchParams.delete("inquiry");
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <RouteGuard requiredPermission="isRegisteredUser" loadingComponent={<ProtectedPageLoading variant="profile" />}>
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

        <div className="relative z-10 pt-6 md:pt-8 max-w-[1600px] mx-auto">
          {(isSuperAdmin || isManager) && (
            <div className="flex justify-end px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 mb-3">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={() => router.push("/admin")}
                className="min-h-11 whitespace-nowrap font-semibold text-xs tracking-wider uppercase text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
              >
                Back to Dashboard
              </Button>
            </div>
          )}

          {/* Full-Width Prominent User Identity Banner below Header */}
          <ProfileHero
            profile={profile}
            authUser={authUser}
            stats={reservations.stats}
          />

          <main className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 pb-12">
            {/* Facebook / Mantine UI 2-Column Architecture */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
              {/* Left Column: Sticky Navigation Sidebar */}
              <aside className="w-full lg:w-[325px] shrink-0 lg:sticky lg:top-24">
                <ProfileSidebar
                  profile={profile}
                  authUser={authUser}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  toPayCount={toPayOrders.length}
                  toShipCount={toShipOrders.length}
                  toBuildCount={toBuildOrders.length}
                  toReceiveCount={toReceiveCount}
                  completedCount={completedReservationOrders.length}
                  cancelledCount={cancelledOrders.length}
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

                    {/* TAB: Address Book */}
                    {activeTab === "address-book" && (
                      <AddressBookSection />
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

                    {/* TAB: Contact Inbox */}
                    {activeTab === "contact-inbox" && (
                      isRegularUser ? <CustomerSupportTab /> : <ContactInboxTab />
                    )}

                    {/* Customer order workflow queues */}
                    {(activeTab === "to-pay" ||
                      activeTab === "to-ship" ||
                      activeTab === "to-build") &&
                      isRegularUser && (
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
                                {activeTab === "to-pay" ? (
                                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                ) : activeTab === "to-build" ? (
                                  <Cpu className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                ) : (
                                  <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                )}
                                <span>
                                  {activeTab === "to-pay"
                                    ? "To Pay"
                                    : activeTab === "to-build"
                                      ? "To Build"
                                      : "To Ship"}
                                </span>
                                <CompactInfo
                                  message={
                                    activeTab === "to-pay"
                                      ? "Orders that need payment completion or another payment attempt."
                                      : activeTab === "to-build"
                                        ? "Paid custom and prebuilt systems waiting for assembly and quality checks."
                                        : "Individual parts waiting to be packed and handed to the courier."
                                  }
                                />
                              </Title>
                            </div>
                            <Badge
                              size="md"
                              variant="light"
                              color={activeTab === "to-pay" ? "amber" : activeTab === "to-build" ? "violet" : "cyan"}
                              className="font-mono font-bold"
                            >
                              {activeTab === "to-pay"
                                ? toPayOrders.length
                                : activeTab === "to-build"
                                  ? toBuildOrders.length
                                  : toShipOrders.length}{" "}
                              Orders
                            </Badge>
                          </div>
                        </Paper>

                        <ReservationsList
                          reservations={
                            activeTab === "to-pay"
                              ? toPayOrders
                              : activeTab === "to-build"
                                ? toBuildOrders
                                : toShipOrders
                          }
                          loading={reservations.loading}
                          onConfirm={({ id, order }) => {
                            const target = order || reservations.reservations.find((r) => r.id === id);
                            if (target) handleOrderCancelAction(target);
                          }}
                          emptyTitle={
                            activeTab === "to-pay"
                              ? "No Payments Due"
                              : activeTab === "to-build"
                                ? "No Builds in Queue"
                                : "No Items to Ship"
                          }
                          emptyDescription={
                            activeTab === "to-pay"
                              ? "Orders with failed or incomplete payments will appear here."
                              : activeTab === "to-build"
                                ? "Custom and prebuilt systems awaiting assembly will appear here."
                                : "Paid individual parts waiting for dispatch will appear here."
                          }
                        />
                      </div>
                    )}

                    {/* TAB: Orders shipped or out for delivery */}
                    {activeTab === "to-receive" && isRegularUser && (
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
                                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <span>To Receive</span>
                                <CompactInfo message="Track shipped orders, courier transit, and estimated arrival dates." />
                              </Title>
                            </div>
                            <Badge size="md" variant="light" color="blue" className="font-mono font-bold">
                              {toReceiveCount} To Receive
                            </Badge>
                          </div>
                        </Paper>

                        {/* Customer's real reservation orders currently out for delivery */}
                        {toReceiveReservationOrders.length > 0 && (
                          <ReservationsList
                            reservations={toReceiveReservationOrders}
                            loading={reservations.loading}
                            onConfirm={({ id, order }) => {
                              const target = order || reservations.reservations.find((r) => r.id === id);
                              if (target) handleOrderCancelAction(target);
                            }}
                            emptyTitle="Nothing to Receive Yet"
                            emptyDescription="Shipped orders and items currently out for delivery will appear here."
                          />
                        )}

                        {/* Fallback to ReservationsList empty state if no mock orders and not in ecommerce UI mode */}
                        {!isEcommerceMode && toReceiveReservationOrders.length === 0 && (
                          <ReservationsList
                            reservations={toReceiveReservationOrders}
                            loading={reservations.loading}
                            onConfirm={({ id, order }) => {
                              const target = order || reservations.reservations.find((r) => r.id === id);
                              if (target) handleOrderCancelAction(target);
                            }}
                            emptyTitle="Nothing to Receive Yet"
                            emptyDescription="Shipped orders and items currently out for delivery will appear here."
                          />
                        )}

                        {/* Mock orders & UI tracker (in UI mode) */}
                        {isEcommerceMode && (
                          <MockOrdersSection
                            reservations={reservations.reservations}
                            onCancelReservation={reservations.handleCancelReservation}
                            receiveQueueOnly
                            hideEmptyState={toReceiveReservationOrders.length > 0}
                          />
                        )}
                      </div>
                    )}

                    {/* TAB: Delivered order archive */}
                    {activeTab === "completed" && isRegularUser && (
                      <div className="space-y-6">
                        <Paper
                          withBorder
                          radius="lg"
                          p={12}
                          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5">
                              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                              <span>Completed</span>
                              <CompactInfo message="Review orders that have been successfully delivered." />
                            </Title>
                            <Badge size="md" variant="light" color="teal" className="font-mono font-bold">
                              {completedReservationOrders.length} Completed
                            </Badge>
                          </div>
                        </Paper>

                        <ReservationsList
                          reservations={completedReservationOrders}
                          loading={reservations.loading}
                          onConfirm={({ id, order }) => {
                            const target = order || reservations.reservations.find((r) => r.id === id);
                            if (target) handleOrderCancelAction(target);
                          }}
                          emptyTitle="No Completed Orders"
                          emptyDescription="Delivered orders will appear here for your records."
                        />
                      </div>
                    )}

                    {/* TAB: Cancelled Orders */}
                    {activeTab === "cancelled" && isRegularUser && (
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
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span>Cancelled Orders</span>
                                <CompactInfo message="Archive of cancelled or voided reservations and orders." />
                              </Title>
                              <Text size="xs" c="dimmed" mt={2}>
                                Orders and reservations that have been voided or cancelled by customer request.
                              </Text>
                            </div>
                            <Badge size="md" variant="light" color="red" className="font-mono font-bold">
                              {cancelledOrders.length} {cancelledOrders.length === 1 ? "Cancelled Order" : "Cancelled Orders"}
                            </Badge>
                          </div>
                        </Paper>

                        <ReservationsList
                          reservations={cancelledOrders}
                          loading={reservations.loading}
                          onConfirm={({ id, order }) => {
                            const target = order || reservations.reservations.find((r) => r.id === id);
                            if (target) handleOrderCancelAction(target);
                          }}
                          emptyTitle="No Cancelled Orders"
                          emptyDescription="You have no cancelled orders or reservations. All your active purchases can be found under Orders."
                          emptyIcon={<XCircle size={32} />}
                          emptyThemeColor="red"
                        />
                      </div>
                    )}

                    {/* TAB: Saved Rigs & Builds (Regular Customers Only) */}
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

                    {/* TAB: Activity Logs (Regular Customers Only) */}
                    {activeTab === "activity" && isRegularUser && (
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
                                <History className="h-5 w-5 text-indigo-500" />
                                <span>Activity Logs</span>
                                <CompactInfo message="Review your account audit trails, profile updates, and authentication history." />
                              </Title>
                            </div>
                            <Badge size="md" variant="light" color="indigo" className="font-mono font-bold">
                              {userAudit.logs.length} Logged Events
                            </Badge>
                          </div>
                        </Paper>

                        <UserAuditLogsSection
                          logs={userAudit.logs}
                          loading={userAudit.loading}
                        />
                      </div>
                    )}

                    {/* TAB: System Safeguards (Super Admin Only) */}
                    {activeTab === "safeguards" && isSuperAdmin && (
                      <div className="space-y-6">
                        <EmergencyControlsCard emergency={emergency} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>
          </main>
        </div>

        {/* Cancellation Confirmation / Staff Review Dialog */}
        <Modal
          opened={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          title={
            cancelModalOrder && requiresStaffCancellation(cancelModalOrder) ? (
              <Group gap="xs">
                <ThemeIcon size="md" color="orange" variant="light" radius="md">
                  <AlertCircle size={16} />
                </ThemeIcon>
                <Text fw={700} className="font-headline text-base uppercase tracking-tight text-slate-900 dark:text-white">
                  Order Cannot Be Cancelled Directly
                </Text>
              </Group>
            ) : (
              <Group gap="xs">
                <ThemeIcon size="md" color="red" variant="light" radius="md">
                  <XCircle size={16} />
                </ThemeIcon>
                <Text fw={700} className="font-headline text-base uppercase tracking-tight text-slate-900 dark:text-white">
                  Confirm Order Cancellation
                </Text>
              </Group>
            )
          }
          centered
          radius="lg"
          size={cancelModalOrder && requiresStaffCancellation(cancelModalOrder) ? "md" : "sm"}
          overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
          classNames={{
            content: "overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#141a23]/95 dark:text-slate-100",
            header: "border-b border-slate-200/80 bg-white/95 p-3 dark:border-white/10 dark:bg-[#141a23]/95",
            body: "!p-4",
            close: "text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white",
          }}
        >
          {cancelModalOrder && (
            (() => {
              const displayOrderNum =
                cancelModalOrder.orderNumber ||
                cancelModalOrder.id.substring(0, 8).toUpperCase();
              const isStaffRequired = requiresStaffCancellation(cancelModalOrder);

              if (isStaffRequired) {
                return (
                  <Stack gap="md" className="pt-1">
                    <Text size="sm" className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Orders currently in <strong className="text-slate-900 dark:text-slate-100">To Build</strong> (assembly &amp; testing) or <strong className="text-slate-900 dark:text-slate-100">To Receive</strong> (in transit) cannot be cancelled directly anymore once fulfillment operations have started.
                    </Text>

                    <Alert
                      color="orange"
                      variant="light"
                      radius="md"
                      icon={<AlertCircle size={18} />}
                      title={`Order #${displayOrderNum}`}
                    >
                      <Text size="xs" className="leading-relaxed">
                        To request cancellation for this order, you need to contact our store management or admin team first. Clicking below will redirect you to our Contact Support page with your cancellation request and order reference pre-filled.
                      </Text>
                    </Alert>

                    <Group justify="flex-end" gap="xs" pt="xs">
                      <Button
                        variant="default"
                        size="sm"
                        radius="md"
                        onClick={() => setCancelModalOrder(null)}
                        className="min-h-11 border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        Keep Order
                      </Button>
                      <Button
                        color="cyan"
                        size="sm"
                        radius="md"
                        rightSection={<ArrowRight size={14} />}
                        className="min-h-11 text-xs font-bold uppercase tracking-wider"
                        onClick={() => {
                          setCancelModalOrder(null);
                          router.push(
                            `/contact?subject=${encodeURIComponent(
                              `Cancellation Request for Order #${displayOrderNum}`
                            )}&order=${encodeURIComponent(displayOrderNum)}`
                          );
                        }}
                      >
                        Contact Admin / Manager
                      </Button>
                    </Group>
                  </Stack>
                );
              }

              return (
                <Stack gap="md" className="pt-1">
                  <Text size="sm" className="leading-relaxed text-slate-600 dark:text-slate-300">
                    Are you sure you want to cancel Order #
                    <strong className="text-slate-900 dark:text-slate-100">
                      {displayOrderNum}
                    </strong>
                    ? Reserved components for this order will be returned to store inventory.
                  </Text>

                  <Group justify="flex-end" gap="xs" pt="xs">
                    <Button
                      variant="default"
                      size="sm"
                      radius="md"
                      onClick={() => setCancelModalOrder(null)}
                      className="min-h-11 border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      Keep Order
                    </Button>
                    <Button
                      color="red"
                      size="sm"
                      radius="md"
                      className="min-h-11 text-xs font-bold uppercase tracking-wider"
                      onClick={async () => {
                        await reservations.handleCancelReservation(cancelModalOrder.id);
                        setCancelModalOrder(null);
                      }}
                    >
                      Cancel Order
                    </Button>
                  </Group>
                </Stack>
              );
            })()
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
