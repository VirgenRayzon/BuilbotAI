"use client";

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Button } from '@/components/ui/button';
import { Box, MonitorSmartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AccessoriesSectionProps {
  isDark: boolean;
}

export function AccessoriesSection({ isDark }: AccessoriesSectionProps) {
  return (
    <section className={cn(
      "py-32 relative border-y transition-colors duration-1000",
      isDark ? "border-white/5" : "border-slate-200"
    )}>
      <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8">
        <SectionHeader
          badge="Curated Experiences"
          title="Beyond The Blueprint"
          subtitle="Whether you're architecting from scratch or deploying a pre-validated rig, we provide the ultimate foundation."
        />

        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          <motion.div
            whileHover={{ y: -8 }}
            className={cn(
              "p-10 rounded-[40px] flex flex-col gap-8 group transition-all duration-500 relative overflow-hidden glass-panel",
              isDark ? "shadow-none hover:border-primary/40" : "hover:border-primary/30 shadow-xl shadow-foreground/5"
            )}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h4 className="text-3xl font-bold font-headline uppercase tracking-tight mb-3">Battle-Ready Rigs</h4>
              <p className={cn("text-lg font-body leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
                Professionally curated systems, built by experts using our AI validation tools. Guaranteed performance deployment.
              </p>
            </div>
            <Button asChild variant="link" className="text-primary p-0 h-auto justify-start w-fit group/btn text-sm font-black uppercase tracking-widest">
              <Link href="/pre-builts" className="flex items-center">
                Secure Your Rig <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className={cn(
              "p-10 rounded-[40px] flex flex-col gap-8 group transition-all duration-500 relative overflow-hidden glass-panel",
              isDark ? "shadow-none hover:border-purple-500/40" : "hover:border-purple-500/30 shadow-xl shadow-foreground/5"
            )}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-purple-500/50 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
              <MonitorSmartphone className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h4 className="text-3xl font-bold font-headline uppercase tracking-tight mb-3">Total Command setup</h4>
              <p className={cn("text-lg font-body leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
                Beyond the tower. Buildbot helps you synchronize the perfect Monitor, Keyboard, and Headset ecosystem.
              </p>
            </div>
            <Button asChild variant="link" className="text-purple-400 p-0 h-auto justify-start w-fit group/btn text-sm font-black uppercase tracking-widest">
              <Link href="/builder" className="flex items-center">
                Equip Peripherals <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
