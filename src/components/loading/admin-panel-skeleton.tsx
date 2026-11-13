'use client';

import { Paper, Skeleton, Stack, Table } from '@mantine/core';
import { DashboardKpiGridSkeleton } from './dashboard-card-skeleton';
import { OrderCardSkeleton } from './order-card-skeleton';
import { TableLoadingRows } from './table-loading-rows';

export function AdminPanelSkeleton({
  variant = 'cards',
}: {
  variant?: 'cards' | 'table' | 'orders' | 'analytics' | 'editor';
}) {
  if (variant === 'editor') {
    return (
      <div className="space-y-6 w-full mt-2" aria-label="Loading catalog editor" aria-busy="true">
        <div className="pb-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton circle h={44} w={44} />
            <div className="space-y-1.5">
              <Skeleton h={22} w={190} radius="sm" />
              <Skeleton h={12} w={280} radius="sm" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton h={36} w={120} radius="md" />
            <Skeleton h={36} w={105} radius="md" />
            <Skeleton h={36} w={180} radius="md" />
            <Skeleton h={36} w={140} radius="md" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton h={14} w={110} radius="sm" />
            <Skeleton h={260} radius="lg" />
            <Skeleton h={96} radius="lg" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton h={14} w={110} radius="sm" />
            <Skeleton h={40} radius="md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton h={40} radius="md" />
              <Skeleton h={40} radius="md" />
              <Skeleton h={40} radius="md" />
              <Skeleton h={40} radius="md" />
            </div>
            <Skeleton h={132} radius="md" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          <Skeleton h={14} w={170} radius="sm" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton h={44} radius="md" />
            <Skeleton h={44} radius="md" />
            <Skeleton h={44} radius="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full" aria-label="Loading admin section" aria-busy="true">
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
      ) : variant === 'table' ? (
        <Paper
          withBorder
          radius="md"
          className="overflow-hidden border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#141a23]/80"
        >
          <Table>
            <Table.Thead>
              <Table.Tr>
                {Array.from({ length: 5 }, (_, index) => (
                  <Table.Th key={index}>
                    <Skeleton h={14} w={index === 0 ? 120 : 80} radius="sm" />
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <TableLoadingRows count={6} columns={5} />
            </Table.Tbody>
          </Table>
        </Paper>
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
