"use client";

import { motion } from 'framer-motion';
import {
  Badge,
  Button as MantineButton,
} from '@mantine/core';
import {
  Sparkles,
  LayoutPanelLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CanvasText } from '@/components/ui/canvas-text';
import heroImage from '@/assets/landing/hero-custom.webp';

interface HeroSectionProps {
  isDark: boolean;
}

export function HeroSection({ isDark }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-start overflow-hidden">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage}
          alt="Netcodex Custom PC Rig"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        {/* Background Tint Overlays (Reduced to 50%) */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      </div>

      {/* Ambient Lighting (Reduced to 50%) */}
      <div
        className={cn(
          "absolute inset-0 opacity-15 z-0 pointer-events-none",
          isDark
            ? "bg-[radial-gradient(circle_at_30%_50%,rgba(34,211,238,0.15),transparent_50%)]"
            : "bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"
        )}
      />

      <div className="w-full max-w-[1600px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-20">
        <div className="max-w-3xl">
          {/* Left Column: Heading & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="h-px w-10 bg-cyan-500" />
              <Badge
                variant="light"
                color="cyan"
                size="lg"
                radius="xl"
                leftSection={<Sparkles size={14} className="animate-pulse" />}
                className="font-bold tracking-widest uppercase py-2.5 px-4"
              >
                Netcodex Platform
              </Badge>
            </div>

            <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black tracking-tighter mb-6 md:mb-8 leading-[0.95] md:leading-[0.85] uppercase">
              Build Your <br />
              <CanvasText
                text="MASTERPIECE"
                className="italic text-primary font-headline"
                backgroundClassName="bg-blue-600 dark:bg-blue-900"
                colors={["rgba(34, 211, 238, 1)"]}
                animationDuration={12}
                lineGap={5}
                curveIntensity={35}
              />
            </h1>

            <p
              className={cn(
                "max-w-xl text-lg md:text-xl mb-8 md:mb-12 leading-relaxed font-medium",
                isDark ? "text-slate-300" : "text-slate-600"
              )}
            >
              Configure high-performance custom PCs with real-time bottleneck checking,
              thermal headroom verification, and intelligent part compatibility.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4">
              <MantineButton
                component={Link}
                href="/signin"
                size="xl"
                radius="md"
                color="cyan"
                rightSection={<LayoutPanelLeft size={20} />}
                className="h-14 md:h-16 px-8 text-base font-headline font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch Builder
              </MantineButton>

              <MantineButton
                component={Link}
                href="/signin"
                size="xl"
                radius="md"
                variant="default"
                leftSection={<Sparkles size={18} className="text-cyan-500" />}
                className={cn(
                  "h-14 md:h-16 px-8 text-base font-headline font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]",
                  isDark
                    ? "bg-[#111722]/80 border-white/10 text-slate-100 hover:bg-[#141a23]"
                    : "bg-white/90 border-slate-200 text-slate-900 hover:bg-slate-50"
                )}
              >
                AI Advisor
              </MantineButton>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-10 mt-8 border-t border-slate-200/60 dark:border-white/10 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-slate-900 dark:text-slate-100">100%</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compatibility</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-cyan-600 dark:text-cyan-400">Zero</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bottlenecks</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400">2-Year</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warranty</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
