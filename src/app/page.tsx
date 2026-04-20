"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/context/user-profile';
import Link from 'next/link';
import { Loader2, ArrowRight, Cpu, Sparkles, MonitorSmartphone, Zap, ShieldCheck, Box, Headphones, Layers, LayoutPanelLeft, CheckCircle2, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { VisualizerPreview } from '@/components/landing/visualizer-preview';
import { PrebuiltShowcase } from '@/components/landing/prebuilt-showcase';
import { useTheme } from '@/context/theme-provider';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { FullPageLoader } from '@/components/full-page-loader';

export default function StartPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { authUser, profile, loading } = useUserProfile();
  const router = useRouter();

  // Redirect based on role
  useEffect(() => {
    if (!loading && authUser) {
      if (profile?.isSuperAdmin || profile?.isManager) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    }
  }, [authUser, profile, loading, router]);

  const { setIsPageLoading } = useLoading();

  useEffect(() => {
    setIsPageLoading(loading || !!authUser);
    return () => setIsPageLoading(false);
  }, [loading, authUser, setIsPageLoading]);

  if (loading || authUser) {
    return null;
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 overflow-x-hidden",
      isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
    )}>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className={cn(
          "absolute inset-0 opacity-30",
          isDark 
            ? "bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_50%)]" 
            : "bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"
        )} />
        
        {/* Circuit Pattern Background (Simulated with CSS) */}
        <div className={cn(
          "absolute inset-0 opacity-[0.03] pointer-events-none",
          isDark ? "invert" : ""
        )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-[1800px] w-full relative z-10 mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-10 bg-primary" />
                <div className={cn(
                    "inline-flex items-center rounded-full border px-5 py-2 text-[10px] font-black tracking-[0.4em] uppercase",
                    isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/5 border-primary/10 text-primary shadow-sm"
                )}>
                  <Sparkles className="mr-2.5 h-3.5 w-3.5 animate-pulse" />
                  Neural PC Architect v2.0
                </div>
              </div>

              <h1 className="font-headline text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl mb-8 leading-[0.85] uppercase">
                Build Your <br /> 
                <span className="text-primary italic">Masterpiece</span> <br /> 
                With <span className={isDark ? "text-white" : "text-slate-900"}>AI</span>
              </h1>

              <p className={cn(
                "max-w-xl text-xl md:text-2xl mb-12 leading-relaxed font-medium",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>
                Forge high-performance machines with a real-time <span className="text-primary font-bold">3D Clearance Visualizer</span>, neural bottleneck diagnostics, and intelligent hardware critique.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-6">
                <Button asChild size="lg" className="h-16 px-10 text-lg rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90 text-white">
                  <Link href="/signin" className="flex items-center gap-3">
                    Initialize Builder <LayoutPanelLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className={cn(
                  "h-16 px-10 text-[11px] uppercase tracking-[0.3em] rounded-2xl font-black border-2 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md relative overflow-hidden group/advisor",
                  isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                )}>
                  <Link href="/signin" className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    AI Advisor
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/advisor:translate-x-full transition-transform duration-1000" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Asset (PC Visual) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="relative perspective-1000"
            >
              <div className="relative z-10 w-full aspect-square max-w-[700px] ml-auto">
                {/* Visual Glow */}
                <div className={cn(
                    "absolute inset-0 rounded-full blur-[120px] opacity-20 animate-pulse",
                    isDark ? "bg-primary" : "bg-primary/40"
                )} />
                
                <img
                  src="/hero-pc.png"
                  alt="High-end Custom PC"
                  className="w-full h-full object-contain drop-shadow-[0_0_80px_rgba(34,211,238,0.2)] animate-float relative z-10"
                />
                
                {/* Floating HUD Elements */}
                <motion.div
                    animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "absolute top-[15%] -left-4 p-5 rounded-2xl border backdrop-blur-2xl z-20 shadow-2xl",
                        isDark ? "bg-slate-900/60 border-white/10 shadow-black/40" : "bg-white/80 border-slate-200 shadow-slate-200/20"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                            <Cpu className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-0.5">Core Efficiency</p>
                            <p className="text-lg font-black font-headline tracking-tight">99.8<span className="text-[10px] text-primary ml-0.5">%</span></p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className={cn(
                        "absolute bottom-[20%] -right-4 p-5 rounded-2xl border backdrop-blur-2xl z-20 shadow-2xl",
                        isDark ? "bg-slate-900/60 border-white/10 shadow-black/40" : "bg-white/80 border-slate-200 shadow-slate-200/20"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-0.5">Synergy Diagnostic</p>
                            <p className="text-lg font-black font-headline tracking-tight">OPTIMIZED</p>
                        </div>
                    </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className={cn(
          "py-32 relative transition-colors duration-500",
          isDark ? "bg-[#0c0f14]" : "bg-white"
      )}>
        <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8">
          <SectionHeader
            badge="Advanced Engineering"
            title="Beyond Simple Compatibility"
            subtitle="BuildbotAI doesn't just list parts—it understands the physical and technical interplay of your entire architecture."
          />

          <FeatureShowcase
            title="3D Real-time Visualizer"
            description="Experience your build before the first screw is turned. Our immersive 3D engine simulates component clearance, cable routing paths, and thermal zones in a high-fidelity environment."
            visual={<VisualizerPreview />}
          />

          <FeatureShowcase
            reversed
            title="Neural Bottleneck Analysis"
            description="Shift between 1080p, 1440p, and 4K workload projections. Our AI analyzes the compute tier of your CPU vs your GPU to warn you if components will choke performance before you spend a dime."
            visual={
              <div className="w-full h-full flex flex-col justify-center p-12 gap-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Resolution Target: 4K UHD</span>
                  </div>
                  <Zap className="w-5 h-5 text-primary animate-pulse" />
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>Compute Unit Utilization</span>
                            <span className="text-primary">98% PEAK</span>
                        </div>
                        <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/5">
                            <motion.div
                                className="h-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                initial={{ width: 0 }}
                                whileInView={{ width: "98%" }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>Graphics Throughput</span>
                            <span className="text-purple-400">100% MAXIMUM</span>
                        </div>
                        <div className="h-2 w-full bg-purple-500/10 rounded-full overflow-hidden border border-purple-500/5">
                            <motion.div
                                className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                transition={{ duration: 1.5, delay: 0.7 }}
                            />
                        </div>
                    </div>
                </div>
                
                <div className={cn(
                    "mt-4 p-3 rounded-xl border flex items-center gap-3",
                    isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                )}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Zero Bottleneck Detected at target resolution</span>
                </div>
              </div>
            }
          />

          <FeatureShowcase
            title="Buildbot Build Critique"
            description="Not sure if a specific AIO is overkill for your CPU? Our Buildbot Critique analyzes your entire hardware selection for value, thermal efficiency, and generational compatibility, providing professional feedback on every choice."
            visual={
              <div className="w-full h-full flex items-center justify-center p-12">
                <div className={cn(
                    "rounded-2xl p-6 w-full border relative overflow-hidden",
                    isDark ? "bg-slate-900/60 border-primary/20" : "bg-white border-primary/20 shadow-xl"
                )}>
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Buildbot Intelligence Matrix</span>
                  </div>
                  <p className={cn(
                      "text-sm md:text-base leading-relaxed font-medium italic",
                      isDark ? "text-slate-300" : "text-slate-700"
                  )}>
                    "Architectural Scan Complete: The Ryzen 7 7800X3D choice is optimal for your gaming profile. However, the selected 360mm AIO exceeds thermal requirements for this 120W TDP chip. Consider a 240mm unit to reallocate $45 towards a faster NVMe storage tier..."
                  </p>
                </div>
              </div>
            }
          />

          <FeatureShowcase
            reversed
            title="Instant AI Build Generation"
            description="Tell Buildbot your budget, favorite games, and performance goals. Within seconds, our neural engine architects a complete, perfectly matched build from our live inventory—zero research required."
            visual={
              <div className="w-full h-full flex flex-col justify-center p-12 gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Neural Architect Stream</span>
                </div>
                
                <div className="space-y-3">
                    {[
                        { text: "Scanning GPU market for better value...", icon: CheckCircle2, color: "text-emerald-500" },
                        { text: "CPU-Motherboard socket match: VERIFIED", icon: ShieldCheck, color: "text-blue-500" },
                        { text: "Suggestion: DDR5-6000 CL30 for optimal latency", icon: Zap, color: "text-purple-400" }
                    ].map((item, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 * i }}
                            className={cn(
                                "p-3 rounded-xl border flex items-center gap-3",
                                isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", item.color)} />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{item.text}</span>
                        </motion.div>
                    ))}
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* Prebuilt Showcase */}
      <PrebuiltShowcase />

      {/* New: Pre-builts & Accessories */}
      <section className={cn(
          "py-32 relative border-y transition-colors duration-500",
          isDark ? "bg-[#0c0f14] border-white/5" : "bg-white border-slate-100"
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
                  "p-10 rounded-[40px] border flex flex-col gap-8 group transition-all duration-500 relative overflow-hidden",
                  isDark ? "bg-slate-900/40 border-white/5 hover:border-primary/40" : "bg-slate-50 border-slate-200 hover:border-primary/30 shadow-xl shadow-slate-200/50"
              )}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Box className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="text-3xl font-black font-headline uppercase tracking-tight mb-3">Battle-Ready Rigs</h4>
                <p className={cn("text-lg font-medium leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
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
                "p-10 rounded-[40px] border flex flex-col gap-8 group transition-all duration-500 relative overflow-hidden",
                isDark ? "bg-slate-900/40 border-white/5 hover:border-purple-500/40" : "bg-slate-50 border-slate-200 hover:border-purple-500/30 shadow-xl shadow-slate-200/50"
              )}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-purple-500/50 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <MonitorSmartphone className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h4 className="text-3xl font-black font-headline uppercase tracking-tight mb-3">Total Command setup</h4>
                <p className={cn("text-lg font-medium leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
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

      {/* CTA Footer Section */}
      <section className={cn(
          "py-40 relative overflow-hidden transition-colors duration-500",
          isDark ? "bg-[#0c0f14]" : "bg-slate-50"
      )}>
        {/* Decorative Grid for CTA */}
        <div className={cn(
          "absolute inset-0 opacity-[0.03] pointer-events-none",
          isDark ? "invert" : ""
        )} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-8xl font-black font-headline mb-10 uppercase tracking-tighter leading-none">
                Ready to Build Your <br />
                <span className="text-primary italic">Endgame</span> Architecture?
            </h2>
            <p className={cn(
                "text-xl md:text-2xl mb-16 max-w-3xl mx-auto font-medium leading-relaxed",
                isDark ? "text-slate-400" : "text-slate-600"
            )}>
                Initialize the Neural PC Architect and begin crafting your perfectly optimized, high-performance machine today.
            </p>
            <div className="flex flex-col items-center gap-12">
                <Button asChild size="lg" className="h-20 px-16 text-2xl rounded-3xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(34,211,238,0.3)] transition-all hover:scale-[1.05] active:scale-[0.95] bg-primary hover:bg-primary/90 text-white border-none">
                <Link href="/signin">Launch Architect Matrix</Link>
                </Button>
                
                <div className="flex items-center gap-12 flex-wrap justify-center opacity-60">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl font-black font-headline tracking-tight">100%</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">Clearance Check</span>
                </div>
                <div className="w-px h-12 bg-border hidden md:block" />
                <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl font-black font-headline tracking-tight">NEURAL</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">AI Validation</span>
                </div>
                <div className="w-px h-12 bg-border hidden md:block" />
                <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl font-black font-headline tracking-tight">NEXT-GEN</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">UI Experience</span>
                </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
