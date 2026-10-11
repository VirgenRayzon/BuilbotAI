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
            radius="2xl"
            p={12}
            className={cn(
              "text-center relative backdrop-blur-2xl transition-all shadow-2xl",
              isDark
                ? "bg-[#111722]/85 border-white/10 shadow-black/60"
                : "bg-white/95 border-slate-200/90 shadow-slate-200/70"
            )}
          >
            <div className="border border-slate-200/70 dark:border-white/10 rounded-xl p-3 bg-white/40 dark:bg-black/20">
              <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 flex flex-col items-center">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-headline mb-5 uppercase tracking-tighter leading-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-slate-900 dark:text-slate-100 text-center">
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
                size="lg"
                className="max-w-2xl mx-auto mb-8 font-medium leading-relaxed text-slate-600 dark:text-slate-400 text-center"
              >
                Sign up to save customized builds, run instant hardware bottleneck checks,
                and receive personalized parts recommendations from Buildbot AI.
              </Text>

              <div className="flex flex-col items-center w-full">
                <MantineButton
                  component={Link}
                  href="/signin"
                  size="lg"
                  radius="md"
                  color="cyan"
                  leftSection={<Sparkles size={18} />}
                  rightSection={<ArrowRight size={18} />}
                  className="h-12 sm:h-14 px-8 text-sm sm:text-base font-headline font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] mb-10"
                >
                  Get Started Free
                </MantineButton>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-slate-200/60 dark:border-white/10 w-full max-w-2xl text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-black font-headline text-slate-900 dark:text-slate-100">VERIFIED</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Component Database</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black font-headline text-cyan-600 dark:text-cyan-400">INTELLIGENT</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">AI Recommendation</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black font-headline text-emerald-600 dark:text-emerald-400">RELIABLE</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Live Inventory</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </Paper>
        </motion.div>
      </div>
    </section>
  );
}

