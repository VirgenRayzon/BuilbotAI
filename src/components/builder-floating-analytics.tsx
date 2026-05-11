"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedIconButton, AnimatedActivityIcon, AnimatedXIcon } from "./ui/animated-icons";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BuilderFloatingAnalyticsProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (type: WorkloadType) => void;
    analysis?: any;
    onApplySuggestion?: (category: string, partId: string) => void;
}

export function BuilderFloatingAnalytics({
    build,
    resolution,
    onResolutionChange,
    workload,
    onWorkloadChange,
    analysis,
    onApplySuggestion
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
        <div className="fixed bottom-[88px] left-6 sm:bottom-[104px] sm:left-6 z-50 flex flex-col items-start gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        className="w-[calc(100vw-2rem)] sm:w-[440px] mb-4"
                    >
                        <div className="flex flex-col bg-transparent">
                            {/* Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[90vh]">
                                <BuilderSidebarLeft
                                    build={build}
                                    resolution={resolution}
                                    onResolutionChange={onResolutionChange}
                                    workload={workload}
                                    onWorkloadChange={onWorkloadChange}
                                    analysis={analysis}
                                    onApplySuggestion={onApplySuggestion}
                                    onClose={() => setIsOpen(false)}
                                    className="gap-0"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 blur opacity-40 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <AnimatedIconButton
                    onClick={toggleOpen}
                    variant={isOpen ? 'destructive' : 'primary'}
                    className="h-14 w-14 sm:h-16 sm:w-16 p-0 shadow-[0_0_40px_rgba(6,182,212,0.5)] border-white/20 bg-gradient-to-tr from-cyan-600/90 to-blue-600/90 backdrop-blur-xl"
                    icon={isOpen ? <AnimatedXIcon size={24} className="text-white" /> : <AnimatedActivityIcon size={24} className="text-white" />}
                />
                
                {/* Tooltip-like label */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Live Analytics</span>
                </div>
            </div>
        </div>
    );
}
