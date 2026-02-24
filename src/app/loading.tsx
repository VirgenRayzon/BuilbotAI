import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";

export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-lg border">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

