"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SparkleButton } from '@/components/ui/sparkle-button';
import { CanvasText } from '@/components/ui/canvas-text';
import { Sparkles, LayoutPanelLeft, Bot, Cpu, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  isDark: boolean;
}

export function HeroSection({ isDark }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-custom.webp"
          alt="BuildbotAI Custom Rig"
          className="w-full h-full object-cover opacity-70"
        />
        {/* Dark Gradients for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Animated Background Elements */}
      <div className={cn(
        "absolute inset-0 opacity-30 z-0",
        isDark
          ? "bg-[radial-gradient(circle_at_30%_50%,rgba(34,211,238,0.15),transparent_50%)]"
          : "bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"
      )} />

      <div className="max-w-[1800px] w-full relative z-10 mx-auto px-4 md:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-left"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-primary" />
              <div className={cn(
                "inline-flex items-center rounded-full border px-6 py-2.5 text-[10px] font-black tracking-[0.5em] uppercase backdrop-blur-md",
                isDark ? "bg-primary/10 border-primary/30 text-primary" : "bg-primary/5 border-primary/20 text-primary shadow-sm"
              )}>
                <Sparkles className="mr-3 h-4 w-4 animate-pulse" />
                Neural PC Architect v2.0
              </div>
            </div>

            <h1 className="font-headline text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter mb-8 md:mb-10 leading-[0.9] md:leading-[0.8] uppercase">
              Build Your <br />
              <CanvasText
                text="MASTERPIECE"
                className="italic text-primary font-headline"
                backgroundClassName="bg-blue-600 dark:bg-blue-900"
                colors={[
                  "rgba(34, 211, 238, 1)", // Cyan
                ]}
                animationDuration={12}
                lineGap={5}
                curveIntensity={35}
              /><br className="hidden sm:block" />
              With <span className={isDark ? "text-foreground" : "text-slate-900"}>AI</span>
            </h1>

            <p className={cn(
              "max-w-xl text-lg md:text-2xl mb-10 md:mb-14 leading-relaxed font-medium opacity-90",
              isDark ? "text-slate-300" : "text-slate-600"
            )}>
              Forge high-performance machines with neural bottleneck diagnostics, intelligent hardware critique, and precision part matching.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 md:gap-8">
              <Button asChild size="lg" className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-12 text-lg md:text-xl rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(34,211,238,0.3)] transition-all hover:scale-[1.05] active:scale-[0.95] bg-primary hover:bg-primary/90 text-white border-none">
                <Link href="/signin" className="flex items-center gap-4">
                  Initialize Builder <LayoutPanelLeft className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
              </Button>
              <SparkleButton 
                asChild 
                className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-12 text-sm md:text-base uppercase tracking-[0.3em] md:tracking-[0.4em] rounded-xl md:rounded-2xl font-black transition-all hover:scale-[1.05] active:scale-[0.95]"
                icon={<Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
              >
                <Link href="/signin">
                  AI ADVISOR
                </Link>
              </SparkleButton>
            </div>
          </motion.div>

          {/* Right Asset (HUD Elements) */}
          <div className="relative hidden lg:block">
            {/* Floating HUD Container */}
            <div className="relative h-[600px] w-full">
              {/* Center Core HUD */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-primary/20 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full border border-primary/10 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="w-48 h-48 rounded-full bg-primary/5 backdrop-blur-xl border border-primary/30 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                  <Bot className="w-12 h-12 text-primary mb-4 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Neural Core</span>
                  <span className="text-xl font-headline font-bold">READY</span>
                </div>
              </motion.div>

              {/* Satellite HUD 1 */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] right-[10%] p-6 rounded-3xl border border-primary/20 bg-background/40 backdrop-blur-2xl shadow-2xl z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] mb-1">Architecture</p>
                    <p className="text-2xl font-black font-headline text-primary">OPTIMIZED</p>
                  </div>
                </div>
              </motion.div>

              {/* Satellite HUD 2 */}
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[10%] left-[10%] p-6 rounded-3xl border border-purple-500/20 bg-background/40 backdrop-blur-2xl shadow-2xl z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] mb-1">Bottleneck</p>
                    <p className="text-2xl font-black font-headline text-purple-400">0.02%</p>
                  </div>
                </div>
              </motion.div>

              {/* Visual Connector Lines (Simulated with div) */}
              <div className="absolute top-[30%] left-[20%] w-px h-32 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 rotate-45 opacity-30" />
              <div className="absolute bottom-[30%] right-[20%] w-px h-32 bg-gradient-to-b from-purple-500/0 via-purple-500/40 to-purple-500/0 -rotate-45 opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
