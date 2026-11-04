import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      inert
      className={cn("motion-safe:animate-pulse rounded-md bg-slate-200 dark:bg-white/10 [&>*]:invisible", className)}
      {...props}
    />
  )
}

export { Skeleton }
