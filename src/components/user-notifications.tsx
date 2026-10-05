
"use client";

import { useState, useMemo } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Bell, BellRing, Check, Trash2, Clock, Package, CheckCheck } from "lucide-react";
import {
  Popover,
  ActionIcon,
  Button,
  Badge,
  Text,
  Group,
  Stack,
  ThemeIcon,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { OrderDetailsModal } from "./order-details-modal";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UserNotifications() {
  const { authUser, loading } = useUserProfile();
  const firestore = useFirestore();
  const [popoverOpened, setPopoverOpened] = useState(false);
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
        width={360}
        position="bottom-end"
        withArrow={false}
        shadow="xl"
        radius="lg"
        withinPortal
      >
        <Popover.Target>
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
              <>
                <BellRing size={18} className="text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#111722]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            ) : (
              <Bell size={18} className="text-slate-600 dark:text-slate-400" />
            )}
          </ActionIcon>
        </Popover.Target>

        <Popover.Dropdown className="p-0 bg-white/95 dark:bg-[#111722]/95 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 px-4 border-b border-slate-100 dark:border-white/10">
            <Group gap="xs">
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-white">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Badge size="xs" variant="filled" color="cyan" className="font-bold">
                  {unreadCount} new
                </Badge>
              )}
            </Group>

            {unreadCount > 0 && (
              <Button
                variant="subtle"
                color="cyan"
                size="compact-xs"
                leftSection={<CheckCheck size={13} />}
                onClick={markAllAsRead}
                className="text-[10px] font-bold uppercase tracking-wider h-6 px-2"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications Scroll Area */}
          <ScrollArea.Autosize mah={360} type="scroll" offsetScrollbars>
            {notificationsLoading ? (
              <div className="flex items-center justify-center h-28">
                <Text size="xs" c="dimmed" className="animate-pulse">
                  Loading updates...
                </Text>
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {notifications.map((notification) => {
                  const isCancelled = notification.title?.toLowerCase().includes("cancelled");
                  const isUnread = !notification.read;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-3.5 px-4 transition-colors relative group cursor-pointer flex gap-3 items-start",
                        isUnread
                          ? "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] hover:bg-cyan-500/[0.08]"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <ThemeIcon
                        size="md"
                        radius="md"
                        color={isCancelled ? "red" : "cyan"}
                        variant="light"
                        className="mt-0.5 shrink-0"
                      >
                        {isCancelled ? <Trash2 size={16} /> : <Package size={16} />}
                      </ThemeIcon>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Text
                            size="xs"
                            fw={isUnread ? 700 : 600}
                            truncate
                            className={cn(
                              isUnread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {notification.title}
                          </Text>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-cyan-500 flex-shrink-0" />
                          )}
                        </div>

                        <Text
                          size="xs"
                          c="dimmed"
                          className="line-clamp-2 leading-relaxed text-[11px]"
                        >
                          {notification.message}
                        </Text>

                        <div className="flex items-center justify-between pt-1">
                          <Group gap={4}>
                            <Clock size={11} className="text-slate-400" />
                            <Text size="10px" c="dimmed" fw={600} className="tracking-tight">
                              {notification.createdAt
                                ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                                : "Just now"}
                            </Text>
                          </Group>

                          <Group gap={4} className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                              >
                                <Check size={12} />
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
                            >
                              <Trash2 size={12} />
                            </ActionIcon>
                          </Group>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 space-y-2 opacity-50 p-4">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <Bell size={20} />
                </ThemeIcon>
                <Text size="xs" fw={700} className="uppercase tracking-widest text-slate-500">
                  No notifications yet
                </Text>
              </div>
            )}
          </ScrollArea.Autosize>

          {/* Footer Link */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Button
              component={Link}
              href="/profile?tab=reservations"
              variant="subtle"
              color="cyan"
              size="xs"
              fullWidth
              leftSection={<Package size={14} />}
              onClick={() => setPopoverOpened(false)}
              className="font-bold text-xs uppercase tracking-wider h-8"
            >
              View All Reservations
            </Button>
          </div>
        </Popover.Dropdown>
      </Popover>

      <OrderDetailsModal
        orderId={selectedOrderId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </>
  );
}
