'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ActionIcon, Badge, Modal, Stack, Text, Title, Tooltip } from '@mantine/core';
import { BarChart3, Edit3, ExternalLink } from 'lucide-react';
import type { Part, PrebuiltSystem } from '@/lib/types';
import type { AddPartFormSchema } from '@/hooks/use-part-form';
import type { AddPrebuiltFormSchema } from './add-prebuilt-dialog';
import { AddPartDialog } from './add-part-dialog';
import { AddPrebuiltDialog } from './add-prebuilt-dialog';
import { ProductIdentification } from './product-identification';
import { ProductQR } from './product-qr';
import { productUrl } from '@/lib/product-identity';

export function AdminProductFocus({ parts, systems, loading, updatePart, updateSystem }: {
  parts: Part[]; systems: PrebuiltSystem[]; loading: boolean;
  updatePart: (id: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
  updateSystem: (id: string, data: AddPrebuiltFormSchema) => Promise<void>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const productId = params.get('product');

  const part = parts.find(p => p.productId === productId);
  const system = systems.find(p => p.productId === productId);
  const product = part || system;

  const handleClose = () => {
    const tab = params.get('tab') || 'stock';
    router.push(`/admin?tab=${tab}`);
  };

  return (
    <Modal
      opened={Boolean(productId)}
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
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      classNames={{
        content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-4',
      }}
    >
      {product && (
        <Stack gap="md" align="center" className="w-full">
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
                {part && (
                  <AddPartDialog initialData={part} onSave={data => updatePart(part.id, part.category, data)}>
                    <Tooltip label="Edit part details" withArrow position="bottom">
                      <ActionIcon
                        size={42}
                        radius="md"
                        variant="default"
                        className="border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-colors shadow-sm"
                        aria-label="Edit part"
                      >
                        <Edit3 size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </AddPartDialog>
                )}

                {system && (
                  <AddPrebuiltDialog initialData={system} parts={parts} onSave={data => updateSystem(system.id, data)}>
                    <Tooltip label="Edit system details" withArrow position="bottom">
                      <ActionIcon
                        size={42}
                        radius="md"
                        variant="default"
                        className="border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-colors shadow-sm"
                        aria-label="Edit system"
                      >
                        <Edit3 size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </AddPrebuiltDialog>
                )}

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
            <ProductIdentification category={part?.category || 'PC'} product={product} showLink={false} />
          </div>
        </Stack>
      )}
    </Modal>
  );
}
