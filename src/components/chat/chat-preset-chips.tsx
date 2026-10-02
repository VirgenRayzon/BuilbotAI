import React from "react";
import { motion } from "framer-motion";
import { Monitor, Cpu, HardDrive, Zap, CheckCircle2, Gauge, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPresetChipsProps {
    hasBuildParts: boolean;
    isDark: boolean;
    onPresetClick: (text: string) => void;
}

export function ChatPresetChips({ hasBuildParts, isDark, onPresetClick }: ChatPresetChipsProps) {
    const buildPresets = [
        { text: "Check my current build for compatibility", icon: <CheckCircle2 className="w-3 h-3 text-cyan-400" /> },
        { text: "Calculate CPU/GPU bottleneck for my build", icon: <Gauge className="w-3 h-3 text-amber-400" /> },
        { text: "Is my power supply wattage sufficient?", icon: <Zap className="w-3 h-3 text-yellow-400" /> },
        { text: "What component should I upgrade next?", icon: <Scale className="w-3 h-3 text-blue-400" /> },
    ];

    const generalPresets = [
        { text: "Recommend me a GPU", icon: <Monitor className="w-3 h-3 text-cyan-400" /> },
        { text: "Best CPU for gaming?", icon: <Cpu className="w-3 h-3 text-blue-400" /> },
        { text: "SSD vs HDD for my build", icon: <HardDrive className="w-3 h-3 text-emerald-400" /> },
        { text: "Check part compatibility rules", icon: <Zap className="w-3 h-3 text-yellow-400" /> },
    ];

    const presets = hasBuildParts ? buildPresets : generalPresets;

    return (
        <div className="w-full overflow-hidden mb-1">
            <div className="flex flex-wrap gap-1.5 w-full">
                {presets.map((preset, idx) => (
                    <motion.button
                        key={preset.text}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.2 }}
                        onClick={() => onPresetClick(preset.text)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer",
                            isDark
                                ? "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                                : "bg-white border-border/60 text-zinc-600 hover:bg-cyan-50 hover:border-cyan-400/40 hover:text-cyan-700"
                        )}
                    >
                        {preset.icon}
                        <span>{preset.text}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
