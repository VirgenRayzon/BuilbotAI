export function ProtectedPageLoading({ variant }: { variant: 'admin' | 'profile' }) {
  const admin = variant === 'admin';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100" aria-label="Page loading">
      {admin && (
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/85 p-3 dark:border-white/10 dark:bg-[#111722] lg:block" aria-hidden="true">
          <div className="mb-8 h-10 w-36 rounded bg-slate-200 dark:bg-white/10" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 rounded bg-slate-200/70 dark:bg-white/10" />)}
          </div>
        </aside>
      )}
      <div className="w-full min-w-0 flex-1 p-4 sm:p-6" aria-hidden="true">
        <div className="mb-3 h-8 w-44 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mb-6 h-4 w-full max-w-md rounded bg-slate-200/70 dark:bg-white/10" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: admin ? 3 : 2 }).map((_, index) => (
            <div key={index} className="h-40 rounded-lg border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722]" />
          ))}
        </div>
      </div>
    </div>
  );
}
