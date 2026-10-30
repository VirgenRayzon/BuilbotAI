"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiDisclaimerProps {
  className?: string;
  centered?: boolean;
  children?: ReactNode;
}

export function AiDisclaimer({ className, centered = false, children }: AiDisclaimerProps) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-1.5 text-[10px] font-medium leading-relaxed text-yellow-700 dark:text-yellow-300",
        centered && "justify-center text-center",
        className
      )}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        {children ?? 'AI can make mistakes. Verify compatibility, pricing, availability, and specifications before purchasing.'}
      </span>
    </p>
  );
}
