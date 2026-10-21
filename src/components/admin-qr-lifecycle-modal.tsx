'use client';

import { useState } from 'react';
import { Badge, Button, Group, Modal, Paper, Stack, Text, Textarea } from '@mantine/core';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQRStatus } from '@/hooks/use-qr-status';

interface AdminQRLifecycleModalProps {
  token?: string;
  sku?: string;
  opened: boolean;
  onClose: () => void;
}

export function AdminQRLifecycleModal({ token, sku, opened, onClose }: AdminQRLifecycleModalProps) {
  const { status, loading, mutating, error, isSuperAdmin, mutateStatus } = useQRStatus(token);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  const isEnabled = status?.enabled ?? true;
  const targetAction = isEnabled ? 'DISABLE' : 'ENABLE';

  const handleConfirm = async () => {
    if (targetAction === 'DISABLE' && reason.trim().length < 3) {
      setActionError('Please provide a reason of at least 3 characters.');
      return;
    }
    setActionError('');
    const success = await mutateStatus(targetAction, reason.trim() || 'Status changed by admin');
    if (success) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage QR Code Lifecycle"
      centered
      radius="lg"
      size="md"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      classNames={{
        content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">SKU: {sku || 'Unknown'}</Text>
            <Text size="sm" fw={600}>Current QR Status</Text>
          </div>
          <Badge color={isEnabled ? 'teal' : 'red'} variant="light" size="lg">
            {isEnabled ? 'Active / Enabled' : 'Disabled'}
          </Badge>
        </Group>

        <Paper withBorder radius="md" p="sm" className="!p-3 bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
          <Group gap="xs" align="flex-start" wrap="nowrap">
            {isEnabled ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
            )}
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                {isEnabled ? 'Impact of Disabling' : 'Impact of Re-enabling'}
              </Text>
              <Text size="xs" c="dimmed">
                {isEnabled
                  ? 'Disabling this QR code prevents public customers from scanning or visiting the item page via this QR code. The resolver returns an unavailable status. All printed labels remain unchanged physically but will no longer resolve publicly. Staff can still access the item via Admin.'
                  : 'Re-enabling will immediately restore the public product destination for all physical labels and links with this QR code.'}
              </Text>
            </Stack>
          </Group>
        </Paper>

        {isSuperAdmin ? (
          <Stack gap="xs">
            <Textarea
              label="Audit Reason"
              placeholder={isEnabled ? 'Explain why this QR is being disabled (e.g. misprinted batch, recalled item, temporary pause)...' : 'Optional note for re-enabling...'}
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              minRows={2}
              required={isEnabled}
              description={isEnabled ? 'A clear reason is required and recorded in the audit log.' : 'Recorded in the audit log.'}
              classNames={{
                input: 'bg-white dark:bg-[#141a23] border-slate-300 dark:border-white/20 text-slate-900 dark:text-slate-100',
              }}
            />

            {(error || actionError) && (
              <Text size="xs" c="red" role="alert">
                {actionError || error}
              </Text>
            )}

            <Group justify="flex-end" gap="xs" mt="xs">
              <Button variant="default" onClick={onClose} disabled={mutating} mih={44}>
                Cancel
              </Button>
              <Button
                color={isEnabled ? 'red' : 'teal'}
                onClick={handleConfirm}
                loading={mutating}
                disabled={loading}
                mih={44}
              >
                {isEnabled ? 'Confirm & Disable QR' : 'Confirm & Enable QR'}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Paper withBorder radius="md" p="sm" className="!p-3 border-amber-300 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-950/20">
            <Text size="xs" c="amber">
              Manager accounts have view-only access to QR status. Only Super Admins can disable or re-enable product QR codes.
            </Text>
          </Paper>
        )}

        {status?.recentAudits && status.recentAudits.length > 0 && (
          <Stack gap="xs" mt="xs">
            <Group gap="xs">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <Text size="xs" fw={600} c="dimmed">Recent Lifecycle Audits</Text>
            </Group>
            {status.recentAudits.slice(0, 3).map((audit, idx) => (
              <Paper key={audit.id || idx} withBorder radius="sm" p="xs" className="!p-2 text-xs border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#111722]/50">
                <Group justify="space-between" mb={2}>
                  <Badge size="xs" color={audit.action === 'ENABLE' ? 'teal' : 'red'}>
                    {audit.action}
                  </Badge>
                  <Text size="xs" c="dimmed">{new Date(audit.timestamp).toLocaleDateString()} {new Date(audit.timestamp).toLocaleTimeString()}</Text>
                </Group>
                <Text size="xs" fw={500}>{audit.actorEmail || audit.actorId}</Text>
                <Text size="xs" c="dimmed" lineClamp={2}>{audit.reason}</Text>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
