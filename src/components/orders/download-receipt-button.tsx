'use client';

import { useState } from 'react';
import { Button } from '@mantine/core';
import { Download } from 'lucide-react';
import type { Order } from '@/lib/types';
import {
  createOrderReceiptPdf,
  getOrderReceiptFilename,
} from '@/lib/order-receipt-pdf';
import { useToast } from '@/hooks/use-toast';

interface DownloadReceiptButtonProps {
  order: Order;
}

export function DownloadReceiptButton({ order }: DownloadReceiptButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const bytes = await createOrderReceiptPdf(order);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = getOrderReceiptFilename(order);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      toast({
        title: 'Receipt download failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      size="xs"
      radius="md"
      color="cyan"
      variant="light"
      leftSection={<Download size={14} />}
      loading={downloading}
      onClick={handleDownload}
      className="min-h-11 shrink-0 whitespace-nowrap font-bold uppercase tracking-wider text-[10px]"
      aria-label={`Download receipt for order ${order.orderNumber || order.id}`}
    >
      Download Receipt
    </Button>
  );
}
