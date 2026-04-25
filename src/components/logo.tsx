import { AnimatedCubeLogo } from "./animated-cube-logo";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AnimatedCubeLogo className="h-8 w-8" />
      <h1 className="text-xl font-bold font-headline text-foreground tracking-tight ml-1">
        Buildbot AI
      </h1>
    </div>
  );
}
