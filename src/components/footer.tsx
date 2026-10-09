"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden transition-colors duration-1000 mt-32 font-body border-t border-slate-200/80 dark:border-white/10">
      <div className="w-full pt-20 pb-12 px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-8 space-y-5">
            <Logo />
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed font-medium">
              The premier AI-assisted custom PC building platform. Intelligent hardware compatibility verification,
              real-time bottleneck analysis, and smart component recommendations.
            </p>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">X</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">GH</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">DC</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400 font-headline">Platform</h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/builder" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">PC Builder</Link>
              <Link href="/pre-builts" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Pre-Built Systems</Link>
              <Link href="/ai-build-advisor" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">AI Advisor</Link>
              <Link href="/admin" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Inventory Portal</Link>
            </nav>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400 font-headline">Support</h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/faq" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Help Center & FAQ</Link>
              <Link href="/about" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">About BuildbotAI</Link>
              <Link href="/team" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Engineering Team</Link>
              <Link href="/contact" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Contact Support</Link>
            </nav>
          </div>
        </div>

        {/* Big Text Section */}
        <div className="relative pt-8 pb-16 overflow-hidden select-none pointer-events-none">
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="text-[12vw] md:text-[14vw] font-black font-headline text-center leading-none tracking-tighter text-slate-900/[0.03] dark:text-white/[0.03] uppercase italic"
          >
            BuildbotAI
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-[1.8vw] md:text-[1.3vw] font-black font-headline uppercase tracking-[0.5em] text-cyan-600/40 dark:text-cyan-400/40 text-center"
            >
              Intelligent PC Customizer
            </motion.p>
          </div>
        </div>

        {/* Bottom Legal Section */}
        <div className="pt-8 border-t border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <p>&copy; {currentYear} BuildbotAI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
