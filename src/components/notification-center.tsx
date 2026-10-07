"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Archive,
  ShieldCheck,
  History,
  Info,
  X,
  PackageCheck,
  CheckCheck,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  Popover,
  Modal,
  Button,
  ActionIcon,
  Badge,
  Text,
  Group,
  Stack,
  ThemeIcon,
  ScrollArea,
  Paper,
  Divider,
} from "@mantine/core";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, writeBatch } from "firebase/firestore";
import { useUserProfile } from "@/context/user-profile";
import { SystemNotification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Web Audio Feedback ── */
let _audioCtx: AudioContext | null = null;
function playSoftTick() {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    if (!_audioCtx) _audioCtx = new AudioCtxClass();
    if (_audioCtx.state === "suspended") {
      _audioCtx.resume();
    }
    const buf = _audioCtx.createBuffer(1, Math.floor(_audioCtx.sampleRate * 0.003), _audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 4;
    }
    const src = _audioCtx.createBufferSource();
    src.buffer = buf;
    const g = _audioCtx.createGain();
    g.gain.value = 0.06;
    src.connect(g).connect(_audioCtx.destination);
    src.start();
  } catch {
    /* silent on browser restrictions */
  }
}

/* ── Categories ── */
const CATEGORIES = ["All", "Reservations", "Stock", "Status", "Archived"] as const;
type CategoryType = (typeof CATEGORIES)[number];

