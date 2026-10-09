"use client";

import { motion } from 'framer-motion';
import { Paper, Button as MantineButton, Text, Group } from '@mantine/core';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CanvasText } from '@/components/ui/canvas-text';

interface CTASectionProps {
  isDark: boolean;
}

export function CTASection({ isDark }: CTASectionProps) {
  return (
    <section className="py-32 relative overflow-hidden transition-colors duration-1000">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            withBorder
            radius="3xl"
            p={{ base: 'xl', sm: 48, md: 64 }}
            className={cn(
              "text-center relative backdrop-blur-2xl transition-all shadow-2xl",
              isDark
                ? "bg-[#111722]/85 border-white/10 shadow-black/60"
                : "bg-white/95 border-slate-200/90 shadow-slate-200/70"
            )}
          >
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-headline mb-6 uppercase tracking-tighter leading-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-slate-900 dark:text-slate-100">
              <span>Ready to Build Your</span>
              <CanvasText
                text="DREAM PC"
                className="italic text-primary font-headline"
                backgroundClassName="bg-blue-600 dark:bg-blue-900"
                colors={["rgba(34, 211, 238, 1)"]}
                animationDuration={12}
                lineGap={5}
                curveIntensity={35}
              />
            </h2>

            <Text
              size="xl"
              className="max-w-2xl mx-auto mb-10 font-medium leading-relaxed text-slate-600 dark:text-slate-400"
            >
              Sign up to save customized builds, run instant hardware bottleneck checks,
              and receive personalized parts recommendations from Buildbot AI.
            </Text>

            <div className="flex flex-col items-center gap-10">
              <MantineButton
                component={Link}
                href="/signin"
                size="xl"
                radius="md"
                color="cyan"
                leftSection={<Sparkles size={20} />}
                rightSection={<ArrowRight size={20} />}
                className="h-14 sm:h-16 px-10 text-base sm:text-lg font-headline font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
              </MantineButton>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 pt-8 border-t border-slate-200/60 dark:border-white/10 w-full max-w-2xl">
                <div>
                  <p className="text-2xl font-black font-headline text-slate-900 dark:text-slate-100">VERIFIED</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Component Database</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-headline text-cyan-600 dark:text-cyan-400">INTELLIGENT</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">AI Recommendation</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-headline text-emerald-600 dark:text-emerald-400">RELIABLE</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Live Inventory</p>
                </div>
              </div>
            </div>
          </Paper>
        </motion.div>
      </div>
    </section>
  );
}

