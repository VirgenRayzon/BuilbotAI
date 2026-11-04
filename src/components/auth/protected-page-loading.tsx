import { AdminPanelSkeleton } from '@/components/loading/admin-panel-skeleton';
import BuilderLoading from '@/app/builder/loading';
import { Paper, Skeleton } from '@mantine/core';

export function ProtectedPageLoading({ variant }: { variant: 'admin' | 'profile' | 'builder' }) {
  if (variant === 'admin') {
    return (
      <div className="min-h-[calc(100svh-4rem)] w-full p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-[#0c0f14]">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="space-y-1">
            <Skeleton h={28} w={200} radius="sm" />
            <Skeleton h={14} w={320} radius="sm" />
          </div>
          <AdminPanelSkeleton variant="cards" />
        </div>
      </div>
    );
  }

  if (variant === 'builder') {
    return <BuilderLoading />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0d14] pt-6 md:pt-8 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        <Paper withBorder radius="lg" p="lg" className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton circle h={64} w={64} />
            <div className="space-y-2 flex-1">
              <Skeleton h={22} w={180} radius="sm" />
              <Skeleton h={14} w={240} radius="sm" />
            </div>
          </div>
        </Paper>
        <div className="flex flex-col lg:flex-row gap-6">
          <Paper withBorder radius="lg" p="md" className="w-full lg:w-[325px] shrink-0 border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} h={38} radius="md" />
            ))}
          </Paper>
          <Paper withBorder radius="lg" p="md" className="flex-1 border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] space-y-4 min-h-[360px]">
            <Skeleton h={24} w={160} radius="sm" />
            <Skeleton h={14} w={260} radius="sm" />
            <div className="space-y-3 pt-2">
              <Skeleton h={60} radius="md" />
              <Skeleton h={60} radius="md" />
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
}
