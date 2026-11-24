'use client';
import { ActionIcon, Badge, Button, Card, Group, Paper, Stack, Text } from '@mantine/core';
import { Card as InventoryCard } from '@/components/ui/card';
import { Badge as InventoryBadge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PrebuiltSpecsSkeleton } from './prebuilt-card-skeleton';

export const adminPartLayout = {
  body: 'p-2 md:p-3.5 pb-0 space-y-1.5 md:space-y-2.5 z-10 flex-grow flex flex-col',
  title: 'h-10 md:h-12 flex flex-col justify-center overflow-hidden',
  image: 'aspect-square relative -mx-2 md:-mx-3.5 w-auto overflow-hidden border-y p-2',
  specs: 'grid grid-cols-2 gap-x-2 gap-y-1 md:gap-x-3 md:gap-y-1.5 py-0.5',
  footer: 'mt-auto p-2 md:p-3 pt-0 z-20',
};

export function AdminPartSkeleton() {
  return <InventoryCard aria-hidden="true" className="flex h-full flex-col justify-between overflow-hidden border-primary/10 bg-background/40 shadow-lg">
    <div className={adminPartLayout.body}>
      <div className="flex justify-between items-start gap-2"><div className="space-y-0.5 flex-grow">
        <Skeleton><p className="text-[8px] md:text-[10px] uppercase tracking-widest font-bold">Brand</p></Skeleton>
        <div className={adminPartLayout.title}><Skeleton><p className="text-xs md:text-base leading-snug">Component name</p></Skeleton></div>
      </div></div>
      <div className={`${adminPartLayout.image} bg-pure-white border-slate-200`}><Skeleton className="absolute inset-0 rounded-none" /></div>
      <div className="flex justify-between items-center gap-2">
        <Skeleton><p className="text-sm md:text-xl font-bold font-headline tracking-tight">₱00,000</p></Skeleton>
        <Skeleton className="flex"><InventoryBadge className="text-[9px] md:text-[11px] font-mono font-bold px-2 py-0.5 shrink-0">10 in stock</InventoryBadge></Skeleton>
      </div>
      <Separator className="bg-border/40" />
      <div className={adminPartLayout.specs}>
        {Array.from({length:4},(_,index)=><div key={index} className="min-w-0">
          <Skeleton><p className="text-[7px] md:text-[9px] uppercase font-bold tracking-tight mb-0">Specification</p></Skeleton>
          <Skeleton><p className="font-bold text-[9px] md:text-[11px] truncate leading-none uppercase">Value</p></Skeleton>
        </div>)}
      </div>
    </div>
    <div className={adminPartLayout.footer}><Skeleton className="h-8 md:h-9 w-full" /></div>
  </InventoryCard>;
}

export function AdminPrebuiltSkeleton({expanded=false}: {expanded?:boolean}) {
  return <Card withBorder radius="lg" padding={12} aria-hidden="true" className="flex h-full flex-col justify-between border-slate-200/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-[#111722]">
    <Stack gap="xs">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Skeleton className="flex"><Badge size="xs">System</Badge></Skeleton>
        <Skeleton className="flex"><ActionIcon size="sm" disabled /></Skeleton>
      </Group>
      <div className="aspect-square relative -mx-3 w-auto overflow-hidden border-y border-slate-200/60 dark:border-white/10"><Skeleton className="absolute inset-0 rounded-none" /></div>
      <Stack gap={4}>
        <Skeleton><Text size="md" fw={700} lineClamp={2} className="leading-snug min-h-[2.5rem]">System name</Text></Skeleton>
        <Skeleton><Text size="xs" lineClamp={2} className="min-h-[2rem] leading-relaxed">System description</Text></Skeleton>
      </Stack>
      <div className="mt-2"><Paper withBorder radius="md" p="xs"><PrebuiltSpecsSkeleton expanded={expanded} /></Paper></div>
    </Stack>
    <Stack gap="xs" mt="md">
      <Stack gap={0}>
        <Skeleton><Text size="xs" tt="uppercase" fw={600} className="tracking-wider text-[10px]">Total Price</Text></Skeleton>
        <Skeleton><Text size="lg" fw={700} className="font-mono leading-none">₱00,000.00</Text></Skeleton>
      </Stack>
      <Group gap="xs" mt="xs" wrap="nowrap"><Skeleton className="h-8 w-8 shrink-0" /><Skeleton className="flex flex-1"><Button size="sm" className="h-8" fullWidth disabled>Launch Page</Button></Skeleton></Group>
    </Stack>
  </Card>;
}