export function NotificationCenter() {
  const firestore = useFirestore();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);

  const notificationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "system_notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [firestore]);

  const { data: rawNotifications, loading } = useCollection<SystemNotification>(notificationsQuery);

  const notifications = useMemo(() => {
    return rawNotifications || [];
  }, [rawNotifications]);

  const unreadCount = useMemo(() => {
    if (!notifications || !profile) return 0;
    return notifications.filter((n) => !n.readBy?.includes(profile.id)).length;
  }, [notifications, profile]);

  const getCategoryForNotification = useCallback((n: SystemNotification): CategoryType => {
    switch (n.type) {
      case "reservation_received":
      case "user_cancelled":
        return "Reservations";
      case "stock_added":
        return "Stock";
      case "status_changed":
        return "Status";
      case "item_archived":
        return "Archived";
      default:
        return "Status";
    }
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      All: notifications.length,
      Reservations: 0,
      Stock: 0,
      Status: 0,
      Archived: 0,
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

  const handleCategoryChange = (cat: CategoryType) => {
    if (cat === activeCategory) return;
    playSoftTick();
    setActiveCategory(cat);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore || !profile) return;
    const notificationRef = doc(firestore, "system_notifications", notificationId);
    await updateDoc(notificationRef, {
      readBy: arrayUnion(profile.id),
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !profile || !notifications) return;
    const unreadNotifications = notifications.filter((n) => !n.readBy?.includes(profile.id));
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach((n) => {
      const ref = doc(firestore, "system_notifications", n.id);
      batch.update(ref, {
        readBy: arrayUnion(profile!.id),
      });
    });
    await batch.commit();
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    setSelectedNotification(notification);
    if (!notification.readBy?.includes(profile?.id || "")) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "reservation_received":
        return (
          <ThemeIcon size="sm" radius="md" color="teal" variant="light" className="shrink-0 mt-0.5">
            <ShieldCheck size={14} />
          </ThemeIcon>
        );
      case "item_archived":
        return (
          <ThemeIcon size="sm" radius="md" color="orange" variant="light" className="shrink-0 mt-0.5">
            <Archive size={14} />
          </ThemeIcon>
        );
      case "status_changed":
        return (
          <ThemeIcon size="sm" radius="md" color="blue" variant="light" className="shrink-0 mt-0.5">
            <History size={14} />
          </ThemeIcon>
        );
      case "stock_added":
        return (
          <ThemeIcon size="sm" radius="md" color="cyan" variant="light" className="shrink-0 mt-0.5">
            <PackageCheck size={14} />
          </ThemeIcon>
        );
      case "user_cancelled":
        return (
          <ThemeIcon size="sm" radius="md" color="red" variant="light" className="shrink-0 mt-0.5">
            <X size={14} />
          </ThemeIcon>
        );
      default:
        return (
          <ThemeIcon size="sm" radius="md" color="indigo" variant="light" className="shrink-0 mt-0.5">
            <Info size={14} />
          </ThemeIcon>
        );
    }
  };

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
              aria-label="Staff System Alerts"
              onClick={() => setPopoverOpened((o) => !o)}
              className="relative hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              {unreadCount > 0 ? (
                <Bell size={18} className="text-cyan-600 dark:text-cyan-400" />
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
                System Alerts
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
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-semibold uppercase tracking-wider h-6 px-2 hover:bg-cyan-500/10"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Spring Pill Filter Bar (Rauno Freiberg craft inspired) */}
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-1.5 py-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = cat === activeCategory;
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "relative h-7 px-2.5 rounded-full text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors flex items-center gap-1.5 focus:outline-none select-none z-10 shrink-0",
                      isActive
                        ? "text-white dark:text-slate-900 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill-system"
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

          {/* Alerts List with Staggered Transition */}
          <div className="max-h-[340px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Text size="xs" c="dimmed" className="animate-pulse">
                  Scanning system alerts...
                </Text>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredNotifications.map((notification, index) => {
                    const isUnread = !notification.readBy?.includes(profile?.id || "");
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
                          "px-4 py-3 cursor-pointer transition-colors relative flex gap-3 items-start select-none",
                          isUnread
                            ? "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]"
                            : "bg-transparent",
                          isHovered && "bg-slate-100/70 dark:bg-white/[0.04]"
                        )}
                      >
                        {getNotificationIcon(notification.type)}

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
                                ? formatDistanceToNow(
                                    notification.createdAt instanceof Date
                                      ? notification.createdAt
                                      : notification.createdAt.toDate(),
                                    { addSuffix: false }
                                  )
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

                            {isUnread && (
                              <ActionIcon
                                variant="subtle"
                                color="cyan"
                                size="xs"
                                radius="sm"
                                title="Mark as read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="h-5 w-5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                              >
                                <Check size={11} />
                              </ActionIcon>
                            )}
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
                  No {activeCategory === "All" ? "" : activeCategory.toLowerCase()} alerts
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Everything is up to date and in order.
                </span>
              </div>
            )}
          </div>

          {/* Footer View Audit Log */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Button
              variant="subtle"
              color="indigo"
              size="xs"
              fullWidth
              leftSection={<History size={13} />}
              onClick={() => {
                setPopoverOpened(false);
                router.push("/admin?tab=audit");
              }}
              className="font-semibold text-xs tracking-wide h-8 hover:bg-indigo-500/10"
            >
              View Full Audit Log
            </Button>
          </div>
        </Popover.Dropdown>
      </Popover>

      {/* Mantine Alert Details Modal */}
      <Modal
        opened={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        centered
        radius="lg"
        size="sm"
        title={
          <Group gap="xs">
            {selectedNotification && getNotificationIcon(selectedNotification.type)}
            <div>
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 tracking-tight">
                {selectedNotification?.title}
              </Text>
              <Text size="10px" c="dimmed" className="uppercase tracking-wider font-semibold">
                System Alert Details
              </Text>
            </div>
          </Group>
        }
        classNames={{
          content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl",
          header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-5 py-3.5",
          body: "!p-5",
        }}
      >
        <Stack gap="md">
          <Paper
            withBorder
            p="md"
            radius="md"
            className="bg-slate-50/70 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 relative overflow-hidden"
          >
            <Text size="sm" className="leading-relaxed text-slate-800 dark:text-slate-200">
              {selectedNotification?.message}
            </Text>
          </Paper>

          <Group justify="space-between" align="center" className="pt-1">
            <Group gap={6}>
              <History size={13} className="text-slate-400" />
              <Text size="xs" c="dimmed" fw={600}>
                {selectedNotification?.createdAt
                  ? formatDistanceToNow(
                      selectedNotification.createdAt instanceof Date
                        ? selectedNotification.createdAt
                        : selectedNotification.createdAt.toDate(),
                      { addSuffix: true }
                    )
                  : "just now"}
              </Text>
            </Group>

            <Badge size="xs" variant="outline" color="gray" className="font-mono">
              ID: {selectedNotification?.id?.substring(0, 8)}
            </Badge>
          </Group>

          <Divider className="border-slate-100 dark:border-white/10" />

          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              size="xs"
              radius="md"
              onClick={() => setSelectedNotification(null)}
              className="text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              color="indigo"
              size="xs"
              radius="md"
              leftSection={<History size={14} />}
              onClick={() => {
                setSelectedNotification(null);
                router.push("/admin?tab=audit");
              }}
              className="text-xs font-semibold shadow-sm shadow-indigo-500/20"
            >
              Open Audit Log
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export default NotificationCenter;
