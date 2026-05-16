"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutPanelLeft, CircuitBoard } from 'lucide-react';
import { AIBuildCritique } from "@/components/ai-build-critique";
import { YourBuild } from "@/components/your-build";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CritiqueTabProps {
    isDark: boolean;
    builderState: any;
    critiqueAnalysis: any;
    critiqueLoading: boolean;
    critiqueError: string | null;
    handleCritique: (state: any, force?: boolean, preferences?: { intendedUse?: string; performanceLevel?: string; additionalNotes?: string }) => void;
    handleCancelCritique: () => void;
    handleRemovePart: (cat: string, idx?: number) => void;
    handleClearBuild: () => void;
    resolution: any;
    setResolution: any;
    workload: any;
    setWorkload: any;
}

export function CritiqueTab({
    isDark,
    builderState,
    critiqueAnalysis,
    critiqueLoading,
    critiqueError,
    handleCritique,
    handleCancelCritique,
    handleRemovePart,
    handleClearBuild,
    resolution,
    setResolution,
    workload,
    setWorkload
}: CritiqueTabProps) {
    const router = useRouter();

    return (
        <div className="grid lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-9">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "rounded-3xl border backdrop-blur-xl h-full min-h-[600px] overflow-hidden shadow-2xl",
                        isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
                    )}
                >
                    <div className="p-8 border-b border-border/50 bg-background/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <LayoutPanelLeft className="w-6 h-6 text-primary" />
                                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Performance Diagnostics</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                                    <CircuitBoard className="w-3 h-3" />
                                    Live Analysis
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 md:p-6">
                        <AIBuildCritique
                            build={builderState}
                            externalAnalysis={critiqueAnalysis}
                            externalLoading={critiqueLoading}
                            externalError={critiqueError}
                            onRefresh={() => handleCritique(builderState, true, { 
                                intendedUse: workload, 
                                performanceLevel: resolution 
                            })}
                            onCancel={handleCancelCritique}
                            intendedUse={workload}
                            performanceLevel={resolution}
                        />
                    </div>
                </motion.div>
            </div>

            <div className="lg:col-span-3">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-6 pb-4"
                >
                    <YourBuild
                        build={builderState}
                        onClearBuild={handleClearBuild}
                        onRemovePart={handleRemovePart}
                        onAnalyze={() => handleCritique(builderState, false, { 
                            intendedUse: workload, 
                            performanceLevel: resolution 
                        })}
                        resolution={resolution}
                        onResolutionChange={setResolution}
                        workload={workload}
                        onWorkloadChange={setWorkload}
                        showSystemBalance={false}
                        analysis={critiqueAnalysis}
                        onCategorySelect={(cat) => router.push(`/builder?category=${cat}`)}
                    />
                </motion.div>
            </div>
        </div>
    );
}
