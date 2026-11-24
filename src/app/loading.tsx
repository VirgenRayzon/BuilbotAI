import { LoaderCard } from "@/components/loading/loader-card";

export default function Loading() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] w-full flex items-center justify-center overflow-x-hidden bg-slate-50 px-4 text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50"
      aria-label="Loading page"
      aria-busy="true"
    >
      <LoaderCard message="Loading page..." />
    </div>
  );
}
