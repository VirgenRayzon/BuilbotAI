'use client';

import { motion } from "framer-motion";

export function VisualizerPreview() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900/50 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-grid-slate-900/50 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]" />

            {/* "Mock" PC Case Frame */}
            <motion.div
                className="w-4/5 h-4/5 border-2 border-white/20 rounded-lg relative flex items-center justify-center z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                {/* Component Outlines */}
                <div className="absolute top-4 left-4 w-1/3 h-1/2 border border-primary/40 bg-primary/5 rounded flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/20 animate-pulse" />
                    <span className="text-[10px] text-primary/60 font-mono tracking-tighter uppercase font-bold">Motherboard</span>
                </div>

                <motion.div
                    className="absolute bottom-8 left-4 w-2/3 h-1/4 border border-purple-500/40 bg-purple-500/5 rounded flex items-center justify-center gap-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="text-[10px] text-purple-500/60 font-mono tracking-tighter uppercase font-bold">GPU Clearance Check</span>
                </motion.div>

                <div className="absolute top-4 right-4 w-1/4 h-2/3 border border-blue-500/40 bg-blue-500/5 rounded flex items-center justify-center">
                    <span className="text-[10px] text-blue-500/60 font-mono tracking-tighter uppercase font-bold [writing-mode:vertical-lr]">Radiator Fit</span>
                </div>

                {/* Scanning Line */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-1"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* Background Glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
    );
}
