import { Paper, Skeleton } from '@mantine/core';

const SINGLE_SLOT_WIDTHS = {
  top: [88, 36, 36],
  bottom: [34, 52, 40],
};

export function YourBuildSkeleton({ isManagerMode = false }: { isManagerMode?: boolean }) {
  return (
    <>
      <div className="hidden lg:block">
        <Paper
          withBorder
          radius="lg"
          shadow="sm"
          className="overflow-hidden border-slate-200 bg-white shadow-slate-900/5 dark:border-white/10 dark:bg-[#111722] dark:shadow-black/30"
        >
          <div className="border-b border-slate-200 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2">
              <Skeleton h={20} w={88} radius="sm" />
              <div className="flex items-center gap-2">
                <Skeleton h={22} w={74} radius="md" />
                <Skeleton h={28} w={28} radius="md" />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-100/70 p-2 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex w-full gap-0.5 rounded-md border border-slate-200/80 bg-white/80 p-0.5 shadow-inner dark:border-white/10 dark:bg-[#151922]">
              <Skeleton h={44} radius="md" className="flex-1" />
              <Skeleton h={44} w={44} radius="md" className="shrink-0" />
              <Skeleton h={44} w={44} radius="md" className="shrink-0" />
            </div>
          </div>

          <div className="flex flex-col p-3">
            <div className="space-y-3 py-1">
              {SINGLE_SLOT_WIDTHS.top.map((width, index) => (
                <div
                  key={`top-${index}`}
                  className="-mx-1 flex items-center gap-3 rounded-xl border border-dashed border-slate-200/80 px-3 py-2 dark:border-white/10"
                >
                  <Skeleton h={26} w={26} radius="md" className="shrink-0" />
                  <Skeleton h={10} w={width} radius="sm" />
                </div>
              ))}

              {[
                { labelWidth: 54, detailWidth: 82 },
                { labelWidth: 56, detailWidth: 74 },
              ].map((group, index) => (
                <div
                  key={`group-${index}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 p-2 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton h={32} w={32} radius="md" className="shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton h={10} w={group.labelWidth} radius="sm" />
                      <Skeleton h={12} w={group.detailWidth} radius="sm" />
                    </div>
                  </div>
                  <Skeleton h={16} w={16} radius="sm" className="shrink-0" />
                </div>
              ))}

              {SINGLE_SLOT_WIDTHS.bottom.map((width, index) => (
                <div
                  key={`bottom-${index}`}
                  className="-mx-1 flex items-center gap-3 rounded-xl border border-dashed border-slate-200/80 px-3 py-2 dark:border-white/10"
                >
                  <Skeleton h={26} w={26} radius="md" className="shrink-0" />
                  <Skeleton h={10} w={width} radius="sm" />
                </div>
              ))}

              <div className="flex w-full items-center gap-3 pt-6 pb-3">
                <Skeleton h={14} w={84} radius="sm" className="shrink-0" />
                <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="h-px w-full bg-slate-200 dark:bg-white/10" />
              <Paper
                withBorder
                radius="md"
                p={12}
                className="border-slate-200 bg-slate-50/70 shadow-xs dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <Skeleton h={11} w={74} radius="sm" />
                    <Skeleton h={10} w={128} radius="sm" />
                  </div>
                  <Skeleton h={28} w={82} radius="sm" />
                </div>
              </Paper>
            </div>
          </div>

          <div className="p-3">
            {isManagerMode ? (
              <Skeleton h={42} radius="md" className="w-full" />
            ) : (
              <div className="flex items-center gap-2">
                <Skeleton h={44} w={44} radius="md" className="shrink-0" />
                <Skeleton h={42} radius="md" className="flex-1" />
              </div>
            )}
          </div>
        </Paper>
      </div>

      <div className="fixed bottom-4 right-4 z-40 sm:right-6 lg:hidden" aria-hidden="true">
        <Skeleton h={48} w={184} radius="xl" />
      </div>
    </>
  );
}

