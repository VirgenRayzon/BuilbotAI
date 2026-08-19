"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { useLoading } from "@/context/loading-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

// Custom Hooks
import { useInventoryQuery } from "../builder/hooks/use-inventory-query";
import { useBuilderLogic } from "../builder/hooks/use-builder-logic";

// Components
import { YourBuildStandalone } from "./components/your-build-standalone";
import { RouteGuard } from "@/components/auth/route-guard";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";
import type { Resolution, WorkloadType } from "@/lib/types";

export default function TestBuilder2Page() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();

    // Data Layer
    const { allParts, loading: inventoryLoading } = useInventoryQuery();

    // Logic Layer
    const {
        build, handlePartToggle, handleRemovePart,
        handleClearBuild, getCountInBuild, isLoaded
    } = useBuilderLogic(allParts);

    const [resolution, setResolution] = useState<Resolution>('1080p');
    const [workload, setWorkload] = useState<WorkloadType>('Balanced');
    const [analysis, setAnalysis] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const handleApplySuggestion = (category: string, partId: string) => {
        const event = new CustomEvent('add-suggestion', {
            detail: { id: partId, category }
        });
        window.dispatchEvent(event);
    };

    useEffect(() => {
        setMounted(true);
    }, []);


    // Handle redirection to browse page on slot select
    const handleCategorySelect = (category: string) => {
        router.push(`/test-builder-2/browse?category=${category}`);
    };

    return (
        <RouteGuard requiredPermission="isSuperAdmin">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-background text-foreground" : "bg-white text-slate-900"
            )}>
                {/* Circuit Pattern Background */}
                <div className={cn(
                    "fixed inset-0 opacity-[0.05] pointer-events-none z-0",
                    isDark ? "invert" : ""
                )} style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 lg:pb-12 pt-10 md:pt-20 relative z-10">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">Layout A/B Testing</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Test Variant 2</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-headline font-bold uppercase tracking-tight text-foreground mt-2">
                                Standalone Build Panel
                            </h1>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Click on empty slots to browse, search, and filter parts in a dedicated catalog page.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/profile")}
                                className="rounded-xl h-9 text-[10px] font-headline font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10 transition-all"
                            >
                                Back to Settings
                            </Button>
                        </div>
                    </div>

                    <YourBuildStandalone
                        build={build}
                        onRemovePart={handleRemovePart}
                        onClearBuild={handleClearBuild}
                        resolution={resolution}
                        onResolutionChange={setResolution}
                        workload={workload}
                        onWorkloadChange={setWorkload}
                        analysis={analysis}
                        onAnalysisUpdate={setAnalysis}
                        onCategorySelect={handleCategorySelect}
                    />
                </main>

                {/* Floating UI Elements */}
                <BuilderFloatingAnalytics
                    build={build}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    workload={workload}
                    onWorkloadChange={setWorkload}
                    analysis={analysis}
                    onApplySuggestion={handleApplySuggestion}
                />
                <BuilderFloatingChat build={build} />
            </div>
        </RouteGuard>
    );
}
