'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ActionIcon, Badge, Modal, Stack, Text, Title, Tooltip } from '@mantine/core';
import { BarChart3, ExternalLink } from 'lucide-react';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { ProductIdentification } from './product-identification';
import { ProductQR } from './product-qr';
import { productUrl } from '@/lib/product-identity';
import { AddStockDialog } from './add-stock-dialog';

export function AdminProductFocus({ parts, systems, loading, addPartStock }: {
  parts: Part[]; systems: PrebuiltSystem[]; loading: boolean;
  addPartStock: (id: string, category: Part['category'], amount: number) => Promise<void>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const productId = params.get('product');
  const stockAction = params.get('action') === 'stock';

  const part = parts.find(p => p.productId === productId);
  const system = systems.find(p => p.productId === productId);
  const product = part || system;

  const handleClose = () => {
    const tab = params.get('tab') || 'stock';
    router.push(`/admin?tab=${tab}`);
  };

  return (
    <>
      <Modal
        opened={Boolean(productId) && !stockAction}
        onClose={handleClose}
        title={
          <div>
            <Text size="xs" c="dimmed">Selected inventory item</Text>
            <Title order={3} size="h4">{product?.name || (loading ? 'Loading item…' : 'Item not found')}</Title>
          </div>
        }
        centered
        radius="lg"
        size="md"
        zIndex={200000}
        trapFocus
        lockScroll
        closeOnClickOutside={false}
        overlayProps={{ backgroundOpacity: 0.65, blur: 5, className: 'pointer-events-auto' }}
        classNames={{
          content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
          header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
          body: '!p-3',
        }}
      >
        {product && (
          <Stack gap="sm" align="center" className="w-full">
            {product.isArchived && (
              <Badge color="yellow" variant="light">
                Archived Product
              </Badge>
            )}

            {/* Centered QR code with cyan pen edit button, small download, copy, and view buttons */}
            <ProductQR
              token={product.qrToken}
              sku={product.sku}
              showLifecycle
              extraActions={
                <>
                  {!product.isArchived && productId && (
                    <Tooltip label="View public product page" withArrow position="bottom">
                      <ActionIcon
                        component={Link}
                        href={productUrl(part ? 'part' : 'prebuilt', productId)}
                        target="_blank"
                        size={42}
                        radius="md"
                        variant="default"
                        className="border-slate-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
                        aria-label="View public page"
                      >
                        <ExternalLink size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}

                  {system && (
                    <Tooltip label="Performance analysis" withArrow position="bottom">
                      <ActionIcon
                        component={Link}
                        href={`/pre-builts/${system.id}?from=admin`}
                        size={42}
                        radius="md"
                        variant="default"
                        className="border-slate-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
                        aria-label="Performance analysis"
                      >
                        <BarChart3 size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </>
              }
            />

            {/* Product identification spanning full width below the QR code */}
            <div className="w-full">
              <ProductIdentification category={part?.category || 'PC'} product={product} showLink={false} compact />
            </div>
          </Stack>
        )}
      </Modal>

      {part && stockAction && (
        <AddStockDialog
          part={part}
          onAddStock={addPartStock}
          open
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}

    </>
  );
}
