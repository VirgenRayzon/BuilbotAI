'use client';

import Link from 'next/link';
import { ActionIcon, Badge, Box, Button, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CatalogQRButton } from '@/components/catalog-qr-button';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import { cn, formatCurrency } from '@/lib/utils';

export function PublicPartCard({ product, detailHref, priority, isEcommerceMode, onQuickAdd }: {
  product: PublicCatalogPart;
  detailHref: string;
  priority: boolean;
  isEcommerceMode: boolean;
  onQuickAdd: () => void;
}) {
  return (
    <Card withBorder radius="lg" padding={0} className={cn(
      'group flex h-full flex-col justify-between overflow-hidden border-slate-200/80 bg-white/85 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-white/10 dark:bg-[#111722] dark:hover:border-cyan-500/40',
      !product.inStock && 'opacity-60 grayscale'
    )}>
      <Stack gap={6} className="px-3 pb-2 pt-3">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Badge size="xs" variant="light" color="gray" radius="sm" className="uppercase tracking-wide">{product.brand || 'Component'}</Badge>
          <Badge size="xs" variant="light" color={product.inStock ? 'teal' : 'red'} radius="sm">{product.inStock ? 'Available' : 'Out of stock'}</Badge>
        </Group>
        <Text size="sm" fw={600} lineClamp={2} className="min-h-[2.5rem] leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{product.name}</Text>
      </Stack>
      <Link href={detailHref} aria-label={`View ${product.name}`}>
        <Box className="relative aspect-[4/3] w-full overflow-hidden border-y border-slate-200/70 bg-pure-white dark:border-white/10">
          <OptimizedImage src={product.imageUrl || '/placeholder-part.png'} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-contain p-2" />
        </Box>
      </Link>
      <Stack gap="xs" className="px-3 pb-3 pt-3">
        <Group justify="space-between" align="end" wrap="nowrap">
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="text-[10px] tracking-wider">Price</Text>
            <Text size="lg" fw={700} className="font-mono leading-none text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</Text>
          </Stack>
          <CatalogQRButton token={product.qrToken} sku={product.sku} productName={product.name} />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Button component={Link} href={detailHref} fullWidth radius="md" size="sm" variant="light" color="cyan" rightSection={<ArrowRight size={15} />} className="flex-1">View product</Button>
          {isEcommerceMode && product.inStock && (
            <Tooltip label="Add to Cart" withArrow>
              <ActionIcon size={36} radius="md" variant="filled" color="teal" onClick={onQuickAdd} aria-label={`Add ${product.name} to cart`} className="shrink-0">
                <ShoppingCart size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
