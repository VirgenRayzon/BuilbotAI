"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/context/user-profile';
import Link from 'next/link';
import { Loader2, ArrowRight, Cpu, Sparkles, MonitorSmartphone, Zap, ShieldCheck, Box, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { VisualizerPreview } from '@/components/landing/visualizer-preview';
import { PrebuiltShowcase } from '@/components/landing/prebuilt-showcase';

export default function StartPage() {
  const { authUser, profile, loading } = useUserProfile();
  const router = useRouter();

  // Redirect based on role
  useEffect(() => {
    if (!loading && authUser) {
      if (profile?.isManager) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    }
  }, [authUser, profile, loading, router]);

  if (loading || authUser) {
    return (
      <div className="flex items-center justify-center min-vh-screen bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-900/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] -z-10 animate-pulse delay-1000" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8 tracking-widest uppercase animate-sparkle">
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                THE FUTURE OF PC BUILDING
              </div>

              <h1 className="font-headline text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl mb-6 leading-[0.9]">
                Build Your <br /> <span className="text-gradient">Masterpiece</span> <br /> with AI
              </h1>

              <p className="max-w-xl text-lg text-slate-400 mb-10 leading-relaxed font-light">
                BuildbotAI is a PC building platform with a real-time 2D clearance engine, bottleneck AI, and intelligent part critiques.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full font-semibold shadow-[0_0_30px_-5px_var(--theme-primary)] hover:shadow-[0_0_40px_-5px_var(--theme-primary)] transition-all">
                  <Link href="/signin">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-[12px] uppercase tracking-widest rounded-full font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-md relative overflow-hidden group/advisor">
                  <Link href="/signin" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary animate-sparkle" />
                    AI Advisor
                    <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-0 group-hover/advisor:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Asset (PC Visual) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 w-full aspect-square max-w-[600px] ml-auto">
                <img
                  src="/hero-pc.png"
                  alt="High-end Custom PC"
                  className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(45,212,191,0.3)] animate-float"
                />
              </div>
              {/* Floating Stats Orbs */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-8 glass-panel p-4 rounded-2xl border-primary/30 z-20 backdrop-blur-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Efficiency</p>
                    <p className="text-sm font-bold">98.4%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-1/4 right-0 glass-panel p-4 rounded-2xl border-purple-500/30 z-20 backdrop-blur-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Bottleneck</p>
                    <p className="text-sm font-bold">0% Detected</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            badge="Advanced Engineering"
            title="Smarter Than Your Average Builder"
            subtitle="BuildbotAI doesn't just list parts—it understands how they work together."
          />

          <FeatureShowcase
            title="Real-Time 2D Clearance Engine"
            description="Our proprietary engine maps component dimensions (GPU length, CPU cooler height, PSU depth) directly against case frames in real-time. No more guessing—if it fits in Buildbot, it fits on your desk."
            visual={<VisualizerPreview />}
          />

          <FeatureShowcase
            reversed
            title="Intelligent Bottleneck Analysis"
            description="Shift between 1080p, 1440p, and 4K workload projections. Our AI analyzes the compute tier of your CPU vs your GPU to warn you if components will choke performance before you spend a dime."
            visual={
              <div className="w-full h-full flex flex-col justify-center p-8 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-purple-400">Resolution: 1440p</span>
                  <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "85%" }}
                    transition={{ duration: 1.5, delay: 1 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>CPU UTILIZATION</span>
                  <span>85% (Optimized)</span>
                </div>
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: "98%" }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>GPU UTILIZATION</span>
                  <span>98% (Maximum Potential)</span>
                </div>
              </div>
            }
          />

          <FeatureShowcase
            title="LLM-Powered Component Critique"
            description="Not sure if a specific AIO is overkill for your CPU? Ask the Buildbot! Our integrated AI analyzes your entire hardware cart for value, thermal efficiency, and generational compatibility."
            visual={
              <div className="w-full h-full flex items-center justify-center p-8">
                <div className="glass-panel rounded-xl p-4 w-full border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Buildbot AI Critique</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-serif italic">
                    "Excellent choice with the Ryzen 7 7800X3D. However, the 360mm AIO is slightly overkill for this 120W TDP chip. Consider a 240mm unit to save $40 for a better NVMe drive..."
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* Prebuilt Showcase */}
      <PrebuiltShowcase />

      {/* New: Pre-builts & Accessories */}
      <section className="py-24 bg-white/5 relative border-y border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeader
            badge="Curated Experiences"
            title="Beyond Just Parts"
            subtitle="Whether you want to build from scratch or buy ready-to-ship, we've got you covered."
          />

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel p-8 rounded-3xl flex flex-col gap-6 group hover:border-primary/50 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary animate-pulse z-20"></div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                <Box className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-2">Ready-to-Play Prebuilts</h4>
                <p className="text-slate-400">Professionally curated systems, built by experts using our AI validation tools. Guaranteed performance out of the box.</p>
              </div>
              <Button asChild variant="link" className="text-primary p-0 h-auto justify-start w-fit group">
                <Link href="/pre-builts" className="flex items-center">
                  Browse Systems <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel p-8 rounded-3xl flex flex-col gap-6 group hover:border-purple-500/50 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-purple-500/50 to-purple-500 animate-pulse z-20"></div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                <MonitorSmartphone className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-2">The Full Setup</h4>
                <p className="text-slate-400">Beyond the tower. Buildbot now helps you pick the perfect Monitor, Keyboard, Mouse, and Headset to complete your battlestation.</p>
              </div>
              <Button asChild variant="link" className="text-purple-400 p-0 h-auto justify-start w-fit group">
                <Link href="/builder" className="flex items-center">
                  Explore Accessories <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-headline mb-8">Ready to Build Your <span className="text-gradient">Endgame</span>?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">Start using BuildbotAI and craft a perfectly optimized, high-performance machines.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button asChild size="lg" className="h-16 px-10 text-xl rounded-full">
              <Link href="/signin">Launch Builder</Link>
            </Button>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">100%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Clearance Guarantee</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">AI</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Validated Builds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
