'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Container, Grid, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import type { PublicProduct } from '@/lib/public-product-types';
import { productAdminUrl } from '@/lib/product-identity';
import { formatCurrency } from '@/lib/utils';
import { usePublicProductActions } from '@/hooks/use-public-product-actions';

export function PublicProductPage({ product }: { product: PublicProduct }) {
  const [selected, setSelected] = useState(0);
  const actions = usePublicProductActions(product);
  const surface = 'border-slate-200 bg-white/85 text-slate-900 shadow-sm dark:border-white/10 dark:bg-[#141a23]/90 dark:text-slate-100';
  return <Container size="xl" py="lg"><Stack gap="md">
    <Button component={Link} href={product.kind === 'part' ? '/parts' : '/pre-builts'} variant="subtle" w="fit-content" mih={44}>← Back to {product.kind === 'part' ? 'parts' : 'prebuilts'}</Button>
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} className={surface}>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-[#111722]">
            {product.images[selected] ? <img src={product.images[selected]} alt={product.name} className="h-full w-full object-contain"/> : <Text c="dimmed">Image unavailable</Text>}
          </div>
          {product.images.length > 1 && <Group gap="xs" mt="sm">{product.images.map((src, index) => <button key={src + index} aria-label={`View image ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`h-16 w-16 overflow-hidden rounded-lg border p-1 ${selected === index ? 'border-blue-500' : 'border-slate-200 dark:border-white/10'}`}><img src={src} alt="" className="h-full w-full object-contain"/></button>)}</Group>}
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}><Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} className={`${surface} h-full`}><Stack gap="md">
        <Group><Badge variant="light">{product.category}</Badge><Badge color={product.inStock ? 'teal' : 'gray'}>{product.inStock ? 'Available' : 'Out of stock'}</Badge></Group>
        <div><Text c="dimmed" size="sm">{product.brand}</Text><Title order={1} size="h2">{product.name}</Title></div>
        <Stack gap={4}><Text size="sm" ff="monospace">Product ID: {product.productId}</Text><Text size="sm" ff="monospace">SKU: {product.sku}</Text></Stack>
        <Text size="32px" fw={750}>{formatCurrency(product.price)}</Text>
        <div className="prose prose-sm max-w-none text-slate-600 dark:prose-invert dark:text-slate-400"><ReactMarkdown>{product.description || 'Product description coming soon.'}</ReactMarkdown></div>
        {actions.isStaff ? <Button component={Link} href={productAdminUrl(product.kind, product.productId)} mih={44}>Manage in inventory</Button> : <>
          <Button onClick={actions.reserve} loading={actions.busy} disabled={!product.inStock || actions.loading} mih={44}>{actions.signedIn ? 'Reserve this item' : 'Sign in to reserve'}</Button>
          {product.kind === 'prebuilt' && <Button variant="default" onClick={actions.customize} disabled={actions.busy || actions.loading} mih={44}>Customize in Builder</Button>}
        </>}
        {actions.error && <Text role="alert" c="red">{actions.error}</Text>}
        <Text size="xs" c="dimmed">Availability is checked again when you reserve.</Text>
      </Stack></Paper></Grid.Col>
    </Grid>
    {Object.keys(product.specifications).length > 0 && <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} className={surface}><Stack gap="md"><Title order={2} size="h3">Specifications</Title><Table striped withRowBorders><Table.Tbody>{Object.entries(product.specifications).map(([key, value]) => <Table.Tr key={key}><Table.Th w="40%">{key}</Table.Th><Table.Td>{String(value)}</Table.Td></Table.Tr>)}</Table.Tbody></Table></Stack></Paper>}
    {product.components.length > 0 && <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} className={surface}><Stack gap="md"><Title order={2} size="h3">Included components</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>{product.components.map(part => <Paper key={part.key} withBorder p="sm" radius="lg" className={part.issue ? 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-[#211e18] dark:text-amber-100' : surface}>
        <Stack gap={4}><Text size="xs" c="dimmed">{part.category}</Text><Text fw={600}>{part.name}</Text>{part.issue && <Badge color="yellow">{part.issue === 'missing' ? 'Missing part' : 'Out of stock'}</Badge>}{part.productId && <Button component={Link} href={`/parts/${part.productId}`} variant="subtle" mih={44}>View part</Button>}</Stack>
      </Paper>)}</SimpleGrid>
    </Stack></Paper>}
    {product.highlights.length > 0 && <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} className={surface}><Stack gap="md"><Title order={2} size="h3">Performance highlights</Title><ul className="list-disc space-y-2 pl-5">{product.highlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul></Stack></Paper>}
  </Stack></Container>;
}
