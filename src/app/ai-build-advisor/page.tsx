"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-provider";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { useLoading } from "@/context/loading-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { RouteGuard } from "@/components/auth/route-guard";

// Custom Hooks
import { useAdvisorData } from "./hooks/use-advisor-data";
import { useAdvisorState } from "./hooks/use-advisor-state";
import { useCritiqueLogic } from "./hooks/use-critique-logic";
import { useRecommendationLogic } from "./hooks/use-recommendation-logic";

// Components
import { AdvisorHeader } from "./components/advisor-header";
import { CritiqueTab } from "./components/critique-tab";
import { RecommendationTab } from "./components/recommendation-tab";

/**
 * AI Build Advisor Page
 * Orchestrates AI recommendations and build critiques.
 */
export default function AiBuildAdvisorPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const router = useRouter();
    const { setIsPageLoading } = useLoading();

    // Data Layer
    const { allParts, isAiKillSwitch, collections, loading: dataLoading } = useAdvisorData();

    // State Layer
    const {
        builderState, handleRemovePart, handleClearBuild,
        resolution, setResolution, workload, setWorkload
    } = useAdvisorState(allParts);

    // Logic Layers
    const {
        critiqueAnalysis, critiqueLoading, critiqueError, handleCritique, handleCancelCritique
    } = useCritiqueLogic(isAiKillSwitch);

    const {
        build, totalPrice, isPending, handleGetRecommendations, handleCancelRecommendations,
        elapsedTime, finalResponseTime, error
    } = useRecommendationLogic(isAiKillSwitch, collections);

    // Route Protection handled by RouteGuard wrapper in return

    // Page Loading Sync
    useEffect(() => {
        setIsPageLoading(userLoading || dataLoading);
        return () => setIsPageLoading(false);
    }, [userLoading, dataLoading, setIsPageLoading]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <RouteGuard requiredPermission="isClientOnly">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden relative",
                isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
            )}>
            <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-8 pt-24 md:pt-32 relative z-10">
                <AdvisorHeader isAiKillSwitch={isAiKillSwitch} />

                {builderState ? (
                    <Tabs defaultValue="critique" className="w-full h-full">
                        <div className="flex justify-center mb-12">
                            <TabsList className={cn(
                                "p-1 h-14 rounded-2xl border backdrop-blur-md",
                                isDark ? "bg-slate-900/60 border-white/5" : "bg-white/60 border-slate-200"
                            )}>
                                <TabsTrigger
                                    value="critique"
                                    className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Review Current Build
                                </TabsTrigger>
                                <TabsTrigger
                                    value="generate"
                                    className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Generate New Build
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="critique" className="mt-0 h-full">
                            <CritiqueTab 
                                isDark={isDark}
                                builderState={builderState}
                                critiqueAnalysis={critiqueAnalysis}
                                critiqueLoading={critiqueLoading}
                                critiqueError={critiqueError}
                                handleCritique={handleCritique}
                                handleCancelCritique={handleCancelCritique}
                                handleRemovePart={handleRemovePart}
                                handleClearBuild={handleClearBuild}
                                resolution={resolution}
                                setResolution={setResolution}
                                workload={workload}
                                setWorkload={setWorkload}
                            />
                        </TabsContent>
                        <TabsContent value="generate" className="mt-0 h-full">
                            <RecommendationTab 
                                isDark={isDark}
                                isPending={isPending}
                                handleGetRecommendations={handleGetRecommendations}
                                handleCancelRecommendations={handleCancelRecommendations}
                                build={build}
                                elapsedTime={elapsedTime}
                                finalResponseTime={finalResponseTime}
                                totalPrice={totalPrice}
                                error={error}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <RecommendationTab 
                        isDark={isDark}
                        isPending={isPending}
                        handleGetRecommendations={handleGetRecommendations}
                        handleCancelRecommendations={handleCancelRecommendations}
                        build={build}
                        elapsedTime={elapsedTime}
                        finalResponseTime={finalResponseTime}
                        totalPrice={totalPrice}
                        error={error}
                    />
                )}

                <BuilderFloatingAnalytics
                    build={builderState || {}}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    workload={workload}
                    onWorkloadChange={setWorkload}
                />

                <BuilderFloatingChat 
                    build={builderState || {}} 
                />
            </main>
        </div>
        </RouteGuard>
    );
}
