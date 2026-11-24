'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Key,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { CompactInfo } from '@/components/ui/compact-info';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { ManagedAccountSummary } from '@/lib/management-portal-types';
import type { PendingKeyRequest } from '@/hooks/use-management-portal';

interface PortalTopControlsBarProps {
  counts: {
    total: number;
    active: number;
    managers: number;
    keyedManagers: number;
    customers: number;
    customersWithOrders: number;
    suspended: number;
    pendingRequests: number;
    totalOrders: number;
    totalSpendPhp: number;
    totalInquiries: number;
  };
  managerKey: string;
  onManagerKeyChange: (val: string) => void;
  originalManagerDocId: string | null;
  savingKey: boolean;
  keyLoading: boolean;
  onSaveDefaultKey: () => void;
  requests: PendingKeyRequest[];
  accounts: ManagedAccountSummary[];
  actionLoadingId: string | null;
  onApproveRequest: (req: PendingKeyRequest) => void;
  onRejectRequest: (reqId: string) => void;
}

export function PortalTopControlsBar({
  counts,
  managerKey,
  onManagerKeyChange,
  originalManagerDocId,
  savingKey,
  keyLoading,
  onSaveDefaultKey,
  requests,
  accounts,
  actionLoadingId,
  onApproveRequest,
  onRejectRequest,
}: PortalTopControlsBarProps) {
  const { toast } = useToast();
  const [requestsOpen, setRequestsOpen] = useState(requests.length > 0);

  const handleCopyDefaultKey = async () => {
    if (!managerKey.trim()) return;
    await navigator.clipboard.writeText(managerKey);
    toast({
      title: 'Access Key Copied',
      description: 'Default manager signup key copied to clipboard.',
    });
  };

  const kpiCards = [
    {
      title: 'Total Accounts',
      value: counts.total.toLocaleString('en-PH'),
      subtitle: `${counts.active} active`,
      color: 'blue',
      icon: <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
      delay: 0,
    },
    {
      title: 'Store Managers',
      value: counts.managers.toLocaleString('en-PH'),
      subtitle: `${counts.keyedManagers} active keys`,
      color: 'cyan',
      icon: <Key className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      delay: 0.08,
    },
    {
      title: 'Verified Customers',
      value: counts.customers.toLocaleString('en-PH'),
      subtitle: `${counts.customersWithOrders} with orders`,
      color: 'teal',
      icon: <UserCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      delay: 0.16,
    },
    {
      title: 'Suspended',
      value: counts.suspended.toLocaleString('en-PH'),
      subtitle: `${counts.pendingRequests} key requests`,
      color: 'orange',
      icon: <ShieldAlert className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
      delay: 0.24,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 4-Card KPI Row (matching Sales & Analytics) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: card.delay }}
          >
            <Paper
              withBorder
              radius="lg"
              p={{ base: 'md', sm: 'lg' }}
              className="border-slate-200 bg-white/85 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#111722]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <ThemeIcon size={40} radius="md" color={card.color} variant="light">
                  {card.icon}
                </ThemeIcon>
                <Badge size="xs" variant="light" color={card.color}>
                  {card.subtitle}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <h3 className="font-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value}
                </h3>
              </div>
            </Paper>
          </motion.div>
        ))}
      </div>

      {/* 3-Cell Recessed Summary Strip (matching Sales & Analytics) */}
      <Paper
        withBorder
        radius="lg"
        className="border-slate-200 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-[#111722]"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Package className="h-4 w-4 text-blue-500" />
              Account Orders
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {counts.totalOrders.toLocaleString('en-PH')}
            </Text>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Activity className="h-4 w-4 text-cyan-500" />
              Cumulative Spend
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {formatCurrency(counts.totalSpendPhp)}
            </Text>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Support Inquiries
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {counts.totalInquiries.toLocaleString('en-PH')}
            </Text>
          </div>
        </div>
      </Paper>

      {/* Access Key & Reset Requests Row (matching Sales Chart Cards) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Paper
          withBorder
          radius="lg"
          p={{ base: 'md', sm: 'lg' }}
          className="lg:col-span-5 border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722]"
        >
          <Stack gap="sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-cyan-500" />
                  <h4 className="font-headline text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Default Manager Key
                  </h4>
                  <CompactInfo
                    label="About the default manager access key"
                    message="Required during new Store Manager onboarding through System Access."
                  />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mt-0.5">
                  Staff onboarding credential
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <PasswordInput
                value={managerKey}
                onChange={(e) => onManagerKeyChange(e.target.value)}
                placeholder={keyLoading ? 'Loading key...' : 'Enter Manager Key'}
                disabled={keyLoading}
                radius="md"
                size="sm"
                className="flex-1"
                classNames={{
                  input:
                    'h-10 bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono',
                }}
              />
              <Group gap="xs" wrap="nowrap">
                <Button
                  variant="default"
                  radius="md"
                  onClick={handleCopyDefaultKey}
                  disabled={!managerKey.trim()}
                  className="h-10 px-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23] text-slate-700 dark:text-slate-200"
                  leftSection={<Copy className="size-3.5" />}
                >
                  Copy
                </Button>
                <Button
                  color="cyan"
                  radius="md"
                  loading={savingKey}
                  onClick={onSaveDefaultKey}
                  disabled={savingKey || keyLoading || managerKey === originalManagerDocId}
                  className="h-10 px-3.5 font-headline font-bold text-xs uppercase tracking-wider"
                >
                  Save
                </Button>
              </Group>
            </div>
          </Stack>
        </Paper>

        <Paper
          withBorder
          radius="lg"
          p={{ base: 'md', sm: 'lg' }}
          className="lg:col-span-7 border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722]"
        >
          <Stack gap="sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-cyan-500" />
                  <h4 className="font-headline text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Key Reset Requests
                  </h4>
                  <Badge
                    size="xs"
                    variant="light"
                    color={requests.length > 0 ? 'yellow' : 'gray'}
                    className="font-mono font-bold"
                  >
                    {requests.length} pending
                  </Badge>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mt-0.5">
                  Staff recovery queue
                </p>
              </div>
              <Button
                variant="subtle"
                size="xs"
                radius="md"
                onClick={() => setRequestsOpen((prev) => !prev)}
                rightSection={
                  requestsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                }
                className="h-8 text-slate-600 dark:text-slate-300"
              >
                {requestsOpen ? 'Hide' : 'Review'}
              </Button>
            </div>

            {!requestsOpen && (
              <div className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.02]">
                <Text size="xs" className="text-slate-600 dark:text-slate-400">
                  {requests.length === 0
                    ? 'No pending manager key reset requests.'
                    : `${requests.length} manager key reset request(s) awaiting approval.`}
                </Text>
              </div>
            )}

            <Collapse in={requestsOpen}>
              {requests.length === 0 ? (
                <div className="text-center py-3 border border-dashed rounded-md border-slate-200 dark:border-white/10">
                  <Text size="xs" className="text-slate-500 dark:text-slate-400">
                    All key reset requests have been processed.
                  </Text>
                </div>
              ) : (
                <Stack gap="xs" className="max-h-56 overflow-y-auto pr-1">
                  {requests.map((req) => {
                    const requester = accounts.find(
                      (a) => a.email.toLowerCase() === req.email.toLowerCase()
                    );
                    const isBusy = actionLoadingId === req.id;
                    return (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md border border-slate-200/70 bg-slate-50/80 dark:border-white/5 dark:bg-white/[0.02]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Mail className="size-3.5 text-slate-500 shrink-0" />
                            <Text size="xs" fw={700} className="text-slate-900 dark:text-white truncate">
                              {req.email}
                            </Text>
                            <Badge size="xs" variant="light" color={requester ? 'cyan' : 'yellow'}>
                              {requester ? 'Registered' : 'New'}
                            </Badge>
                          </div>
                          <Text size="xs" className="text-slate-500 dark:text-slate-400 mt-0.5">
                            {req.requestedAt?.toDate
                              ? req.requestedAt.toDate().toLocaleString()
                              : 'Just now'}
                          </Text>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            radius="md"
                            onClick={() => onRejectRequest(req.id)}
                            disabled={Boolean(actionLoadingId)}
                            leftSection={
                              isBusy ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <X className="size-3" />
                              )
                            }
                            className="h-9"
                          >
                            Reject
                          </Button>
                          <Button
                            size="xs"
                            color="teal"
                            radius="md"
                            onClick={() => onApproveRequest(req)}
                            disabled={Boolean(actionLoadingId)}
                            leftSection={
                              isBusy ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )
                            }
                            className="h-9"
                          >
                            Approve
                          </Button>
                        </Group>
                      </div>
                    );
                  })}
                </Stack>
              )}
            </Collapse>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
