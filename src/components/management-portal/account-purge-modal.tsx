'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type {
  AccountInspectionDetails,
  ManagedAccountSummary,
} from '@/lib/management-portal-types';

interface AccountPurgeModalProps {
  opened: boolean;
  target: ManagedAccountSummary | null;
  preview: AccountInspectionDetails | null;
  previewLoading: boolean;
  purging: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AccountPurgeModal({
  opened,
  target,
  preview,
  previewLoading,
  purging,
  onClose,
  onConfirm,
}: AccountPurgeModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (opened) {
      setConfirmText('');
    }
  }, [opened, target?.id]);

  if (!target) return null;

  const trimmedInput = confirmText.trim();
  const matchesPurge = trimmedInput.toUpperCase() === 'PURGE';
  const matchesEmail =
    Boolean(target.email) &&
    trimmedInput.toLowerCase() === target.email.toLowerCase();
  const isConfirmed = matchesPurge || matchesEmail;

  const orderCount = preview?.account.orderCount ?? target.orderCount;
  const activeOrderCount =
    preview?.account.activeOrderCount ?? target.activeOrderCount;
  const inquiryCount = preview?.account.inquiryCount ?? target.inquiryCount;
  const messageCount = preview?.messageCount ?? 0;
  const favoritesCount = preview?.favoritesCount ?? 0;
  const notificationsCount = preview?.notificationsCount ?? 0;
  const auditLogsCount = preview?.userAuditLogCount ?? 0;
  const keyRequestsCount = preview?.keyRequestCount ?? 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      radius="lg"
      centered
      closeOnClickOutside={!purging}
      closeOnEscape={!purging}
      title={
        <Group gap="xs">
          <AlertTriangle className="size-4 text-red-500" />
          <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-white">
            Permanent Account Purge
          </Text>
        </Group>
      }
      classNames={{
        content: 'bg-white dark:bg-[#111722] border border-red-200 dark:border-red-500/30',
        header: 'p-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]',
        body: '!p-3 bg-white dark:bg-[#111722]',
      }}
    >
      <Stack gap="sm">
        <Alert color="red" variant="light" radius="md" className="p-3">
          <Text size="xs" className="text-red-800 dark:text-red-200 leading-relaxed">
            This action is <strong>irreversible</strong>. It permanently deletes the Firebase Auth
            user, Firestore profile, saved builds, orders, support messages, notifications, and
            activity logs. Active pending/building orders will automatically restore reserved
            inventory stock before deletion.
          </Text>
        </Alert>

        <Paper
          withBorder
          radius="md"
          className="p-3 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#141a23]/80"
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <div className="min-w-0">
              <Text fw={700} size="sm" className="text-slate-900 dark:text-white truncate">
                {target.name}
              </Text>
              <Text size="xs" className="text-slate-600 dark:text-slate-400 truncate">
                {target.email || target.id}
              </Text>
            </div>
            <Badge
              size="xs"
              variant="light"
              color={target.role === 'manager' ? 'cyan' : 'blue'}
              className="uppercase tracking-wider"
            >
              {target.role === 'manager' ? 'Store Manager' : 'Customer'}
            </Badge>
          </Group>
        </Paper>

        <Paper
          withBorder
          radius="md"
          className="p-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]/50"
        >
          <Text
            size="xs"
            fw={700}
            className="uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2"
          >
            Data Scheduled for Deletion
          </Text>

          {previewLoading ? (
            <Stack gap={6}>
              <Skeleton height={14} width="80%" />
              <Skeleton height={14} width="65%" />
              <Skeleton height={14} width="70%" />
            </Stack>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex justify-between gap-2">
                <span>Orders &amp; Subcollections (activity/assembly)</span>
                <span className="font-mono font-bold">
                  {orderCount}
                  {activeOrderCount > 0 ? ` (${activeOrderCount} will restore stock)` : ''}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Support Inquiries &amp; Messages</span>
                <span className="font-mono font-bold">
                  {inquiryCount} thread(s) · {messageCount} msg(s)
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Saved Builds (Favorites)</span>
                <span className="font-mono font-bold">{favoritesCount}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Notifications, Key Requests &amp; User Logs</span>
                <span className="font-mono font-bold">
                  {notificationsCount + keyRequestsCount + auditLogsCount}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Firebase Auth &amp; User Profile Document</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  {target.hasAuthAccount ? 'Auth + Profile' : 'Profile Only'}
                </span>
              </li>
            </ul>
          )}
        </Paper>

        <div>
          <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300 mb-1.5">
            Type{' '}
            <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono">
              PURGE
            </code>{' '}
            {target.email ? (
              <>
                or{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono">
                  {target.email}
                </code>{' '}
              </>
            ) : null}
            to confirm:
          </Text>
          <TextInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={target.email ? `Type PURGE or ${target.email}` : 'Type PURGE'}
            disabled={purging}
            radius="md"
            classNames={{
              input:
                'h-11 bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono text-xs',
            }}
          />
        </div>

        <Group justify="flex-end" gap="xs" pt="xs">
          <Button
            variant="default"
            radius="md"
            onClick={onClose}
            disabled={purging}
            className="h-11 px-4 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
          >
            Cancel
          </Button>
          <Button
            color="red"
            radius="md"
            loading={purging}
            disabled={!isConfirmed || purging}
            onClick={onConfirm}
            leftSection={<Trash2 className="size-3.5" />}
            className="h-11 px-4 font-headline font-bold text-xs uppercase tracking-wider"
          >
            Purge All User Data
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

