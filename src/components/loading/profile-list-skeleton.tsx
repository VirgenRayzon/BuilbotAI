'use client';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Skeleton } from '@/components/ui/skeleton';

// ReservationsList and FavoritesList use the same 12px card padding,
// stacked mobile header, md stack gap, and item thumbnail row.
export function ProfileListSkeleton({ favorite = false }: { favorite?: boolean }) {
  return <div className="grid grid-cols-1 gap-5" aria-label="Loading account items" aria-busy="true">
    <Paper withBorder radius="lg" p={12} className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 shadow-sm">
      <Stack gap="md" aria-hidden="true">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="space-y-1"><Skeleton><Text className="text-lg font-bold font-headline">Order or saved build</Text></Skeleton><Skeleton><Text size="xs">Created date and status</Text></Skeleton></div>
          <Skeleton className="flex"><Button size="sm" disabled>Details</Button></Skeleton>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 overflow-hidden">
          <div className="max-h-[190px] overflow-hidden divide-y divide-slate-200 dark:divide-white/5">
            {Array.from({length: favorite ? 4 : 1}, (_, index) => <div key={index} className={favorite ? 'p-3 px-4 flex justify-between items-center text-sm' : 'p-2.5 sm:p-3 px-3.5 sm:px-4 flex justify-between items-center text-sm gap-3'}>
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className={favorite ? 'h-5 w-5 shrink-0' : 'h-10 w-10 sm:h-11 sm:w-11 shrink-0'} />
                <div className="flex flex-col min-w-0"><Skeleton><span className="text-[10px] font-bold uppercase tracking-wider">Category</span></Skeleton><Skeleton><span className="font-semibold text-xs sm:text-sm truncate">Component name</span></Skeleton></div>
              </div>
              <Skeleton><span className="font-mono font-bold text-xs">₱00,000</span></Skeleton>
            </div>)}
          </div>
        </div>
      </Stack>
    </Paper>
  </div>;
}
