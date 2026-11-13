'use client';

import {
  Avatar,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import {
  Ban,
  CheckCircle2,
  Copy,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  AccountInspectionDetails,
  ManagedAccountSummary,
} from '@/lib/management-portal-types';

interface AccountInspectorModalProps {
  opened: boolean;
  target: ManagedAccountSummary | null;
  details: AccountInspectionDetails | null;
  loading: boolean;
  actionLoadingId: string | null;
  onClose: () => void;
  onResetKey: (account: ManagedAccountSummary) => void;
  onToggleRole: (account: ManagedAccountSummary) => void;
  onToggleSuspension: (account: ManagedAccountSummary) => void;
  onRevokeSessions: (account: ManagedAccountSummary) => void;
  onRequestPurge: (account: ManagedAccountSummary) => void;
}

function formatPhp(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never / Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-PH');
}

export function AccountInspectorModal({
  opened,
  target,
  details,
  loading,
  actionLoadingId,
  onClose,
  onResetKey,
  onToggleRole,
  onToggleSuspension,
  onRevokeSessions,
  onRequestPurge,
}: AccountInspectorModalProps) {
  const { toast } = useToast();
  const activeAccount = details?.account ?? target;
  const isBusy = Boolean(activeAccount && actionLoadingId === activeAccount.id);

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} Copied`, description: value });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius="lg"
      centered
      title={
        <div className="flex items-center gap-2">
          <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-white">
            Account Inspector
          </Text>
          {activeAccount && (
            <Badge
              size="xs"
              variant="light"
              color={activeAccount.role === 'manager' ? 'cyan' : 'blue'}
              className="uppercase tracking-wider"
            >
              {activeAccount.role === 'manager' ? 'Store Manager' : 'Customer'}
            </Badge>
          )}
        </div>
      }
      classNames={{
        content: 'bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10',
        header: 'p-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]',
        body: '!p-3 bg-white dark:bg-[#111722]',
      }}
    >
      {loading || !details || !activeAccount ? (
        <Stack gap="sm">
          <Skeleton height={64} radius="md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
          </div>
          <Skeleton height={120} radius="md" />
        </Stack>
      ) : (
        <Stack gap="sm">
          {/* Identity Card */}
          <Paper
            withBorder
            radius="md"
            className="p-3 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#141a23]/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Group gap="sm" wrap="nowrap" className="min-w-0">
                <Avatar
                  src={activeAccount.photoURL}
                  size={48}
                  radius="md"
                  color={activeAccount.role === 'manager' ? 'cyan' : 'blue'}
                >
                  {activeAccount.name.slice(0, 2).toUpperCase()}
                </Avatar>
                <div className="min-w-0">
                  <Group gap="xs" wrap="wrap">
                    <Text fw={700} size="sm" className="text-slate-900 dark:text-white truncate">
                      {activeAccount.name}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={activeAccount.disabled ? 'red' : 'teal'}
                    >
                      {activeAccount.disabled ? 'Suspended' : 'Active'}
                    </Badge>
                  </Group>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400 truncate">
                    {activeAccount.email || 'No email on record'}
                  </Text>
                  <button
                    type="button"
                    onClick={() => copyText(activeAccount.id, 'User ID')}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mt-0.5"
                  >
                    <span>UID: {activeAccount.id}</span>
                    <Copy className="size-3" />
                  </button>
                </div>
              </Group>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Joined:</span>{' '}
                {formatDateTime(activeAccount.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Last Sign-In:</span>{' '}
                {formatDateTime(activeAccount.lastSignInTime)}
              </div>
              {details.phoneOrAddress && (
                <div className="sm:col-span-2 flex items-start gap-1.5">
                  <MapPin className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    {details.phoneOrAddress} ({details.savedAddressCount} saved address
                    {details.savedAddressCount === 1 ? '' : 'es'})
                  </span>
                </div>
              )}
            </div>
          </Paper>

          {/* Data & Activity Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Paper
              withBorder
              radius="md"
              className="p-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]/60"
            >
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Total Orders
              </Text>
              <Text fw={800} size="lg" className="text-slate-900 dark:text-white">
                {activeAccount.orderCount}
              </Text>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                {activeAccount.activeOrderCount} active · {details.cancelledOrderCount} cancelled
              </Text>
            </Paper>

            <Paper
              withBorder
              radius="md"
              className="p-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]/60"
            >
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Lifetime Spend
              </Text>
              <Text fw={800} size="lg" className="font-mono text-cyan-700 dark:text-cyan-400">
                {formatPhp(activeAccount.totalSpentPhp)}
              </Text>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                {details.completedOrderCount} fulfilled
              </Text>
            </Paper>

            <Paper
              withBorder
              radius="md"
              className="p-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]/60 col-span-2 sm:col-span-1"
            >
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Messages & Saved Data
              </Text>
              <Text fw={800} size="lg" className="text-slate-900 dark:text-white">
                {activeAccount.inquiryCount} Threads
              </Text>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                {details.messageCount} msgs · {details.favoritesCount} builds ·{' '}
                {details.notificationsCount} alerts
              </Text>
            </Paper>
          </div>

          {/* Manager Keys Section */}
          {activeAccount.role === 'manager' && (
            <Paper
              withBorder
              radius="md"
              className="p-3 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#141a23]/80"
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <KeyRound className="size-4 text-cyan-500" />
                  <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Manager Access Keys
                  </Text>
                </Group>
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  loading={isBusy}
                  onClick={() => onResetKey(activeAccount)}
                  leftSection={<RefreshCw className="size-3 text-cyan-500" />}
                  className="h-9"
                >
                  Reset Key
                </Button>
              </Group>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Active:</span>
                <button
                  type="button"
                  onClick={() =>
                    activeAccount.activeManagerKey &&
                    copyText(activeAccount.activeManagerKey, 'Manager Key')
                  }
                  className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/20"
                >
                  <span>{activeAccount.activeManagerKey || 'Legacy / None'}</span>
                  {activeAccount.activeManagerKey && <Copy className="size-3" />}
                </button>
              </div>

              {activeAccount.deprecatedKeys.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Deprecated:</span>
                  {activeAccount.deprecatedKeys.map((k, idx) => (
                    <code
                      key={`${k}-${idx}`}
                      className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-600 dark:text-slate-300"
                    >
                      {k}
                    </code>
                  ))}
                </div>
              )}
            </Paper>
          )}

          {/* Recent Orders */}
          <Paper
            withBorder
            radius="md"
            className="p-3 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#141a23]/80"
          >
            <Group gap="xs" mb="xs">
              <Package className="size-4 text-slate-500" />
              <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Recent Orders ({details.recentOrders.length})
              </Text>
            </Group>

            {details.recentOrders.length === 0 ? (
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                This account has no orders on record.
              </Text>
            ) : (
              <Stack gap={6}>
                {details.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">
                        {order.itemCount} item(s) · {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge size="xs" variant="light" color="gray">
                        {order.status}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="light"
                        color={order.paymentStatus === 'paid' ? 'teal' : 'yellow'}
                      >
                        {order.paymentStatus}
                      </Badge>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatPhp(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Footer Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <Group gap="xs" wrap="wrap">
              <Button
                size="xs"
                variant="default"
                radius="md"
                loading={isBusy}
                onClick={() => onToggleRole(activeAccount)}
                className="h-11 px-3 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
              >
                {activeAccount.role === 'manager'
                  ? 'Demote to Customer'
                  : 'Promote to Manager'}
              </Button>
              {activeAccount.hasAuthAccount && (
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  loading={isBusy}
                  onClick={() => onToggleSuspension(activeAccount)}
                  leftSection={
                    activeAccount.disabled ? (
                      <CheckCircle2 className="size-3.5 text-teal-500" />
                    ) : (
                      <Ban className="size-3.5 text-orange-500" />
                    )
                  }
                  className="h-11 px-3 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
                >
                  {activeAccount.disabled ? 'Restore Access' : 'Suspend'}
                </Button>
              )}
              {activeAccount.hasAuthAccount && (
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  loading={isBusy}
                  onClick={() => onRevokeSessions(activeAccount)}
                  leftSection={<LogOut className="size-3.5" />}
                  className="h-11 px-3 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
                >
                  Revoke Sessions
                </Button>
              )}
            </Group>

            <Button
              size="xs"
              color="red"
              radius="md"
              disabled={isBusy}
              onClick={() => onRequestPurge(activeAccount)}
              leftSection={<Trash2 className="size-3.5" />}
              className="h-11 px-3 font-headline font-bold uppercase tracking-wider"
            >
              Purge Account
            </Button>
          </div>
        </Stack>
      )}
    </Modal>
  );
}

