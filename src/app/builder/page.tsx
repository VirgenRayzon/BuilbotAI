"use client";

import React, { useState, useEffect } from "react";
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
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";
import type { Part, ComponentData, Resolution, WorkloadType } from "@/lib/types";

/**
 * Masterpiece Architect - PC Builder Page
 * Refactored to separate inventory fetching, build logic, and presentation.
 */
export default function BuilderPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setIsPageLoading } = useLoading();

    // Data Layer
    const { allParts, loading: inventoryLoading } = useInventoryQuery();
    
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
        paginatedParts,
        totalPages
    } = useFilteredInventory(allParts, build, getCountInBuild);

    const [view, setView] = useState<'grid' | 'list'>('grid');
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

    // Handle initial category from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            handleCategoryChange(categoryParam, true);
        }
    }, [searchParams]);

    // Sync with global layout loading
    useEffect(() => {
        setIsPageLoading(!mounted || authLoading || !isLoaded || inventoryLoading);
        return () => setIsPageLoading(false);
    }, [mounted, authLoading, isLoaded, inventoryLoading, setIsPageLoading]);

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
                isDark ? "bg-background text-foreground" : "bg-white text-slate-900"
            )}>
            {/* Circuit Pattern Background */}
            <div className={cn(
                "fixed inset-0 opacity-[0.05] pointer-events-none z-0",
                isDark ? "invert" : ""
            )} style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 lg:pb-12 pt-24 md:pt-32 relative z-10">
                <BuilderHeader />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                    <InventoryView 
                        loading={inventoryLoading}
                        paginatedParts={paginatedParts}
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
                        itemCount={sortedAndFilteredParts.length}
                    />
                    <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start">
                        <YourBuild 
                            build={build} 
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
                        />
                    </aside>
                </div>
            </main>

            {/* Floating UI Elements */}
            <BuilderFloatingChat build={build} />
            <BuilderFloatingAnalytics 
                build={build} 
                resolution={resolution}
                onResolutionChange={setResolution}
                workload={workload}
                onWorkloadChange={setWorkload}
                analysis={analysis}
                onApplySuggestion={handleApplySuggestion}
            />
        </div>
    </RouteGuard>
    );
}
