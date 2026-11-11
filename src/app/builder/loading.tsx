import { Paper, Skeleton } from '@mantine/core';
import { InventoryLoading } from '@/components/loading/inventory-loading';

export default function BuilderLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#0c0f14] dark:text-slate-50">
      <main className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 pb-28 lg:pb-12">
        <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <Skeleton h={14} w={140} radius="sm" />
            <Skeleton h={28} w={240} radius="sm" />
            <Skeleton h={12} w={300} radius="sm" />
          </div>
          <div className="flex gap-2">
            <Skeleton h={40} w={100} radius="md" />
            <Skeleton h={40} w={100} radius="md" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
            <Paper
              withBorder
              radius="lg"
              p="md"
              className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722] space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                <Skeleton h={20} w={120} radius="sm" />
                <Skeleton h={16} w={60} radius="sm" />
              </div>

              <div className="space-y-2">
                {Array.from({ length: 7 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton h={28} w={28} radius="sm" />
                      <Skeleton h={14} w={100} radius="sm" />
                    </div>
                    <Skeleton h={24} w={60} radius="md" />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton h={12} w={50} radius="sm" />
                  <Skeleton h={24} w={100} radius="sm" />
                </div>
                <Skeleton h={40} w={130} radius="md" />
              </div>
            </Paper>
          </div>

          <div className="flex-1 w-full min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Skeleton h={44} radius="md" className="w-full sm:max-w-md" />
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Skeleton h={44} w={110} radius="md" />
                <Skeleton h={44} w={88} radius="md" />
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
