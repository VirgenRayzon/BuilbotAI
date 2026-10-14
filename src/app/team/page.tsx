'use client';

import React from 'react';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { TeamSection } from '@/components/landing/team-section';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-provider';

export default function TeamPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "relative min-h-screen transition-colors duration-1000 selection:bg-primary/30 selection:text-primary",
      isDark ? "text-foreground" : "text-slate-900"
    )}>
      <UnifiedBackground />

      <div className="relative z-10">
        <TeamSection />
      </div>
    </div>
  );
}
