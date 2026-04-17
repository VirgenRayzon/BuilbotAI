'use client';

import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import { Cpu, Layers, Zap } from "lucide-react";

export function VisualizerPreview() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn(
            "w-full h-full flex items-center justify-center relative overflow-hidden transition-colors duration-500",
            isDark ? "bg-[#0c0f14]" : "bg-slate-50"
        )}>
            {/* Grid Background */}
            <div className={cn(
                "absolute inset-0 opacity-[0.03] pointer-events-none",
                isDark ? "invert" : ""
            )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />

            {/* Neural Scan Beam */}
            <motion.div
                className={cn(
                    "absolute inset-x-0 h-[2px] z-30 pointer-events-none opacity-40",
                    isDark ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                )}
                animate={{
                    top: ["0%", "100%", "0%"],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* "Mock" PC Case Frame */}
            <motion.div
                className={cn(
                    "w-4/5 h-4/5 border-2 rounded-3xl relative flex items-center justify-center z-10 shadow-2xl backdrop-blur-sm overflow-hidden group",
                    isDark ? "bg-slate-900/40 border-white/10 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/20"
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
            >
                {/* Component Outlines with Hover States */}
                <motion.div 
                    whileHover={{ scale: 1.05, backgroundColor: isDark ? "rgba(34,211,238,0.1)" : "rgba(34,211,238,0.05)" }}
                    className={cn(
                        "absolute top-6 left-6 w-1/3 h-1/2 border rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-help",
                        isDark ? "bg-cyan-500/5 border-cyan-500/20" : "bg-cyan-500/5 border-cyan-500/30"
                    )}
                >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/20">
                        <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-cyan-400 font-black tracking-[0.2em] uppercase">Mobo_V2</span>
                        <span className="text-[7px] text-cyan-400/60 font-mono">READY</span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, backgroundColor: isDark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.05)" }}
                    className={cn(
                        "absolute bottom-8 left-6 w-2/3 h-1/4 border rounded-xl flex items-center justify-center gap-4 transition-all duration-300 cursor-help",
                        isDark ? "bg-purple-500/5 border-purple-500/20" : "bg-purple-500/5 border-purple-500/30"
                    )}
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Layers className="w-4 h-4 text-purple-400" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-purple-400 font-black tracking-[0.2em] uppercase">GPU_CLEARANCE_ENGINE</span>
                        <div className="flex gap-1 mt-0.5">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="w-1.5 h-1 bg-purple-400/40 rounded-full" />
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ scale: 1.05, backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.05)" }}
                    className={cn(
                        "absolute top-6 right-6 w-1/4 h-2/3 border rounded-xl flex items-center justify-center transition-all duration-300 cursor-help",
                        isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-500/5 border-blue-500/30"
                    )}
                >
                    <span className="text-[9px] text-blue-400 font-black tracking-[0.3em] uppercase [writing-mode:vertical-lr] flex items-center gap-2">
                        <Zap className="w-3 h-3 rotate-90" />
                        RAD_THERMAL_SYNC
                    </span>
                </motion.div>

                {/* Tech Lines Decoration */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0 20 L 20 20 L 30 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                        <path d="M 100 80 L 80 80 L 70 70" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                        <path d="M 20 100 L 20 80 L 30 70" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                    </svg>
                </div>
            </motion.div>

            {/* Floating Diagnostic Bits */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                    animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-1/4 right-1/4 text-[8px] font-mono text-primary/40 uppercase tracking-tighter"
                >
                    &lt;SYNC_OK&gt;
                </motion.div>
                <motion.div 
                    animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-1/4 left-1/4 text-[8px] font-mono text-purple-400/40 uppercase tracking-tighter"
                >
                    &lt;SCANNING_P_CORE&gt;
                </motion.div>
            </div>

            {/* Background Glows */}
            <div className={cn(
                "absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] opacity-20",
                isDark ? "bg-primary" : "bg-primary/40"
            )} />
            <div className={cn(
                "absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-20",
                isDark ? "bg-purple-500" : "bg-purple-500/40"
            )} />
        </div>
    );
}
