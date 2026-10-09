'use client';

import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';

export function UnifiedBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
      {/* Base Canvas Layer */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-700",
          isDark ? "bg-[#0b0f17]" : "bg-slate-50"
        )}
      />

      {/* Soft Ambient Radial Light - Top Header / Horizon (Static, CSS-only) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 45% at 50% -15%, rgba(34, 211, 238, 0.07), transparent 70%)'
            : 'radial-gradient(ellipse 80% 45% at 50% -15%, rgba(6, 182, 212, 0.09), transparent 70%)',
        }}
      />

      {/* Subtle Counter-Glow - Bottom Right Soft Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 60% 40% at 85% 100%, rgba(56, 189, 248, 0.03), transparent 60%)'
            : 'radial-gradient(ellipse 60% 40% at 85% 100%, rgba(14, 165, 233, 0.04), transparent 60%)',
        }}
      />

      {/* Refined Geometric Dot Matrix Grid (Completely Static) */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          isDark ? "opacity-25" : "opacity-35"
        )}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#38bdf8' : '#0284c7'} 0.75px, transparent 0.75px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 95%)',
        }}
      />

      {/* Subtle Soft Vignette for Enhanced Focus on Center Content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(5, 8, 13, 0.6) 100%)'
            : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 65%, rgba(226, 232, 240, 0.5) 100%)',
        }}
      />
    </div>
  );
}
