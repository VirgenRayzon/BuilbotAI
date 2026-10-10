"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompactInfoProps {
  message: string;
  label?: string;
}

/** A small, keyboard-accessible help control for contextual card descriptions. */
export function CompactInfo({ message, label = "More information" }: CompactInfoProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold leading-none text-slate-500 transition-colors hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:border-white/15 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300 dark:focus-visible:ring-offset-[#111722]"
          >
            !
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-slate-200 bg-white text-sm leading-relaxed text-slate-700 shadow-lg dark:border-white/10 dark:bg-[#141a23] dark:text-slate-200">
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
