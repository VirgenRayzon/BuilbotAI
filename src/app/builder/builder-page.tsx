"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/theme-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { useLoading } from "@/context/loading-context";
import { cn } from "@/lib/utils";

// Custom Hooks
import { useInventoryQuery } from "./hooks/use-inventory-query";
import { useBuilderLogic } from "./hooks/use-builder-logic";
import { useFilteredInventory } from "./hooks/use-filtered-inventory";

// Components
import { BuilderHeader } from "./components/builder-header";
import { InventoryView } from "./components/inventory-view";
import { YourBuild } from "@/components/your-build";
import { RouteGuard } from "@/components/auth/route-guard";
import { DeferredBuilderChat } from "@/components/deferred-builder-chat";
import type { Part, ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { BUILDER_PART_IMAGE_SIZES } from '@/lib/inventory-image-sizes';
import { useLiveBuildRecommendations } from '@/hooks/use-live-build-recommendations';
import { prioritizeRecommendedParts } from '@/lib/live-build-recommendations';
import { useSiteSettings } from '@/context/site-settings-context';

/**
 * Masterpiece Architect - PC Builder Page
 * Refactored to separate inventory fetching, build logic, and presentation.
 */
export default function BuilderPage({ initialParts }: { initialParts?: Part[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLiveBuilderRecommendationsEnabled } = useSiteSettings();

    // Data Layer
    const { allParts, loading: inventoryLoading } = useInventoryQuery(initialParts);

    // Logic Layer
    const {
        build, handlePartToggle, handleRemovePart,
        handleClearBuild, getCountInBuild, isLoaded
    } = useBuilderLogic(allParts);

    // Filter Layer
    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        sortDirection, setSortDirection,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        categories,
        handleCategoryChange,
        sortedAndFilteredParts,
        availableBrands,
        selectedBrands,
        setSelectedBrands,
        hideIncompatible,
        setHideIncompatible
    } = useFilteredInventory(allParts, build, getCountInBuild);

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [resolution, setResolution] = useState<Resolution>('1080p');
    const [workload, setWorkload] = useState<WorkloadType>('AAA');
    const [autoRecommendationsEnabled, setAutoRecommendationsEnabled] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const activeCategories = categories.filter(category => category.selected);
    const preferredCategory = activeCategories.length === 1 ? activeCategories[0].name : null;
    const recommendations = useLiveBuildRecommendations({
        allParts, build, resolution, workload, preferredCategory,
        user: authUser || null, onAddPart: handlePartToggle,
        enabled: isLiveBuilderRecommendationsEnabled && autoRecommendationsEnabled,
    });
    const prioritizedParts = useMemo(() =>
        prioritizeRecommendedParts(sortedAndFilteredParts, recommendations.suggestions),
    [sortedAndFilteredParts, recommendations.suggestions]);
    const totalPages = Math.ceil(prioritizedParts.length / itemsPerPage);
    const paginatedParts = useMemo(() => prioritizedParts.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage,
    ), [prioritizedParts, currentPage, itemsPerPage]);
    const recommendationKey = recommendations.suggestions.map(item => `${item.category}:${item.id}`).join('|');
    useEffect(() => { setCurrentPage(1); }, [recommendationKey, setCurrentPage]);

    const handleApplySuggestion = (category: string, partId: string) => {
        const event = new CustomEvent('add-suggestion', {
            detail: { id: partId, category }
        });
        window.dispatchEvent(event);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle initial category from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            handleCategoryChange(categoryParam, true);
        }
    }, [searchParams]);


    const isSelected = (part: Part) => {
        if (part.category === 'Storage' || part.category === 'RAM') {
            const items = build[part.category];
            if (Array.isArray(items)) {
                return items.some(c => c.model === part.name);
            }
            return (items as ComponentData)?.model === part.name;
        }
        return (build[part.category] as ComponentData)?.model === part.name;
    };

    return (
        <RouteGuard requiredPermission="isClientOnly">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
            )}>
                {/* Circuit Pattern Background */}
                <div className={cn(
                    "fixed inset-0 opacity-[0.05] pointer-events-none z-0",
                    isDark ? "invert" : ""
                )} style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pb-24 lg:pb-12 pt-4 md:pt-6 relative z-10">
                    <BuilderHeader />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                        {/* Your Build — Desktop Left Column & Mobile FAB Drawer */}
                        <div className="contents lg:block lg:col-span-3 self-start">
                            <YourBuild
                                build={build}
                                openReservation={searchParams.get('reserve') === '1'}
                                recommendationState={isLiveBuilderRecommendationsEnabled ? recommendations : undefined}
                                autoRecommendationsEnabled={autoRecommendationsEnabled}
                                onAutoRecommendationsChange={setAutoRecommendationsEnabled}
                                onRemovePart={handleRemovePart}
                                onClearBuild={handleClearBuild}
                                resolution={resolution}
                                onResolutionChange={setResolution}
                                workload={workload}
                                onWorkloadChange={setWorkload}
                                analysis={analysis}
                                onAnalysisUpdate={setAnalysis}
                                onCategorySelect={handleCategoryChange}
                                categories={categories}
                                onApplySuggestion={handleApplySuggestion}
                            />
                        </div>

                        {/* Inventory — Right Column */}
                        <InventoryView
                            imageSizes={BUILDER_PART_IMAGE_SIZES}
                            loading={inventoryLoading}
                            paginatedParts={paginatedParts}
                            recommendations={isLiveBuilderRecommendationsEnabled ? recommendations : undefined}
                            totalPages={totalPages}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            view={view}
                            onViewChange={setView}
                            categories={categories}
                            onCategoryChange={handleCategoryChange}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            sortBy={sortBy}
                            onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                            sortDirection={sortDirection}
                            onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
                            onTogglePart={handlePartToggle}
                            isSelected={isSelected}
                            itemCount={prioritizedParts.length}
                            availableBrands={availableBrands}
                            selectedBrands={selectedBrands}
                            onBrandChange={setSelectedBrands}
                            hideIncompatible={hideIncompatible}
                            onHideIncompatibleChange={setHideIncompatible}
                        />
                    </div>
                </main>

                <DeferredBuilderChat build={build} />
            </div>
        </RouteGuard>
    );
}
