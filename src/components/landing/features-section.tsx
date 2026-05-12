"use client";

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { Layers, Zap, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AnimatedBotIcon } from '@/components/ui/animated-icons';
import { cn } from '@/lib/utils';

interface FeaturesSectionProps {
  isDark: boolean;
}

export function FeaturesSection({ isDark }: FeaturesSectionProps) {
  return (
    <section className="py-32 relative transition-colors duration-1000">
      <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8">
        <SectionHeader
          badge="BuildbotAI Features"
          title="Beyond Simple Compatibility"
          subtitle="BuildbotAI doesn't just list parts, it understands the performance and technical interplay of your entire build."
        />

        <FeatureShowcase
          reversed={true}
          title="Bottleneck Analysis"
          description="Shift between 1080p, 1440p, and 4K workloads. BuildbotAI analyzes the performance tier of your CPU vs your GPU to warn you if components will choke its performance."
          visual={
            <div className="relative w-full h-full overflow-hidden group">
              <img
                src="/feature-1.webp"
                alt="Bottleneck Analysis"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 gap-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Resolution Target: 4K UHD</span>
                  </div>
                  <Zap className="w-5 h-5 text-primary animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/80">
                      <span>CPU Utilization</span>
                      <span className="text-primary">98% PEAK</span>
                    </div>
                    <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: "98%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/80">
                      <span>GPU Utilization</span>
                      <span className="text-purple-400">100% MAXIMUM</span>
                    </div>
                    <div className="h-1.5 w-full bg-purple-500/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div
                        className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <FeatureShowcase
          title="Buildbot Build Critique"
          description="Not sure about your components? Buildbot Critique analyzes your entire hardware selection for value, thermal efficiency, and compatibility, providing professional feedback on every choice."
          visual={
            <div className="relative w-full h-full overflow-hidden group">
              <img
                src="/feature-2.webp"
                alt="Buildbot Build Critique"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-end p-8">
                <div className={cn(
                  "rounded-2xl p-6 w-full max-w-sm border relative overflow-hidden backdrop-blur-xl",
                  isDark ? "bg-slate-900/40 border-primary/20" : "bg-white/80 border-primary/20 shadow-xl"
                )}>
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Buildbot Intelligence Matrix</span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed font-body italic",
                    isDark ? "text-slate-200" : "text-slate-700"
                  )}>
                    "Scan Complete: The Ryzen 7 7800X3D choice is optimal. However, your PSU is 100w shy of recommended for a 4090 build. Consider a 850w unit..."
                  </p>
                </div>
              </div>
            </div>
          }
        />

        <FeatureShowcase
          reversed={true}
          title="Instant AI Build Generation"
          description="Tell Buildbot your budget, target resolution, and performance goals. Within seconds, Buildbot builds a complete, perfectly matched PC build from our live inventory."
          visual={
            <div className="relative w-full h-full overflow-hidden group">
              <img
                src="/feature-3.webp"
                alt="AI Build Generation"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-8 gap-3 items-end">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI PC Generation: Completed</span>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-md">
                    <AnimatedBotIcon className="h-5 w-5 text-primary" size={20} active />
                  </div>
                </div>

                <div className="space-y-3 w-full max-w-[280px]">
                  {[
                    { text: "Scanning GPU market...", icon: CheckCircle2, color: "text-emerald-500" },
                    { text: "Socket match: VERIFIED", icon: ShieldCheck, color: "text-blue-500" },
                    { text: "Power Draw: Optimized", icon: Zap, color: "text-purple-400" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 * i }}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 glass-panel backdrop-blur-xl",
                        isDark ? "bg-white/5 border-white/10" : "bg-muted/40 border-border"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", item.color)} />
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
