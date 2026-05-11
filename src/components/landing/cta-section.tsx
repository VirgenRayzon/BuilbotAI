"use client";

import { motion } from 'framer-motion';
import { SparkleButton } from '@/components/ui/sparkle-button';
import { CanvasText } from '@/components/ui/canvas-text';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CTASectionProps {
  isDark: boolean;
}

export function CTASection({ isDark }: CTASectionProps) {
  return (
    <section className="py-40 relative overflow-hidden transition-colors duration-1000">
      <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-8xl font-black font-headline mb-10 uppercase tracking-tighter leading-none flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="w-full">Ready to Build Your</span>
            <CanvasText
              text="ENDGAME"
              className="italic text-primary font-headline"
              backgroundClassName="bg-blue-600 dark:bg-blue-900"
              colors={[
                "rgba(34, 211, 238, 1)", // Cyan
              ]}
              animationDuration={12}
              lineGap={5}
              curveIntensity={35}
            />{" "}
            System?
          </h2>
          <p className={cn(
            "text-xl md:text-2xl mb-16 max-w-3xl mx-auto font-medium leading-relaxed",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            Register and sign in to get started with your dream PC today.
          </p>
          <div className="flex flex-col items-center gap-12">
            <SparkleButton
              asChild
              icon={<Sparkles className="w-5 h-5 md:w-8 md:h-8 text-primary" />}
              className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-16 text-xl md:text-3xl rounded-2xl md:rounded-3xl font-black transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              <Link href="/signin">Register to Get Started</Link>
            </SparkleButton>

            <div className="flex items-center gap-12 flex-wrap justify-center opacity-60">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-black font-headline tracking-tight">VALIDATED</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">SELECTIONS</span>
              </div>
              <div className="w-px h-12 bg-border hidden md:block" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-black font-headline tracking-tight">ADVANCED</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">AI ADVISOR</span>
              </div>
              <div className="w-px h-12 bg-border hidden md:block" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-black font-headline tracking-tight">BUDGET</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">OPTIMIZED</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
