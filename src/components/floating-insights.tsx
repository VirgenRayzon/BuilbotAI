"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Cpu, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PCVisualizer } from "@/components/pc-visualizer";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { ComponentData, Resolution, WorkloadType } from "@/lib/types";

interface FloatingInsightsProps {
    isOpen: boolean;
    onClose: () => void;
    build: Record<string, any>;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (type: WorkloadType) => void;
    isPinned?: boolean;
    onTogglePin?: () => void;
}

export function FloatingInsights({
    isOpen,
    onClose,
    build,
    resolution,
    onResolutionChange,
    workload,
    onWorkloadChange,
    isPinned = false,
    onTogglePin
}: FloatingInsightsProps) {

    // If pinned, we just render the content without the floating container or backdrop
    // The parent layout will wrap it appropriately
    if (isPinned) {
        return (
            <div className="h-full flex flex-col bg-background/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-headline font-bold uppercase tracking-tight">Build Insights</h2>
                    </div>
                    {onTogglePin && (
                        <Button variant="ghost" size="icon" onClick={onTogglePin} className="rounded-full hover:bg-white/10" title="Unpin panel">
                            <PinOff className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-bold tracking-widest text-cyan-400 uppercase">Clearance Preview</h3>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-border shadow-inner bg-muted/20">
                            <PCVisualizer build={build} />
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-bold tracking-widest text-purple-400 uppercase">Analytics Engine</h3>
                        </div>
                        <BuilderSidebarLeft
                            build={build}
                            resolution={resolution}
                            onResolutionChange={onResolutionChange}
                            workload={workload}
                            onWorkloadChange={onWorkloadChange}
                        />
                    </section>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
                    />

                    {/* Floating Panel */}
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-20 left-4 bottom-4 w-[350px] md:w-[400px] bg-background/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-headline font-bold uppercase tracking-tight">Build Insights</h2>
                            </div>
                            <div className="flex items-center gap-1">
                                {onTogglePin && (
                                    <Button variant="ghost" size="icon" onClick={onTogglePin} className="rounded-full hover:bg-white/10 hidden lg:flex" title="Pin to sidebar">
                                        <Pin className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Cpu className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-sm font-bold tracking-widest text-cyan-400 uppercase">Clearance Preview</h3>
                                </div>
                        <div className="rounded-xl overflow-hidden border border-border shadow-inner bg-muted/20">
                            <PCVisualizer build={build} />
                        </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-purple-400" />
                                    <h3 className="text-sm font-bold tracking-widest text-purple-400 uppercase">Analytics Engine</h3>
                                </div>
                                <BuilderSidebarLeft
                                    build={build}
                                    resolution={resolution}
                                    onResolutionChange={onResolutionChange}
                                    workload={workload}
                                    onWorkloadChange={onWorkloadChange}
                                />
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
