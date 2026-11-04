'use client';

import { Button, Card, Stack, Text } from '@mantine/core';
import { Skeleton } from '@/components/ui/skeleton';

export const prebuiltCardLayout = {
  card: 'flex flex-col justify-between min-h-[600px] sm:min-h-[640px] h-full relative group overflow-hidden transition-all duration-300 shadow-lg',
  image: 'relative w-full h-[360px] sm:h-[380px] overflow-hidden bg-transparent border-b border-slate-200/70 dark:border-white/10',
  content: 'flex-1 flex flex-col justify-between p-4 sm:p-5',
  specRow: 'flex items-center gap-2 py-1',
};

export function PrebuiltSpecsSkeleton({ expanded = false, count = 4 }: { expanded?: boolean; count?: number }) {
  return <div className="space-y-0 text-xs" aria-label="Loading specifications" aria-busy="true">
    {[count, ...(expanded ? [4] : [])].map((rows, group) => <div className="space-y-0.5" key={group}>
      {Array.from({length:rows}, (_, index) => <div key={index} className={`${prebuiltCardLayout.specRow} ${index < rows - 1 || (!group && expanded) ? 'border-b border-slate-200/60 dark:border-white/5' : ''}`} aria-hidden="true">
        <Skeleton className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold text-[11px] rounded bg-slate-200 text-transparent dark:bg-white/10">CPU:</span>
        <span className="truncate text-[11px] rounded bg-slate-200 text-transparent dark:bg-white/10">Component specification</span>
      </div>)}
    </div>)}
  </div>;
}

export function PrebuiltCardSkeleton({ expanded = false }: { expanded?: boolean }) {
  return <Card withBorder radius="lg" padding={0} aria-hidden="true" className={`${prebuiltCardLayout.card} w-full border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-[#111722]`}>
    <div className="flex flex-col shrink-0"><div className={prebuiltCardLayout.image}><Skeleton className="absolute inset-0 rounded-none" /></div></div>
    <div className={prebuiltCardLayout.content}>
      <Stack gap={3}>
        <Skeleton><Text size="md" fw={700} lineClamp={2} className="leading-snug font-headline">System name</Text></Skeleton>
        <Skeleton><Text size="xs" className="font-mono text-[11px] tracking-wider truncate">SKU-PC00000000</Text></Skeleton>
        <div className="pt-2">
          <PrebuiltSpecsSkeleton expanded={expanded} />
          <div className="flex items-center gap-1 text-[11px] font-medium pt-1.5"><Skeleton>+ 4 more parts</Skeleton></div>
        </div>
      </Stack>
      <Stack gap="xs" className="pt-4">
        <Stack gap={0}>
          <Skeleton><Text size="xs" tt="uppercase" fw={600} className="tracking-wider text-[10px]">Total Price</Text></Skeleton>
          <Skeleton><Text size="lg" fw={700} className="font-mono leading-none">₱00,000.00</Text></Skeleton>
        </Stack>
        <Skeleton className="flex"><Button fullWidth radius="md" size="sm" disabled>Loading</Button></Skeleton>
      </Stack>
    </div>
  </Card>;
}
