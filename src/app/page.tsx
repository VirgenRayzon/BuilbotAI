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
import { PrebuiltShowcase } from '@/components/landing/prebuilt-showcase';
import { useTheme } from '@/context/theme-provider';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { FullPageLoader } from '@/components/full-page-loader';
import { CanvasText } from '@/components/ui/canvas-text';
import { SparkleButton } from '@/components/ui/sparkle-button';

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
      isDark ? "bg-background text-foreground" : "bg-white text-slate-900"
    )}>

      {/* Hero Section */}
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

        {/* Circuit Pattern Background (Simulated with CSS) */}
        <div className={cn(
          "absolute inset-0 opacity-[0.05] pointer-events-none z-0",
          isDark ? "invert" : ""
        )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />

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

      {/* Feature Showcase Section */}
      <section className={cn(
        "py-32 relative transition-colors duration-500",
        isDark ? "bg-background" : "bg-white"
      )}>
        <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8">
          <SectionHeader
            badge="Advanced Engineering"
            title="Beyond Simple Compatibility"
            subtitle="BuildbotAI doesn't just list parts—it understands the physical and technical interplay of your entire architecture."
          />

          <FeatureShowcase
            reversed={false}
            title="Neural Bottleneck Analysis"
            description="Shift between 1080p, 1440p, and 4K workload projections. Our AI analyzes the compute tier of your CPU vs your GPU to warn you if components will choke performance before you spend a dime."
            visual={
              <div className="relative w-full h-full overflow-hidden group">
                <img
                  src="/feature-1.webp"
                  alt="Neural Bottleneck Analysis"
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
                        <span>Compute Unit Utilization</span>
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
                        <span>Graphics Throughput</span>
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
            description="Not sure if a specific AIO is overkill for your CPU? Our Buildbot Critique analyzes your entire hardware selection for value, thermal efficiency, and generational compatibility, providing professional feedback on every choice."
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
                      "Architectural Scan Complete: The Ryzen 7 7800X3D choice is optimal. However, the 360mm AIO exceeds thermal requirements. Consider a 240mm unit to reallocate $45 towards faster NVMe..."
                    </p>
                  </div>
                </div>
              </div>
            }
          />

          <FeatureShowcase
            reversed={true}
            title="Instant AI Build Generation"
            description="Tell Buildbot your budget, favorite games, and performance goals. Within seconds, our neural engine architects a complete, perfectly matched build from our live inventory—zero research required."
            visual={
              <div className="relative w-full h-full overflow-hidden group">
                <img
                  src="/feature-3.webp"
                  alt="Instant AI Build Generation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 gap-3 items-end">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Neural Architect Stream</span>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-md">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3 w-full max-w-[280px]">
                    {[
                      { text: "Scanning GPU market...", icon: CheckCircle2, color: "text-emerald-500" },
                      { text: "Socket match: VERIFIED", icon: ShieldCheck, color: "text-blue-500" },
                      { text: "Optimizing DDR5 Latency", icon: Zap, color: "text-purple-400" }
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

      {/* Prebuilt Showcase */}
      <PrebuiltShowcase />

      {/* New: Pre-builts & Accessories */}
      <section className={cn(
        "py-32 relative border-y transition-colors duration-500",
        isDark ? "bg-background border-border/20" : "bg-muted/10 border-border/40"
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

      {/* CTA Footer Section */}
      <section className={cn(
        "py-40 relative overflow-hidden transition-colors duration-500",
        isDark ? "bg-background" : "bg-slate-50"
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
              Architecture?
            </h2>
            <p className={cn(
              "text-xl md:text-2xl mb-16 max-w-3xl mx-auto font-medium leading-relaxed",
              isDark ? "text-slate-400" : "text-slate-600"
            )}>
              Initialize the Neural PC Architect and begin crafting your perfectly optimized, high-performance machine today.
            </p>
            <div className="flex flex-col items-center gap-12">
              <SparkleButton 
                asChild
                icon={<Sparkles className="w-5 h-5 md:w-8 md:h-8 text-primary" />}
                className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-16 text-xl md:text-3xl rounded-2xl md:rounded-3xl font-black transition-all hover:scale-[1.05] active:scale-[0.95]"
              >
                <Link href="/signin">LAUNCH ARCHITECT MATRIX</Link>
              </SparkleButton>

              <div className="flex items-center gap-12 flex-wrap justify-center opacity-60">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl font-black font-headline tracking-tight">PRECISION</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">Part Matching</span>
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
