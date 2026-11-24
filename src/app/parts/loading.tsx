import { Skeleton } from '@mantine/core';
import { CatalogCardSkeleton } from '@/components/loading/catalog-card-skeleton';

export default function PartsLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-4 pb-24 sm:px-6 md:px-8 lg:px-8 xl:px-10 lg:pb-12">
        <header className="mb-4 flex flex-col gap-0.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              Parts Catalog
            </span>
            <h1 className="font-headline text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Explore PC <span className="italic text-cyan-600 dark:text-cyan-400">Components</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Browse specifications, compare current pricing, and check component availability.
            </p>
          </div>
        </header>

        <section aria-label="Loading parts catalog" aria-busy="true">
          <div className="mb-4 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Skeleton h={44} radius="md" className="w-full min-w-0 flex-1 sm:max-w-[560px]" />
              <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
                <Skeleton h={44} radius="md" className="flex-1 sm:w-32 sm:flex-none" />
                <Skeleton h={20} w={60} radius="sm" className="hidden sm:block" />
                <Skeleton h={44} w={88} radius="md" className="ml-auto sm:ml-0" />
              </div>
            </div>
            <div className="flex items-center gap-2 min-h-6">
              <Skeleton h={24} w={80} radius="xl" />
              <Skeleton h={24} w={96} radius="xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <CatalogCardSkeleton key={index} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
