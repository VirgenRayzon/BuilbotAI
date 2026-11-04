'use client';

import { Paper, Skeleton, Stack } from '@mantine/core';

export function OrderCardSkeleton() {
  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      aria-hidden="true"
      className="w-full shadow-sm space-y-4 bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10"
    >
      <Stack gap="md" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton circle h={44} w={44} className="shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton h={18} w={140} radius="sm" />
                <Skeleton h={18} w={80} radius="sm" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton h={14} w={180} radius="sm" />
                <Skeleton h={14} w={100} radius="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton h={36} w={110} radius="md" />
            <Skeleton h={36} w={36} radius="md" />
          </div>
        </div>

        <div className="py-2">
          <Skeleton h={32} radius="md" className="w-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Skeleton h={60} radius="md" />
          <Skeleton h={60} radius="md" />
        </div>
      </Stack>
    </Paper>
  );
}

