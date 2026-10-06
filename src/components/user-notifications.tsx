"use client";

import { useState, useMemo, useCallback } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import {
  Bell,
  BellRing,
  Check,
  Trash2,
  Package,
  CheckCheck,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Popover,
  ActionIcon,
  Button,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { OrderDetailsModal } from "./order-details-modal";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ── Web Audio Feedback ── */
let _userAudioCtx: AudioContext | null = null;
function playSoftTick() {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    if (!_userAudioCtx) _userAudioCtx = new AudioCtxClass();
    if (_userAudioCtx.state === "suspended") {
      _userAudioCtx.resume();
    }
    const buf = _userAudioCtx.createBuffer(1, Math.floor(_userAudioCtx.sampleRate * 0.003), _userAudioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 4;
    }
    const src = _userAudioCtx.createBufferSource();
    src.buffer = buf;
    const g = _userAudioCtx.createGain();
    g.gain.value = 0.06;
    src.connect(g).connect(_userAudioCtx.destination);
    src.start();
  } catch {
    /* silent on browser audio policy restrictions */
  }
}

/* ── Categories ── */
const USER_CATEGORIES = ["All", "Orders", "Updates", "Alerts"] as const;
type UserCategoryType = (typeof USER_CATEGORIES)[number];

export function UserNotifications() {
  const { authUser, loading } = useUserProfile();
  const firestore = useFirestore();
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [activeCategory, setActiveCategory] = useState<UserCategoryType>("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const notificationsQuery = useMemo(() => {
    if (!firestore || !authUser) return null;
    return query(
      collection(firestore, "users", authUser.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(30)
    );
  }, [firestore, authUser]);

  const { data: rawNotifications, loading: notificationsLoading } = useCollection<Notification>(notificationsQuery);

  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return [...rawNotifications].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawNotifications]);

  const unreadCount = useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  const getCategoryForNotification = useCallback((n: Notification): UserCategoryType => {
    const titleLower = n.title?.toLowerCase() || "";
    const msgLower = n.message?.toLowerCase() || "";

    if (n.orderId || titleLower.includes("reservation") || titleLower.includes("build") || titleLower.includes("order")) {
      return "Orders";
    }
    if (titleLower.includes("warning") || titleLower.includes("cancelled") || titleLower.includes("alert") || msgLower.includes("alert")) {
      return "Alerts";
    }
    return "Updates";
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<UserCategoryType, number> = {
      All: notifications.length,
      Orders: 0,
      Updates: 0,
      Alerts: 0,
    };
    notifications.forEach((n) => {
      const cat = getCategoryForNotification(n);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [notifications, getCategoryForNotification]);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "All") return notifications;
    return notifications.filter((n) => getCategoryForNotification(n) === activeCategory);
  }, [notifications, activeCategory, getCategoryForNotification]);

  const handleCategoryChange = (cat: UserCategoryType) => {
    if (cat === activeCategory) return;
    playSoftTick();
    setActiveCategory(cat);
  };

  const markAsRead = async (id: string) => {
    if (!firestore || !authUser) return;
    try {
      await updateDoc(doc(firestore, "users", authUser.uid, "notifications", id), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.orderId) {
      setSelectedOrderId(notification.orderId);
      setDetailsModalOpen(true);
      setPopoverOpened(false);
    }
  };

  const markAllAsRead = async () => {
    if (!firestore || !authUser || !notifications) return;
    try {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) return;

      const batch = writeBatch(firestore);
      unread.forEach((n) => {
        batch.update(doc(firestore, "users", authUser.uid, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!firestore || !authUser) return;
    try {
      await deleteDoc(doc(firestore, "users", authUser.uid, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  if (!authUser || loading) return null;

  return (
    <>
      <Popover
        opened={popoverOpened}
        onChange={setPopoverOpened}
        width={460}
        position="bottom-end"
        withArrow={false}
        shadow="xl"
        radius="lg"
        withinPortal
      >
        <Popover.Target>
          <div className="relative inline-flex items-center justify-center">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="md"
              aria-label="User notifications"
              onClick={() => setPopoverOpened((o) => !o)}
              className="relative hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              {unreadCount > 0 ? (
                <BellRing size={18} className="text-cyan-600 dark:text-cyan-400 animate-pulse" />
              ) : (
                <Bell size={18} className="text-slate-600 dark:text-slate-400" />
              )}
            </ActionIcon>
            {unreadCount > 0 && (
              <span className="pointer-events-none absolute -top-1 -right-1 z-20 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-[#0c121e]">
                {unreadCount}
              </span>
            )}
          </div>
        </Popover.Target>

        <Popover.Dropdown className="p-0 bg-white/95 dark:bg-[#111722]/95 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden w-[460px] max-w-[95vw]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="subtle"
                color="cyan"
                size="compact-xs"
                leftSection={<CheckCheck size={12} />}
                onClick={markAllAsRead}
                className="text-[10px] font-semibold uppercase tracking-wider h-6 px-2 hover:bg-cyan-500/10"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Spring Pill Filter Bar (Rauno Freiberg craft inspired) */}
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-1.5 py-0.5">
              {USER_CATEGORIES.map((cat) => {
                const isActive = cat === activeCategory;
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "relative h-7 px-2.5 rounded-full text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors flex items-center gap-1.5 focus:outline-none select-none z-10",
                      isActive
                        ? "text-white dark:text-slate-900 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill-user"
                        className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white shadow-sm -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span>{cat}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "text-[9px] px-1 py-0.2 rounded-full font-bold",
                          isActive
                            ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                            : "bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications Scroll Area with Staggered Transition */}
          <div className="max-h-[340px] overflow-y-auto">
            {notificationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Text size="xs" c="dimmed" className="animate-pulse">
                  Loading updates...
                </Text>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredNotifications.map((notification, index) => {
                    const isCancelled = notification.title?.toLowerCase().includes("cancelled");
                    const isUnread = !notification.read;
                    const isHovered = hoveredId === notification.id;

                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{
                          delay: index * 0.02,
                          type: "spring",
                          stiffness: 450,
                          damping: 32,
                        }}
                        onMouseEnter={() => setHoveredId(notification.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "px-4 py-3 cursor-pointer transition-colors relative flex gap-3 items-start select-none group",
                          isUnread
                            ? "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]"
                            : "bg-transparent",
                          isHovered && "bg-slate-100/70 dark:bg-white/[0.04]"
                        )}
                      >
                        <ThemeIcon
                          size="sm"
                          radius="md"
                          color={isCancelled ? "red" : "cyan"}
                          variant="light"
                          className="mt-0.5 shrink-0"
                        >
                          {isCancelled ? <Trash2 size={14} /> : <Package size={14} />}
                        </ThemeIcon>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium truncate transition-colors",
                                isUnread
                                  ? "text-slate-900 dark:text-white font-semibold"
                                  : isHovered
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-700 dark:text-slate-300"
                              )}
                            >
                              {notification.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                              {notification.createdAt
                                ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: false })
                                : "now"}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                              {getCategoryForNotification(notification)}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUnread && (
                                <ActionIcon
                                  variant="subtle"
                                  color="cyan"
                                  size="xs"
                                  radius="sm"
                                  title="Mark as read"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="h-5 w-5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                                >
                                  <Check size={11} />
                                </ActionIcon>
                              )}
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="xs"
                                radius="sm"
                                title="Delete notification"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="h-5 w-5 text-rose-500 hover:bg-rose-500/10"
                              >
                                <Trash2 size={11} />
                              </ActionIcon>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2.5">
                  <SlidersHorizontal size={16} className="text-slate-400" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No {activeCategory === "All" ? "" : activeCategory.toLowerCase()} notifications
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  You are all caught up!
                </span>
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Button
              component={Link}
              href="/profile?tab=reservations"
              variant="subtle"
              color="cyan"
              size="xs"
              fullWidth
              leftSection={<Package size={13} />}
              onClick={() => setPopoverOpened(false)}
              className="font-semibold text-xs tracking-wide h-8 hover:bg-cyan-500/10"
            >
              View Your Reservations
            </Button>
          </div>
        </Popover.Dropdown>
      </Popover>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          open={detailsModalOpen}
          onOpenChange={(open) => {
            setDetailsModalOpen(open);
            if (!open) setSelectedOrderId(null);
          }}
        />
      )}
    </>
  );
}

export default UserNotifications;
