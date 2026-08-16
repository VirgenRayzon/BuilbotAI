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
    critiqueDuration: number | null;
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
    critiqueDuration,
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
            {/* Sidebar Column - Left (Consistent with main Builder Page) */}
            <div className="lg:col-span-3">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
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

            {/* Performance Diagnostics Column - Right */}
            <div className="lg:col-span-9 h-full">
                <AIBuildCritique
                    build={builderState}
                    externalAnalysis={critiqueAnalysis}
                    externalDuration={critiqueDuration}
                    externalLoading={critiqueLoading}
                    externalError={critiqueError}
                    onRefresh={() => handleCritique(builderState, true, { 
                        intendedUse: workload, 
                        performanceLevel: resolution 
                    })}
                    onCancel={handleCancelCritique}
                    intendedUse={workload}
                    performanceLevel={resolution}
                    className="mt-0"
                />
            </div>
        </div>
    );
}
