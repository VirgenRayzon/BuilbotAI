'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
} from 'lucide-react';
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
} from '@mantine/core';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { useUserProfile } from '@/context/user-profile';
import { SystemNotification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const firestore = useFirestore();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);

  const notificationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'system_notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: notifications, loading } = useCollection<SystemNotification>(notificationsQuery);

  const unreadCount = useMemo(() => {
    if (!notifications || !profile) return 0;
    return notifications.filter((n) => !n.readBy.includes(profile.id)).length;
  }, [notifications, profile]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore || !profile) return;
    const notificationRef = doc(firestore, 'system_notifications', notificationId);
    await updateDoc(notificationRef, {
      readBy: arrayUnion(profile.id),
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !profile || !notifications) return;
    const unreadNotifications = notifications.filter((n) => !n.readBy.includes(profile.id));
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach((n) => {
      const ref = doc(firestore, 'system_notifications', n.id);
      batch.update(ref, {
        readBy: arrayUnion(profile!.id),
      });
    });
    await batch.commit();
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    setSelectedNotification(notification);
    if (!notification.readBy.includes(profile?.id || '')) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'reservation_received':
        return (
          <ThemeIcon size="md" radius="md" color="teal" variant="light">
            <ShieldCheck size={16} />
          </ThemeIcon>
        );
      case 'item_archived':
        return (
          <ThemeIcon size="md" radius="md" color="orange" variant="light">
            <Archive size={16} />
          </ThemeIcon>
        );
      case 'status_changed':
        return (
          <ThemeIcon size="md" radius="md" color="blue" variant="light">
            <History size={16} />
          </ThemeIcon>
        );
      case 'stock_added':
        return (
          <ThemeIcon size="md" radius="md" color="cyan" variant="light">
            <PackageCheck size={16} />
          </ThemeIcon>
        );
      case 'user_cancelled':
        return (
          <ThemeIcon size="md" radius="md" color="red" variant="light">
            <X size={16} />
          </ThemeIcon>
        );
      default:
        return (
          <ThemeIcon size="md" radius="md" color="indigo" variant="light">
            <Info size={16} />
          </ThemeIcon>
        );
    }
  };

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
            aria-label="Staff System Alerts"
            onClick={() => setPopoverOpened((o) => !o)}
            className="relative hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {unreadCount > 0 ? (
              <>
                <Bell size={18} className="text-cyan-600 dark:text-cyan-400" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#111722]">
                  {unreadCount > 9 ? '9+' : unreadCount}
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
                System Alerts
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
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold uppercase tracking-wider h-6 px-2"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Alerts List */}
          <ScrollArea.Autosize mah={380} type="scroll" offsetScrollbars>
            {loading ? (
              <div className="flex items-center justify-center h-28">
                <Text size="xs" c="dimmed" className="animate-pulse">
                  Scanning system alerts...
                </Text>
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {notifications.map((notification) => {
                  const isUnread = !notification.readBy.includes(profile?.id || '');
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-3.5 px-4 transition-colors relative group cursor-pointer flex gap-3 items-start',
                        isUnread
                          ? 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] hover:bg-cyan-500/[0.08]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Text
                            size="xs"
                            fw={isUnread ? 700 : 600}
                            truncate
                            className={cn(
                              isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
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
                          <Text size="10px" c="dimmed" fw={600} className="tracking-tight">
                            {notification.createdAt
                              ? formatDistanceToNow(
                                  notification.createdAt instanceof Date
                                    ? notification.createdAt
                                    : notification.createdAt.toDate(),
                                  { addSuffix: true }
                                )
                              : 'just now'}
                          </Text>

                          {isUnread && (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="xs"
                              radius="sm"
                              title="Mark as read"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check size={12} />
                            </ActionIcon>
                          )}
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
                  No alerts recorded
                </Text>
              </div>
            )}
          </ScrollArea.Autosize>

          {/* Footer View Audit Log */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Button
              variant="subtle"
              color="indigo"
              size="xs"
              fullWidth
              leftSection={<History size={14} />}
              onClick={() => {
                setPopoverOpened(false);
                router.push('/profile?tab=audit');
              }}
              className="font-bold text-xs uppercase tracking-wider h-8"
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
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {selectedNotification?.title}
              </Text>
              <Text size="10px" c="dimmed" className="uppercase tracking-wider font-semibold">
                System Alert Details
              </Text>
            </div>
          </Group>
        }
        classNames={{
          content: 'bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl',
          header: 'bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-5 py-3.5',
          body: '!p-5',
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
                  : 'just now'}
              </Text>
            </Group>

            <Badge size="xs" variant="outline" color="gray" className="font-mono">
              ID: {selectedNotification?.id.substring(0, 8)}
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
                router.push('/profile?tab=audit');
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
