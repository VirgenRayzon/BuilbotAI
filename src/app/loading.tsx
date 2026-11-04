import { Paper, Skeleton } from '@mantine/core';

export default function Loading() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] w-full overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50"
      aria-label="Loading page"
      aria-busy="true"
    >
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 md:px-8 lg:px-8 xl:px-10 space-y-6">
        <div className="space-y-2">
          <Skeleton h={16} w={120} radius="sm" />
          <Skeleton h={32} w={280} radius="sm" />
          <Skeleton h={14} w={420} radius="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Paper
              key={i}
              withBorder
              radius="lg"
              p="md"
              className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-3 min-h-[140px]"
            >
              <Skeleton h={24} w={80} radius="sm" />
              <Skeleton h={32} w={140} radius="sm" />
              <Skeleton h={12} w={100} radius="sm" />
            </Paper>
          ))}
        </div>
      </main>
    </div>
  );
}
