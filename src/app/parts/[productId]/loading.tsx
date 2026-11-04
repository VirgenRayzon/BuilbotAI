import { Group, Paper, Skeleton, Stack } from '@mantine/core';

export default function PartDetailLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-8 xl:px-10">
        <Skeleton h={32} w={120} radius="sm" className="mb-8" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-[auto_1fr_auto] md:gap-x-10 md:gap-y-4">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="order-1 md:col-start-1 md:row-start-1 md:row-span-3">
            <Paper
              withBorder
              radius="lg"
              className="overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111722]"
            >
              <div className="aspect-square relative w-full">
                <Skeleton className="absolute inset-0 rounded-none" />
              </div>
            </Paper>
            <div className="mt-3 flex gap-2">
              <Skeleton h={64} w={64} radius="md" />
              <Skeleton h={64} w={64} radius="md" />
              <Skeleton h={64} w={64} radius="md" />
            </div>
          </div>

          {/* Right Column Row 1: Header Skeleton */}
          <div className="order-2 md:col-start-2 md:row-start-1">
            <Group gap="xs" mb="xs">
              <Skeleton h={22} w={80} radius="sm" />
              <Skeleton h={22} w={80} radius="sm" />
            </Group>
            <Skeleton h={16} w={100} radius="sm" className="mb-2" />
            <Skeleton h={36} w="85%" radius="sm" className="mb-3" />
            <Group gap="md">
              <Skeleton h={14} w={130} radius="sm" />
              <Skeleton h={14} w={110} radius="sm" />
            </Group>
          </div>

          {/* Right Column Row 2: Specifications Skeleton */}
          <div className="order-4 md:col-start-2 md:row-start-2">
            <Paper
              withBorder
              radius="md"
              p="md"
              className="border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#141a23]/90 space-y-3"
            >
              <Skeleton h={18} w={120} radius="sm" />
              <div className="space-y-2 pt-1">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                    <Skeleton h={14} w={80} radius="sm" />
                    <Skeleton h={14} w={140} radius="sm" />
                  </div>
                ))}
              </div>
            </Paper>
          </div>

          {/* Right Column Row 3: Action Card Skeleton */}
          <Paper
            withBorder
            radius="md"
            p={{ base: 'sm', sm: 'md' }}
            className="order-3 border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#141a23]/90 md:col-start-2 md:row-start-3 md:order-4"
          >
            <Stack gap="md">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <Skeleton h={12} w={40} radius="sm" />
                  <Skeleton h={28} w={120} radius="sm" />
                </div>
                <Skeleton h={36} w={100} radius="md" />
              </div>
              <div className="flex gap-2">
                <Skeleton h={44} radius="md" className="flex-1" />
                <Skeleton h={44} radius="md" className="flex-1" />
              </div>
            </Stack>
          </Paper>
        </div>
      </div>
    </div>
  );
}

