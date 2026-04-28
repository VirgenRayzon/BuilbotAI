"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border mt-32 font-body relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20"></div>

      <div className="max-w-[1800px] w-full mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-8 space-y-6">
            <Logo />
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              The ultimate AI-driven PC building platform. Real-time hardware synthesis,
              AI analysis, and smart AI recommendations for the next generation of hardware
              enthusiasts and professionals.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold">TW</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold">IG</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold">DC</span>
              </div>
            </div>
          </div>

          {/* Links Columns - Now on the Right */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Platform</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/builder" className="text-sm text-muted-foreground hover:text-primary transition-colors">Builder</Link>
              <Link href="/pre-builts" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pre-builts</Link>
              <Link href="/ai-build-advisor" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI Advisor</Link>
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">Inventory</Link>
            </nav>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Support</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Guides</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>
        </div>

        {/* Big Text Section */}
        <div className="relative pt-12 pb-24 overflow-hidden select-none pointer-events-none">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="text-[12vw] md:text-[14vw] font-black font-headline text-center leading-none tracking-tighter text-foreground/[0.03] dark:text-white/[0.03] uppercase italic"
          >
            BuildbotAI
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-[2vw] md:text-[1.5vw] font-bold uppercase tracking-[0.5em] text-primary/40 text-center"
            >
              Next-Gen PC Synthesis
            </motion.p>
          </div>
        </div>

        {/* Bottom Legal Section */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          <p>&copy; {currentYear} Buildbot AI. All systems operational.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    </footer>
  );
}
