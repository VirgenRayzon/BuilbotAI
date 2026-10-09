'use client';

import React from 'react';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { TeamSection } from '@/components/landing/team-section';
import { motion } from 'framer-motion';
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

      {/* Optional: Add a call to action or extra content below */}
      <section className="pb-32 px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="h-px w-24 bg-cyan-500/40 mx-auto mb-5" />
          <h2 className="text-3xl font-black font-headline uppercase tracking-tight mb-4 text-slate-900 dark:text-slate-100">
            Engineering With Purpose
          </h2>
          <p className={cn(
            "text-lg font-medium leading-relaxed max-w-2xl mx-auto",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            Our capstone team combines modern software engineering with PC hardware expertise
            to make custom PC configuration transparent, reliable, and accessible for everyone.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
