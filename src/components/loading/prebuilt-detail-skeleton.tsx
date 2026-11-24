'use client';

import { Grid, Group, Paper, Skeleton, Stack } from '@mantine/core';

export function PrebuiltDetailSkeleton() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-500 dark:bg-[#0c0f14] dark:text-slate-50"
      aria-label="Loading pre-built system details"
      aria-busy="true"
    >
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-8 xl:px-10">
        <Skeleton h={32} w={120} radius="sm" className="mb-6" />

        <Grid gutter={{ base: 'xl', lg: 32 }} align="start">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <div className="flex flex-col gap-6">
              <Paper
                withBorder
                radius="lg"
                className="overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111722]"
              >
                <div className="aspect-[4/3] relative w-full">
                  <Skeleton className="absolute inset-0 rounded-none" />
                </div>
              </Paper>
              <div className="flex gap-2">
                <Skeleton h={64} w={64} radius="md" />
                <Skeleton h={64} w={64} radius="md" />
                <Skeleton h={64} w={64} radius="md" />
              </div>

              <Paper
                withBorder
                radius="lg"
                p="md"
                className="hidden lg:block border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-3"
              >
                <Skeleton h={20} w={160} radius="sm" />
                <Skeleton h={80} radius="md" />
              </Paper>
            </div>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <div className="flex flex-col gap-6">
              <Paper
                withBorder
                radius="lg"
                p={{ base: 'md', sm: 'lg' }}
                className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722]"
              >
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Skeleton h={22} w={70} radius="sm" />
                      <Skeleton h={22} w={90} radius="sm" />
                    </Group>
                    <Skeleton h={24} w={100} radius="sm" />
                  </Group>
                  <Skeleton h={32} w="80%" radius="sm" />
                  <Skeleton h={14} w="95%" radius="sm" />
                  <Skeleton h={14} w="70%" radius="sm" />
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton h={12} w={60} radius="sm" />
                      <Skeleton h={28} w={140} radius="sm" />
                    </div>
                    <Skeleton h={40} w={120} radius="md" />
                  </div>
                </Stack>
              </Paper>

              <Paper
                withBorder
                radius="lg"
                p="md"
                className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722] space-y-3"
              >
                <Skeleton h={20} w={150} radius="sm" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton h={36} w={36} radius="sm" />
                        <div className="space-y-1">
                          <Skeleton h={12} w={60} radius="sm" />
                          <Skeleton h={14} w={140} radius="sm" />
                        </div>
                      </div>
                      <Skeleton h={14} w={70} radius="sm" />
                    </div>
                  ))}
                </div>
              </Paper>

              <div className="flex gap-3">
                <Skeleton h={48} radius="md" className="flex-1" />
                <Skeleton h={48} radius="md" className="flex-1" />
              </div>
            </div>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}
