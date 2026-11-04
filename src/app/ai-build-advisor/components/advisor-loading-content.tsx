export function AdvisorLoadingContent() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 md:px-8 md:py-6 lg:px-8 xl:px-10">
        <div className="mb-4 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-full max-w-md rounded bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-64 rounded-lg border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722]" />
      </main>
    </div>
  );
}
