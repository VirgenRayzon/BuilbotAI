'use client';

import { CopyButton, ActionIcon, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { Check, Copy } from 'lucide-react';
import { skuPrefix } from '@/lib/product-identity';
import type { Part, PrebuiltSystem } from '@/lib/types';
import Link from 'next/link';
import { productAdminUrl } from '@/lib/product-identity';

export function ProductIdentification({ category, product, showLink = true, compact = false }: { category: string; product?: Part | PrebuiltSystem; showLink?: boolean; compact?: boolean }) {
  const fields = [
    { label: 'Product ID', value: product?.productId, pending: product ? 'Pending migration' : 'Assigned automatically on save' },
    { label: 'SKU', value: product?.sku, pending: product ? 'Pending migration' : `${category ? skuPrefix(category) : 'SKU-'}…` },
  ];
  return <Paper withBorder radius="lg" p="sm" className="border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#141a23]/90">
    <Stack gap={compact ? 4 : 'xs'}>
      <Text size="xs" fw={700}>Product identification</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={compact ? 'xs' : 'md'} verticalSpacing={compact ? 0 : 'md'}>
        {fields.map(field => <Stack gap={2} key={field.label}>
          <Text size="xs" c="dimmed">{field.label}</Text>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" ff={field.value ? 'monospace' : undefined}>{field.value || field.pending}</Text>
            {field.value && <CopyButton value={field.value}>{({ copied, copy }) => <ActionIcon variant="transparent" color="cyan" onClick={copy} aria-label={`Copy ${field.label}`} size={44}>{copied ? <Check size={16}/> : <Copy size={16}/>}</ActionIcon>}</CopyButton>}
          </Group>
        </Stack>)}
      </SimpleGrid>
      {!product && <Text size="xs" c="dimmed">QR available after saving. Identifiers are assigned automatically.</Text>}
      {showLink && product?.productId && <Text component={Link} href={productAdminUrl('components' in product ? 'prebuilt' : 'part', product.productId)} size="sm" className="inline-flex min-h-11 items-center text-blue-700 dark:text-blue-300">View item & QR</Text>}
    </Stack>
  </Paper>;
}
