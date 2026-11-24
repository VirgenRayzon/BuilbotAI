'use client';

import { Paper, Skeleton, Stack } from '@mantine/core';

export function OrderCardSkeleton() {
  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      aria-hidden="true"
      className="w-full h-full shadow-xs bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10"
    >
      <Stack gap="xs" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap pt-0.5">
            <Skeleton h={18} w={110} radius="sm" />
            <Skeleton h={16} w={76} radius="sm" />
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <Skeleton h={22} w={88} radius="sm" />
              <Skeleton h={32} w={32} radius="md" />
              <Skeleton h={32} w={32} radius="md" />
            </div>
            <Skeleton h={14} w={105} radius="sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
          <Skeleton h={36} radius="md" />
          <Skeleton h={36} radius="md" />
          <Skeleton h={36} radius="md" />
          <Skeleton h={36} radius="md" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
          <Skeleton h={14} w={90} radius="sm" />
          <Skeleton h={14} w={56} radius="sm" />
        </div>
      </Stack>
    </Paper>
  );
}

