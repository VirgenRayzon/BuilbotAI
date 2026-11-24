import { Skeleton } from '@mantine/core';
import { InventoryLoading } from '@/components/loading/inventory-loading';
import { YourBuildSkeleton } from '@/components/loading/your-build-skeleton';

export default function PrebuiltBuilderLoading() {
  return (
    <div className="flex min-h-svh w-full overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0c0f14] dark:text-slate-50">
      <aside
        aria-hidden="true"
        className="hidden w-[16rem] shrink-0 flex-col justify-between border-r border-slate-200/70 bg-white/80 p-3 dark:border-white/[0.06] dark:bg-[#0c0f14] md:flex"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <Skeleton h={32} w={32} radius="md" className="shrink-0" />
            <div className="space-y-1.5">
              <Skeleton h={14} w={108} radius="sm" />
              <Skeleton h={10} w={76} radius="sm" />
            </div>
          </div>

          <div className="space-y-4">
            {[4, 3, 2].map((groupCount, groupIndex) => (
              <div key={groupIndex} className="space-y-1.5">
                <Skeleton h={10} w={84} radius="sm" className="mx-2" />
                {Array.from({ length: groupCount }, (_, itemIndex) => (
                  <Skeleton key={itemIndex} h={34} radius="md" className="w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-slate-200/60 pt-3 dark:border-white/[0.06]">
          <Skeleton circle h={32} w={32} className="shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton h={12} w={96} radius="sm" />
            <Skeleton h={10} w={128} radius="sm" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          aria-hidden="true"
          className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0c0f14]/80"
        >
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Skeleton h={28} w={28} radius="md" />
            <div className="mr-2 h-4 w-[1px] shrink-0 bg-slate-200 dark:bg-white/10" />
            <Skeleton h={14} w={96} radius="sm" className="hidden md:block" />
            <Skeleton h={14} w={108} radius="sm" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
            <Skeleton
              h={32}
              radius="md"
              className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[360px] lg:max-w-[420px]"
            />
            <Skeleton h={32} w={32} radius="md" className="shrink-0" />
            <Skeleton h={32} w={32} radius="md" className="shrink-0" />
          </div>
        </header>

        <div className="relative z-10 mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-8 lg:pb-12 xl:px-10">
          <div className="flex flex-col gap-6 xl:gap-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Skeleton h={26} w={76} radius="md" />
              <div className="flex items-center gap-2">
                <Skeleton h={38} w={132} radius="md" />
                <Skeleton h={38} w={84} radius="md" />
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 xl:gap-8">
              <div className="contents lg:col-span-3 lg:block lg:self-start">
                <YourBuildSkeleton isManagerMode />
              </div>

              <div className="flex min-w-0 flex-col gap-6 lg:col-span-9">
                <InventoryLoading
                  view="grid"
                  count={8}
                  gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

