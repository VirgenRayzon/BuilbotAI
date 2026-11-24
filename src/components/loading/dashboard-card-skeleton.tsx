'use client';

import { Paper, Skeleton } from '@mantine/core';

export function DashboardCardSkeleton() {
  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      aria-hidden="true"
      className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Skeleton h={40} w={40} radius="md" />
        <Skeleton h={18} w={80} radius="xl" />
      </div>
      <div className="space-y-2">
        <Skeleton h={12} w={110} radius="sm" />
        <Skeleton h={28} w={140} radius="sm" />
      </div>
    </Paper>
  );
}

export function DashboardKpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading analytics KPIs"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <DashboardCardSkeleton key={index} />
      ))}
    </div>
  );
}

