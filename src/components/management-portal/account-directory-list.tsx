'use client';

import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Menu,
  Pagination,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  KeyRound,
  LogOut,
  MoreVertical,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ManagedAccountSummary } from '@/lib/management-portal-types';
import type { PortalViewMode } from '@/hooks/use-management-portal';

interface AccountDirectoryListProps {
  accounts: ManagedAccountSummary[];
  loading: boolean;
  viewMode: PortalViewMode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  actionLoadingId: string | null;
  onInspect: (account: ManagedAccountSummary) => void;
  onResetKey: (account: ManagedAccountSummary) => void;
  onToggleRole: (account: ManagedAccountSummary) => void;
  onToggleSuspension: (account: ManagedAccountSummary) => void;
  onRevokeSessions: (account: ManagedAccountSummary) => void;
  onPurge: (account: ManagedAccountSummary) => void;
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function AccountOverflowMenu({
  account,
  isBusy,
  disabled,
  onResetKey,
  onToggleRole,
  onToggleSuspension,
  onRevokeSessions,
}: {
  account: ManagedAccountSummary;
  isBusy: boolean;
  disabled: boolean;
  onResetKey: (account: ManagedAccountSummary) => void;
  onToggleRole: (account: ManagedAccountSummary) => void;
  onToggleSuspension: (account: ManagedAccountSummary) => void;
  onRevokeSessions: (account: ManagedAccountSummary) => void;
}) {
  const isManager = account.role === 'manager';
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="md"
          aria-label={`More actions for ${account.email || account.name}`}
          loading={isBusy}
          disabled={disabled}
          className="h-9 w-9 shrink-0 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <MoreVertical className="size-4" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]">
        <Menu.Label>Role &amp; Access</Menu.Label>
        {isManager && (
          <Menu.Item
            leftSection={<RefreshCw className="size-3.5 text-cyan-500" />}
            onClick={() => onResetKey(account)}
          >
            Reset Manager Key
          </Menu.Item>
        )}
        <Menu.Item
          leftSection={
            isManager ? (
              <ArrowDownCircle className="size-3.5 text-amber-500" />
            ) : (
              <ArrowUpCircle className="size-3.5 text-cyan-500" />
            )
          }
          onClick={() => onToggleRole(account)}
        >
          {isManager ? 'Demote to Customer' : 'Promote to Store Manager'}
        </Menu.Item>
        {account.hasAuthAccount && (
          <>
            <Menu.Divider />
            <Menu.Label>Security</Menu.Label>
            <Menu.Item
              leftSection={
                account.disabled ? (
                  <CheckCircle2 className="size-3.5 text-teal-500" />
                ) : (
                  <Ban className="size-3.5 text-orange-500" />
                )
              }
              onClick={() => onToggleSuspension(account)}
            >
              {account.disabled ? 'Restore Login Access' : 'Suspend Account'}
            </Menu.Item>
            <Menu.Item
              leftSection={<LogOut className="size-3.5 text-slate-500" />}
              onClick={() => onRevokeSessions(account)}
            >
              Force Sign-Out (Revoke Sessions)
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

export function AccountDirectoryList({
  accounts,
  loading,
  viewMode,
  page,
  totalPages,
  onPageChange,
  actionLoadingId,
  onInspect,
  onResetKey,
  onToggleRole,
  onToggleSuspension,
  onRevokeSessions,
  onPurge,
}: AccountDirectoryListProps) {
  const { toast } = useToast();

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} Copied`, description: value });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <Paper
            key={idx}
            withBorder
            radius="lg"
            className="p-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]"
          >
            <Stack gap="sm">
              <Group gap="sm">
                <Skeleton height={40} circle />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={14} width="60%" radius="sm" />
                  <Skeleton height={12} width="80%" radius="sm" />
                </div>
              </Group>
              <Skeleton height={44} radius="md" />
              <Skeleton height={34} radius="md" />
            </Stack>
          </Paper>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-[#141a23]/40">
        <Text size="sm" fw={600} className="text-slate-700 dark:text-slate-300">
          No matching accounts found
        </Text>
        <Text size="xs" className="text-slate-500 dark:text-slate-400 mt-1">
          Try clearing your search query or adjusting the Filters &amp; sort options.
        </Text>
      </div>
    );
  }

  return (
    <Stack gap="md">
      {viewMode === 'table' ? (
        <Paper
          withBorder
          radius="lg"
          className="overflow-hidden border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722]"
        >
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead className="bg-slate-50/80 dark:bg-white/[0.02]">
                <Table.Tr>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Role &amp; Status</Table.Th>
                  <Table.Th>Manager Key</Table.Th>
                  <Table.Th>Last Sign-In</Table.Th>
                  <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {accounts.map((acc) => {
                  const isManager = acc.role === 'manager';
                  const isBusy = actionLoadingId === acc.id;
                  return (
                    <Table.Tr key={acc.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar src={acc.photoURL} size={36} radius="md" color={isManager ? 'cyan' : 'blue'}>
                            {acc.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <div className="min-w-0">
                            <Text size="sm" fw={700} className="text-slate-900 dark:text-white truncate max-w-[220px]">
                              {acc.name}
                            </Text>
                            <Text size="xs" className="text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                              {acc.email || acc.id}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Badge size="xs" variant="light" color={isManager ? 'cyan' : 'blue'}>
                            {isManager ? 'Manager' : 'Customer'}
                          </Badge>
                          <Badge size="xs" variant="light" color={acc.disabled ? 'red' : 'teal'}>
                            {acc.disabled ? 'Suspended' : 'Active'}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {isManager ? (
                          <button
                            type="button"
                            onClick={() => acc.activeManagerKey && copyText(acc.activeManagerKey, 'Manager Key')}
                            className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded font-mono text-xs font-bold border border-cyan-500/20"
                          >
                            <span>{acc.activeManagerKey || 'Legacy'}</span>
                            {acc.activeManagerKey && <Copy className="size-3" />}
                          </button>
                        ) : (
                          <Text size="xs" c="dimmed">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" className="text-slate-600 dark:text-slate-400">
                          {formatDateShort(acc.lastSignInTime)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="default"
                            radius="md"
                            aria-label={`Inspect ${acc.email || acc.name}`}
                            onClick={() => onInspect(acc)}
                            disabled={Boolean(actionLoadingId)}
                            className="h-9 w-9 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
                          >
                            <Eye className="size-4" />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            radius="md"
                            aria-label={`Purge ${acc.email || acc.name}`}
                            onClick={() => onPurge(acc)}
                            disabled={Boolean(actionLoadingId)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="size-4" />
                          </ActionIcon>
                          <AccountOverflowMenu
                            account={acc}
                            isBusy={isBusy}
                            disabled={Boolean(actionLoadingId) && !isBusy}
                            onResetKey={onResetKey}
                            onToggleRole={onToggleRole}
                            onToggleSuspension={onToggleSuspension}
                            onRevokeSessions={onRevokeSessions}
                          />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {accounts.map((acc) => {
            const isManager = acc.role === 'manager';
            const isBusy = actionLoadingId === acc.id;
            const initials = acc.name
              .split(' ')
              .map((part) => part[0] || '')
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Paper
                key={acc.id}
                withBorder
                radius="lg"
                className="p-4 flex flex-col justify-between gap-3 border-slate-200 bg-white/85 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#111722]"
              >
                {/* Header: Avatar + Name/Email + Overflow Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={acc.photoURL} size={40} radius="md" color={isManager ? 'cyan' : 'blue'}>
                      {initials || 'U'}
                    </Avatar>
                    <div className="min-w-0">
                      <Text fw={700} size="sm" className="text-slate-900 dark:text-white truncate">
                        {acc.name}
                      </Text>
                      <Text size="xs" className="text-slate-600 dark:text-slate-400 truncate">
                        {acc.email || 'No email'}
                      </Text>
                    </div>
                  </div>
                  <AccountOverflowMenu
                    account={acc}
                    isBusy={isBusy}
                    disabled={Boolean(actionLoadingId) && !isBusy}
                    onResetKey={onResetKey}
                    onToggleRole={onToggleRole}
                    onToggleSuspension={onToggleSuspension}
                    onRevokeSessions={onRevokeSessions}
                  />
                </div>

                {/* Badges + UID / Manager Key */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <Group gap={6} wrap="wrap">
                    <Badge size="xs" variant="light" color={isManager ? 'cyan' : 'blue'}>
                      {isManager ? 'Manager' : 'Customer'}
                    </Badge>
                    <Badge size="xs" variant="light" color={acc.disabled ? 'red' : 'teal'}>
                      {acc.disabled ? 'Suspended' : 'Active'}
                    </Badge>
                  </Group>

                  {isManager ? (
                    <button
                      type="button"
                      onClick={() => acc.activeManagerKey && copyText(acc.activeManagerKey, 'Manager Key')}
                      disabled={!acc.activeManagerKey}
                      className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded font-mono text-[11px] font-bold border border-cyan-500/20"
                    >
                      <KeyRound className="size-3" />
                      <span>{acc.activeManagerKey || 'Legacy'}</span>
                      {acc.activeManagerKey && <Copy className="size-2.5" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyText(acc.id, 'User ID')}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                    >
                      <span>UID: {acc.id.slice(0, 8)}…</span>
                      <Copy className="size-2.5" />
                    </button>
                  )}
                </div>

                {/* Card Footer: Joined Date + Inspect / Purge */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
                  <Text size="xs" className="text-slate-500 dark:text-slate-400 truncate">
                    Joined {formatDateShort(acc.createdAt)}
                  </Text>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="default"
                      radius="md"
                      onClick={() => onInspect(acc)}
                      disabled={Boolean(actionLoadingId)}
                      leftSection={<Eye className="size-3.5" />}
                      className="h-9 px-2.5 border-slate-300 dark:border-white/10 bg-white dark:bg-[#141a23]"
                    >
                      Inspect
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      radius="md"
                      onClick={() => onPurge(acc)}
                      disabled={Boolean(actionLoadingId)}
                      leftSection={<Trash2 className="size-3.5" />}
                      className="h-9 px-2.5"
                    >
                      Purge
                    </Button>
                  </Group>
                </div>
              </Paper>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Group justify="center" pt="xs">
          <Pagination
            value={page}
            onChange={onPageChange}
            total={totalPages}
            color="cyan"
            radius="md"
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}
