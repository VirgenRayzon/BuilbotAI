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
          <div className="h-px w-24 bg-primary/30 mx-auto mb-12" />
          <h2 className="text-3xl font-black font-headline uppercase tracking-tight mb-6">
            Join the Revolution
          </h2>
          <p className={cn(
            "text-lg font-medium leading-relaxed",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            Our team is constantly expanding the boundaries of neural PC architecture. 
            Want to be part of the future of hardware synthesis?
          </p>
        </motion.div>
      </section>
    </div>
  );
}
