"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ConfirmationTone = "cyan" | "orange" | "red";

interface ConfirmationAlertDialogProps {
  trigger: ReactNode;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actionLabel: string;
  tone?: ConfirmationTone;
  onConfirm: () => void;
}

const toneClasses: Record<ConfirmationTone, { icon: string; action: string }> = {
  cyan: {
    icon: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    action: "bg-cyan-600 text-white hover:bg-cyan-500",
  },
  orange: {
    icon: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    action: "bg-orange-600 text-white hover:bg-orange-500",
  },
  red: {
    icon: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    action: "bg-red-600 text-white hover:bg-red-500",
  },
};

export function ConfirmationAlertDialog({
  trigger,
  icon,
  title,
  description,
  actionLabel,
  tone = "cyan",
  onConfirm,
}: ConfirmationAlertDialogProps) {
  const colors = toneClasses[tone];

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogCancel
          aria-label="Close confirmation"
          className="absolute right-3 top-3 h-7 w-7 border-0 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </AlertDialogCancel>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 pr-9">
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", colors.icon)}>
              {icon}
            </span>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={colors.action} onClick={onConfirm}>
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
