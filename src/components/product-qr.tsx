'use client';

import { useState } from 'react';
import { ActionIcon, Badge, CopyButton, Group, Stack, Text, Tooltip } from '@mantine/core';
import { Check, Copy, Download, RefreshCcw, Settings2 } from 'lucide-react';
import { useProductQR } from '@/hooks/use-product-qr';
import { useQRStatus } from '@/hooks/use-qr-status';
import { AdminQRLifecycleModal } from './admin-qr-lifecycle-modal';

export function ProductQR({
  token,
  sku,
  showLifecycle = false,
  extraActions,
}: {
  token?: string;
  sku?: string;
  showLifecycle?: boolean;
  extraActions?: React.ReactNode;
}) {
  const { image, url, error, retry } = useProductQR(token, sku);
  const { status } = useQRStatus(showLifecycle ? token : undefined);
  const [modalOpened, setModalOpened] = useState(false);

  if (!token || !sku) return <Text size="sm" c="dimmed">QR pending migration.</Text>;

  const isEnabled = status?.enabled ?? true;
  const qrSize = showLifecycle ? 260 : 180;

  return (
    <Stack gap="xs" align="center" className="w-full">
      {showLifecycle && (
        <Badge size="xs" color={isEnabled ? 'teal' : 'red'} variant="light">
          {isEnabled ? 'Active QR' : 'Disabled QR'}
        </Badge>
      )}

      {image && (
        <div className="relative p-2.5 rounded-xl bg-white shadow-md border border-slate-200 dark:border-white/10 flex items-center justify-center">
          <img
            src={image}
            width={qrSize}
            height={qrSize}
            alt={`QR for ${sku}`}
            className={`h-auto w-[min(260px,70vw)] rounded-lg ${!showLifecycle ? 'max-w-[180px]' : ''} ${!isEnabled ? 'opacity-40 grayscale' : ''}`}
          />
        </div>
      )}

      {!image && !error && (
        <div className={`${showLifecycle ? 'h-[260px] w-[min(260px,70vw)]' : 'h-[180px] w-[180px]'} rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center`}>
          <Text size="sm" c="dimmed" role="status">Preparing QR…</Text>
        </div>
      )}

      {error && (
        <Group gap="xs">
          <Text c="red" size="xs" role="alert">{error}</Text>
          <ActionIcon size="sm" variant="subtle" color="red" onClick={retry} title="Retry QR generation">
            <RefreshCcw size={14} />
          </ActionIcon>
        </Group>
      )}

      {!isEnabled && (
        <Text size="xs" c="red" fw={500}>
          This QR code is currently disabled.
        </Text>
      )}

      {/* Centered Action Toolbar: Pen button, Small Download button, Copy Link, etc. */}
      <Group gap="xs" justify="center" wrap="wrap" mt="xs">
        {extraActions}

        {image ? (
          <Tooltip label="Download QR code" withArrow position="bottom">
            <ActionIcon
              component="a"
              href={image}
              download={`${sku}.png`}
              size={42}
              radius="md"
              color="cyan"
              variant="filled"
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
              aria-label="Download QR"
            >
              <Download size={18} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <ActionIcon size={42} radius="md" disabled variant="default">
            <Download size={18} />
          </ActionIcon>
        )}

        {url && (
          <CopyButton value={url}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied link!' : 'Copy QR link'} withArrow position="bottom">
                <ActionIcon
                  size={42}
                  radius="md"
                  variant="default"
                  className="border-slate-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
                  onClick={copy}
                  aria-label="Copy QR link"
                >
                  {copied ? <Check size={18} className="text-teal-400" /> : <Copy size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}

        {showLifecycle && (
          <Tooltip label="Manage QR status" withArrow position="bottom">
            <ActionIcon
              size={42}
              radius="md"
              variant="default"
              className="border-slate-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
              onClick={() => setModalOpened(true)}
              aria-label="Manage QR status"
            >
              <Settings2 size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {showLifecycle && (
        <AdminQRLifecycleModal
          token={token}
          sku={sku}
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
        />
      )}
    </Stack>
  );
}
