"use client";

import { Button } from "@mantine/core";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReserveBuildButtonProps {
  onClick: () => void;
  ariaDisabled?: boolean;
  title?: string;
  className?: string;
}

export function ReserveBuildButton({
  onClick,
  ariaDisabled = false,
  title,
  className,
}: ReserveBuildButtonProps) {
  return (
    <Button
      size="md"
      radius="md"
      color="teal"
      leftSection={<ShieldCheck size={18} />}
      aria-disabled={ariaDisabled}
      title={title}
      onClick={onClick}
      className={cn(
        "h-11 min-w-0 flex-1 font-headline text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
        className
      )}
    >
      Reserve Build
    </Button>
  );
}
