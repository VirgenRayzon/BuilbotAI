'use client';

import { Paper, Table, Text } from '@mantine/core';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogCardSkeleton } from './catalog-card-skeleton';

export function BuilderTableHeader() {
  return <Table.Thead className="bg-slate-50/50 dark:bg-white/[0.02]"><Table.Tr>
    <Table.Th className="w-16">Item</Table.Th><Table.Th>Component</Table.Th>
    <Table.Th>Category</Table.Th><Table.Th>Brand</Table.Th><Table.Th className="text-right">Price</Table.Th>
    <Table.Th className="w-24 text-center">Status</Table.Th><Table.Th className="w-32 text-right">Action</Table.Th>
  </Table.Tr></Table.Thead>;
}

export function InventoryLoading({ view, count, gridClassName }: { view: 'grid' | 'list'; count: number; gridClassName: string }) {
  if (view === 'grid') return <div className={gridClassName} aria-label="Loading components" aria-busy="true">
    {Array.from({length: count}, (_, index) => <CatalogCardSkeleton key={index} />)}
  </div>;
  return <Paper withBorder radius="lg" aria-label="Loading components" aria-busy="true"
    className="overflow-hidden bg-white/70 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10">
    <Table verticalSpacing="sm" horizontalSpacing="md">
      <BuilderTableHeader />
      <Table.Tbody>{Array.from({length: count}, (_, index) => <Table.Tr key={index} aria-hidden="true">
        <Table.Td><Skeleton className="h-10 w-10" /></Table.Td>
        <Table.Td><Skeleton><Text size="sm">Component name</Text><Text size="xs">SKU: component</Text></Skeleton></Table.Td>
        {Array.from({length:5}, (_, cell) => <Table.Td key={cell}><Skeleton><Text size="sm">Loading</Text></Skeleton></Table.Td>)}
      </Table.Tr>)}</Table.Tbody>
    </Table>
  </Paper>;
}
