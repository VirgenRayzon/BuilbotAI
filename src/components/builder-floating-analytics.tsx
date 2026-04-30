"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BuilderFloatingAnalyticsProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (type: WorkloadType) => void;
}

export function BuilderFloatingAnalytics({
    build,
    resolution,
    onResolutionChange,
    workload,
    onWorkloadChange
}: BuilderFloatingAnalyticsProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close when other floating actions open
    React.useEffect(() => {
        const handleOpen = (e: any) => {
            if (e.detail?.type !== 'analytics') {
                setIsOpen(false);
            }
        };
        window.addEventListener('floating-action-open', handleOpen);
        return () => window.removeEventListener('floating-action-open', handleOpen);
    }, []);

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            window.dispatchEvent(new CustomEvent('floating-action-open', { detail: { type: 'analytics' } }));
        }
    };

    return (
        <div className="fixed bottom-[112px] right-4 sm:bottom-[128px] sm:right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        className="w-[calc(100vw-2rem)] sm:w-[400px] mb-4"
                    >
                        <div className="flex flex-col bg-background/60 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-headline font-bold uppercase tracking-tight">System Analytics</h2>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setIsOpen(false)} 
                                    className="rounded-full hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <BuilderSidebarLeft
                                    build={build}
                                    resolution={resolution}
                                    onResolutionChange={onResolutionChange}
                                    workload={workload}
                                    onWorkloadChange={onWorkloadChange}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
            >
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 blur opacity-40 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <Button
                    onClick={toggleOpen}
                    className={cn(
                        "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.3)] border border-white/20 z-10 transition-all duration-300 p-0",
                        isOpen 
                            ? "bg-destructive hover:bg-destructive/90" 
                            : "bg-gradient-to-tr from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    )}
                >
                    {isOpen ? (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                </Button>
                
                {/* Tooltip-like label */}
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Live Analytics</span>
                </div>
            </motion.div>
        </div>
    );
}
