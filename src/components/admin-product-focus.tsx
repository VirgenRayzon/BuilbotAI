'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';
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
  const params = useSearchParams();
  const productId = params.get('product');
  if (!productId) return null;
  const part = parts.find(p => p.productId === productId);
  const system = systems.find(p => p.productId === productId);
  const product = part || system;
  return <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} mb="md" className="border-blue-300 bg-white/85 text-slate-900 shadow-sm dark:border-blue-500/40 dark:bg-[#141a23]/90 dark:text-slate-100"><Stack gap="md">
    <Group justify="space-between"><div><Text size="xs" c="dimmed">Selected inventory item</Text><Title order={2} size="h3">{product?.name || (loading ? 'Loading item…' : 'Item not found')}</Title></div><Button component={Link} href={`/admin?tab=${params.get('tab') || 'stock'}`} variant="subtle" mih={44}>Close item</Button></Group>
    {product && <Grid><Grid.Col span={{ base: 12, sm: 8 }}><Stack gap="md">{product.isArchived && <Badge color="yellow">Archived</Badge>}<ProductIdentification category={part?.category || 'PC'} product={product} showLink={false}/>
      <Group>{part && <AddPartDialog initialData={part} onSave={data => updatePart(part.id, part.category, data)}><Button mih={44}>Edit part</Button></AddPartDialog>}
        {system && <AddPrebuiltDialog initialData={system} parts={parts} onSave={data => updateSystem(system.id, data)}><Button mih={44}>Edit system</Button></AddPrebuiltDialog>}
        {!product.isArchived && <Button component={Link} href={productUrl(part ? 'part' : 'prebuilt', productId)} variant="default" mih={44}>View product page</Button>}
        {system && <Button component={Link} href={`/pre-builts/${system.id}?from=admin`} variant="default" mih={44}>Performance analysis</Button>}
      </Group></Stack></Grid.Col><Grid.Col span={{ base: 12, sm: 4 }}><ProductQR token={product.qrToken} sku={product.sku}/></Grid.Col></Grid>}
  </Stack></Paper>;
}
