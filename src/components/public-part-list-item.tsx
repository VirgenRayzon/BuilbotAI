'use client';

import Link from 'next/link';
import { Badge, Button, Group, Paper, Text } from '@mantine/core';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { CatalogQRButton } from '@/components/catalog-qr-button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import { cn, formatCurrency } from '@/lib/utils';

export function PublicPartListItem({
  product,
  detailHref,
  priority,
  isEcommerceMode,
  onQuickAdd,
}: {
  product: PublicCatalogPart;
  detailHref: string;
  priority: boolean;
  isEcommerceMode: boolean;
  onQuickAdd: () => void;
}) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={12}
      className={cn(
        'overflow-hidden border-slate-200/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-[#111722]',
        !product.inStock && 'opacity-60 grayscale'
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={detailHref}
          aria-label={`View ${product.name}`}
          className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg border border-slate-200/70 bg-pure-white sm:h-24 sm:w-32 dark:border-white/10"
        >
          <OptimizedImage
            src={product.imageUrl || '/placeholder-part.png'}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) calc(100vw - 56px), 128px"
            className="object-contain p-2"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Group gap="xs" mb={4}>
            <Badge size="xs" variant="light" color="gray">{product.brand || product.category}</Badge>
            <Badge size="xs" variant="light" color={product.inStock ? 'teal' : 'red'}>{product.inStock ? 'Available' : 'Out of stock'}</Badge>
          </Group>
          <Text fw={650} lineClamp={2}>{product.name}</Text>
          <Text size="xs" c="dimmed" ff="monospace" className="break-all">{product.sku}</Text>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:items-end">
          <Group justify="space-between" gap="xs" wrap="nowrap" className="w-full sm:w-auto">
            <Text fw={700} className="min-w-0 font-mono text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</Text>
            <CatalogQRButton token={product.qrToken} sku={product.sku} productName={product.name} size={44} />
          </Group>

          <div className={cn('flex w-full min-w-0 gap-2 sm:w-auto', isEcommerceMode && product.inStock && 'flex-col min-[420px]:flex-row')}>
            <Button
              component={Link}
              href={detailHref}
              fullWidth
              radius="md"
              size="sm"
              variant="light"
              color="cyan"
              rightSection={<ArrowRight size={15} />}
              className="min-h-11 min-w-0 whitespace-nowrap sm:w-auto"
            >
              View product
            </Button>
            {isEcommerceMode && product.inStock && (
              <Button
                fullWidth
                radius="md"
                size="sm"
                variant="filled"
                color="teal"
                leftSection={<ShoppingCart size={15} />}
                onClick={onQuickAdd}
                className="min-h-11 min-w-0 whitespace-nowrap sm:w-auto"
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </Paper>
  );
}
