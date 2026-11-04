'use client';

import { Paper, Skeleton, Stack } from '@mantine/core';

export function AdvisorLoadingContent() {
  return (
    <div
      className="min-h-screen transition-colors duration-500 overflow-x-hidden relative bg-slate-50 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-50"
      aria-label="Loading AI Build Advisor"
      aria-busy="true"
    >
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pt-4 md:pt-6 relative z-10">
        {/* Header Skeleton matching AdvisorHeader */}
        <div className="relative mb-4 space-y-1">
          <Skeleton h={14} w={100} radius="sm" />
          <Skeleton h={32} w={220} radius="sm" />
          <Skeleton h={14} w={380} radius="sm" />
        </div>

        {/* Tab Pills Bar Skeleton */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100/90 dark:bg-[#141a23] p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex gap-2">
            <Skeleton h={36} w={160} radius="xl" />
            <Skeleton h={36} w={150} radius="xl" />
          </div>
        </div>

        {/* Content Layout Skeleton: 12-column Grid */}
        <div className="grid lg:grid-cols-12 gap-5 xl:gap-6 h-full">
          {/* Left Column (Builder summary slot) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Paper
              withBorder
              radius="lg"
              p="md"
              className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722] space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                <Skeleton h={20} w={120} radius="sm" />
                <Skeleton h={16} w={50} radius="sm" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-white/5">
                    <Skeleton h={24} w={24} radius="sm" />
                    <Skeleton h={14} w={100} radius="sm" />
                    <Skeleton h={14} w={40} radius="sm" />
                  </div>
                ))}
              </div>
            </Paper>
          </div>

          {/* Right Column (Critique / Advisor main cards) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <Paper
              withBorder
              radius="lg"
              p={{ base: 'md', sm: 'lg' }}
              className="border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-[#111722] space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="space-y-1">
                  <Skeleton h={20} w={180} radius="sm" />
                  <Skeleton h={14} w={260} radius="sm" />
                </div>
                <Skeleton h={36} w={120} radius="md" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Skeleton h={80} radius="md" />
                <Skeleton h={80} radius="md" />
                <Skeleton h={80} radius="md" />
              </div>
              <Skeleton h={160} radius="md" />
            </Paper>
          </div>
        </div>
      </main>
    </div>
  );
}
