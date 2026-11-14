import { Skeleton } from '@mantine/core';
import { InventoryLoading } from '@/components/loading/inventory-loading';
import { YourBuildSkeleton } from '@/components/loading/your-build-skeleton';

export default function BuilderLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#0c0f14] dark:text-slate-50">
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pb-24 lg:pb-12 pt-4 md:pt-6">
        <div className="relative mb-4">
          <div className="relative z-10 flex flex-col gap-1.5">
            <Skeleton h={12} w={92} radius="sm" />
            <Skeleton h={32} w={270} radius="sm" className="max-w-full sm:h-9 sm:w-[320px]" />
            <Skeleton h={16} w={300} radius="sm" className="max-w-full sm:h-5 sm:w-[420px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 xl:gap-8">
          <div className="contents lg:col-span-3 lg:block lg:self-start">
            <YourBuildSkeleton />
          </div>

          <div className="min-w-0 lg:col-span-9">
            <div className="mb-4 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Skeleton h={44} radius="md" className="w-full min-w-0 flex-1 sm:max-w-[560px]" />
                <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
                  <div className="flex-1 sm:flex-none">
                    <Skeleton h={44} radius="md" className="w-full sm:w-[132px]" />
                  </div>
                  <Skeleton h={18} w={68} radius="sm" className="hidden shrink-0 sm:block" />
                  <Skeleton h={44} w={88} radius="md" className="ml-auto shrink-0 sm:ml-0" />
                </div>
              </div>
              <div className="flex min-h-6 items-center">
                <Skeleton h={16} w={64} radius="sm" className="sm:hidden" />
              </div>
            </div>

            <InventoryLoading
              view="grid"
              count={8}
              gridClassName="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
