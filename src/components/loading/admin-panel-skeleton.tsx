'use client';

import { Paper, Skeleton, Stack } from '@mantine/core';
import { DashboardKpiGridSkeleton } from './dashboard-card-skeleton';
import { OrderCardSkeleton } from './order-card-skeleton';

export function AdminPanelSkeleton({ variant = 'cards' }: { variant?: 'cards' | 'table' | 'orders' | 'analytics' }) {
  return (
    <div className="space-y-4 w-full" aria-label="Loading admin section" aria-busy="true">
      {/* Tab toolbar skeleton */}
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722]"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton h={40} radius="md" className="w-full sm:max-w-xs" />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Skeleton h={40} w={100} radius="md" />
            <Skeleton h={40} w={40} radius="md" />
          </div>
        </div>
      </Paper>

      {variant === 'analytics' ? (
        <Stack gap="md">
          <DashboardKpiGridSkeleton count={4} />
          <Paper
            withBorder
            radius="lg"
            p="md"
            className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] min-h-[320px]"
          >
            <Skeleton h={280} radius="md" />
          </Paper>
        </Stack>
      ) : variant === 'orders' ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }, (_, index) => (
            <Paper
              key={index}
              withBorder
              radius="lg"
              p="md"
              className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-3 min-h-[260px]"
            >
              <Skeleton h={140} radius="md" />
              <Skeleton h={16} w="80%" radius="sm" />
              <Skeleton h={14} w="40%" radius="sm" />
              <Skeleton h={36} radius="md" />
            </Paper>
          ))}
        </div>
      )}
    </div>
  );
}

