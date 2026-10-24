'use client';

import { ActionIcon, Modal, Text, Tooltip } from '@mantine/core';
import { QrCode } from 'lucide-react';
import { useState } from 'react';
import { ProductQR } from '@/components/product-qr';

export function CatalogQRButton({ token, sku, productName, size = 36 }: {
  token: string;
  sku: string;
  productName: string;
  size?: number;
}) {
  const [opened, setOpened] = useState(false);

  if (!token || !sku) return null;

  return (
    <>
      <Tooltip label="View QR code" withArrow>
        <ActionIcon
          size={size}
          radius="md"
          variant="transparent"
          color="cyan"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpened(true);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`View QR code for ${productName}`}
          className="shrink-0"
        >
          <QrCode size={size <= 28 ? 16 : 18} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <div>
            <Text size="xs" c="dimmed">Product QR code</Text>
            <Text size="sm" fw={700} lineClamp={1}>{productName}</Text>
          </div>
        }
        centered
        radius="lg"
        size="xs"
        zIndex={200000}
        trapFocus
        lockScroll
        closeOnClickOutside={false}
        overlayProps={{ backgroundOpacity: 0.65, blur: 5, className: 'pointer-events-auto' }}
        classNames={{
          content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-lg',
          header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
          body: '!p-3',
        }}
      >
        <ProductQR token={token} sku={sku} />
      </Modal>
    </>
  );
}
