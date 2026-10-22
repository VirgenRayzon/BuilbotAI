/**
 * Logo — Branded Netcodex logo with white logo asset on theme-legible surface,
 * and genuine 4-color transparent emblem.
 */
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "cyan" | "red";
}

export function NetcodexEmblem({
  size = "md",
  className,
  variant = "cyan",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "cyan" | "red";
}) {
  const containerSizes = {
    sm: "w-8 h-8 p-1",
    md: "w-10 h-10 p-1.5",
    lg: "w-14 h-14 p-2",
    xl: "w-16 h-16 p-2.5",
  };

  const imageSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 54,
  };

  const variantStyles = {
    cyan: cn(
      "bg-slate-100/90 dark:bg-[#071322] border-slate-300 dark:border-cyan-400/40",
      "shadow-[0_0_14px_rgba(6,182,212,0.2)] dark:shadow-[0_0_18px_rgba(34,211,238,0.25)]"
    ),
    red: cn(
      "bg-red-50/80 dark:bg-[#18080b] border-red-300 dark:border-red-500/50",
      "shadow-[0_0_14px_rgba(239,68,68,0.25)] dark:shadow-[0_0_20px_rgba(239,68,68,0.35)]"
    ),
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full shrink-0 transition-all duration-300 border",
        variantStyles[variant],
        containerSizes[size],
        className
      )}
    >
      <Image
        src="/netcodex-emblem.png"
        alt="Netcodex Emblem"
        width={imageSizes[size]}
        height={imageSizes[size]}
        className="w-full h-full object-contain drop-shadow-sm"
      />
    </div>
  );
}

/** Backward compatibility alias for legacy imports */
export const RobotLogoIcon = NetcodexEmblem;

export function Logo({
  className,
  showText = true,
  size = "md",
  variant = "cyan",
}: LogoProps) {
  if (!showText) {
    return (
      <div className={cn("inline-flex items-center group select-none", className)}>
        <NetcodexEmblem size={size} variant={variant} className="group-hover:scale-105 transition-transform" />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center group select-none", className)}>
      <div
        className={cn(
          "flex items-center px-3 py-1.5 rounded-xl transition-all duration-200",
          "bg-slate-900/95 dark:bg-white/[0.06] border border-slate-800 dark:border-white/10",
          "shadow-xs backdrop-blur-sm group-hover:border-cyan-500/40"
        )}
      >
        <Image
          src="/netcodex_cc_2026_white.png.webp"
          alt="Netcodex Computer Center"
          width={160}
          height={32}
          className="h-7 sm:h-8 w-auto object-contain"
        />
      </div>
    </div>
  );
}

