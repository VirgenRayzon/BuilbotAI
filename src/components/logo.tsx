/**
 * Logo — Branded Buildbot AI logo with blue robot icon and text.
 * Used in the header/navbar across the application.
 */
import React from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RobotLogoIcon({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const containerSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };
  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full shrink-0 transition-all duration-300",
        "bg-cyan-50/90 dark:bg-[#071322] border border-cyan-400/40 dark:border-cyan-400/50",
        "shadow-[0_0_12px_rgba(6,182,212,0.2)] dark:shadow-[0_0_15px_rgba(34,211,238,0.25)]",
        containerSizes[size],
        className
      )}
    >
      <Bot
        size={iconSizes[size]}
        className="text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
        strokeWidth={2.2}
      />
    </div>
  );
}

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      <RobotLogoIcon size="md" className="group-hover:scale-105 transition-transform" />
      {showText && (
        <span className="text-lg md:text-xl font-bold font-headline text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
          Buildbot AI
        </span>
      )}
    </div>
  );
}
