import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TelemetryInfo } from "./types";

interface ChatTelemetryDrawerProps {
    telemetry: TelemetryInfo;
    isDark: boolean;
    allTelemetry: TelemetryInfo[];
    isOpen: boolean;
}

export function ChatTelemetryDrawer({ telemetry, isDark, allTelemetry, isOpen }: ChatTelemetryDrawerProps) {
    const averageTat = allTelemetry.length > 0
        ? allTelemetry.reduce((sum, item) => sum + item.tatMs, 0) / allTelemetry.length
        : 0;

    const tatSeconds = telemetry.tatMs / 1000;
    const ttftSeconds = telemetry.ttftMs / 1000;
    const diff = averageTat > 0 ? (averageTat - telemetry.tatMs) / 1000 : 0;
    const isFaster = diff > 0;
    const diffText = diff !== 0
        ? `${Math.abs(diff).toFixed(1)}s ${isFaster ? 'faster' : 'slower'} than avg`
        : 'On par with average';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.98 }}
                    animate={{ height: "auto", opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden mt-1.5 w-full max-w-[85%] sm:max-w-[80%]"
                >
                    <div className={cn(
                        "p-3 rounded-xl border backdrop-blur-md font-mono text-[10px] space-y-2 shadow-md",
                        isDark
                            ? "bg-black/60 border-cyan-500/25 text-zinc-300 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                            : "bg-white/95 border-cyan-500/15 text-zinc-600 shadow-sm"
                    )}>
                        <div className="flex justify-between items-center border-b border-white/5 pb-1">
                            <span className="text-[10px] uppercase font-bold text-cyan-400/90 tracking-wider">Telemetry Diagnostics</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                isFaster
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}>
                                {isFaster ? "Optimal" : "Nominal"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 py-0.5">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 uppercase">First Token (TTFT)</span>
                                <span className="font-semibold text-zinc-200">{ttftSeconds.toFixed(2)}s</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 uppercase">Knowledge Lookup</span>
                                <span className="font-semibold text-zinc-200">{telemetry.kbLookupMs}ms</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 uppercase">Total Execution</span>
                                <span className="font-semibold text-zinc-200">{tatSeconds.toFixed(2)}s</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 uppercase">Token Velocity</span>
                                <span className="font-semibold text-zinc-200">{telemetry.tokensPerSecond} tok/s</span>
                            </div>
                            <div className="flex flex-col col-span-2 border-t border-white/5 pt-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] text-zinc-500 uppercase">Tokens Generated</span>
                                    <span className="font-semibold text-cyan-400">{telemetry.tokensUsed} tokens</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-1.5 border-t border-white/5 flex items-center gap-1 text-[9px] text-zinc-400 font-sans">
                            <span className={isFaster ? "text-emerald-400" : "text-amber-400"}>
                                {isFaster ? "▲" : "▼"}
                            </span>
                            <span>{diffText}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
