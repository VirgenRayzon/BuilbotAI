"use client";

import { PrebuiltCardSkeleton } from "@/components/loading/prebuilt-card-skeleton";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { Button, Paper, Text } from "@mantine/core";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { CategorySelectionEmpty } from "@/components/category-selection-empty";
import { hasNoSelectedCategories } from "@/lib/category-selection";
import { PrebuiltSystemCard } from "@/components/prebuilt-system-card";
import { PrebuiltsTable } from "@/components/prebuilts-table";
import { PrebuiltEmptyState } from "./components/prebuilt-empty-state";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { usePrebuiltCatalog } from "./hooks/use-prebuilt-catalog";

const prebuiltCategories = [
  { name: "Entry", selected: true },
  { name: "Mid-Range", selected: true },
  { name: "High-End", selected: true },
  { name: "Workstation", selected: true },
];

export default function PreBuiltsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();
  const isAdminPreview = searchParams.get("preview") === "admin";

  const [categories, setCategories] = useState(prebuiltCategories);
  const [sortBy, setSortBy] = useState("Date Added");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTiers = useMemo(
    () => categories.filter((c) => c.selected).map((c) => c.name),
    [categories]
  );

  const {
    systems: prebuiltSystems,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = usePrebuiltCatalog({
    tiers: selectedTiers,
    sortBy,
    sortDirection,
    pageSize: 24,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    setCategories((prev) => {
      if (categoryName === "All") {
        return prev.map((cat) => ({ ...cat, selected: true }));
      }
      return prev.map((cat) => (
        cat.name === categoryName ? { ...cat, selected } : cat
      ));
    });
  };

  const handleClearCategories = () => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: false })));
  };

  const handleResetAll = () => {
    setCategories(prebuiltCategories);
    setSortBy("Date Added");
    setSortDirection("desc");
    setShowAllDetails(false);
    setSearchQuery("");
  };

  const filteredAndSortedSystems = useMemo(() => {
    if (!prebuiltSystems) return [];
    const searchLower = searchQuery.toLowerCase().trim();

    return prebuiltSystems
      .filter((system) => {
        const isNotArchived = !system.isArchived;
        const matchesCategory = selectedTiers.includes(system.tier);
        const matchesSearch = !searchLower ||
          system.name.toLowerCase().includes(searchLower) ||
          (system.description?.toLowerCase() || "").includes(searchLower) ||
          (system.sku?.toLowerCase() || "").includes(searchLower);
        return isNotArchived && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const completeA = getMissingParts(a).length === 0;
        const completeB = getMissingParts(b).length === 0;
        if (completeA !== completeB) return completeA ? -1 : 1;

        let compare = 0;
        if (sortBy === "Name") compare = a.name.localeCompare(b.name);
        else if (sortBy === "Price") compare = a.price - b.price;
        else if (sortBy === "Tier") compare = a.tier.localeCompare(b.tier);
        else if (sortBy === "Date Added") {
          const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
          const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
          compare = new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        return sortDirection === "asc" ? compare : -compare;
      });
  }, [prebuiltSystems, selectedTiers, sortBy, sortDirection, searchQuery]);

  useEffect(() => {
    if (showAllDetails) {
      setExpandedIds(filteredAndSortedSystems.map((s) => s.id));
    } else {
      setExpandedIds([]);
    }
  }, [showAllDetails, filteredAndSortedSystems]);

  return (
    <>
      <div
        className={cn(
          "min-h-screen transition-colors duration-500 overflow-x-hidden",
          isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
        )}
      >
        <div
          className={cn(
            "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
            isDark ? "invert" : ""
          )}
          style={{
            backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pt-4 md:pt-6 relative z-10">
          {isAdminPreview && (
            <div className="mb-2">
              <Button component={Link} href="/admin" variant="subtle" color="gray" size="xs" leftSection={<ArrowLeft className="h-3.5 w-3.5" />} className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
                Back to Dashboard
              </Button>
            </div>
          )}
          <div className="relative mb-4 flex items-start gap-3">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-600 dark:text-cyan-400 font-headline">
                Ready to Ship
              </span>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Pre-Built <span className="text-cyan-600 dark:text-cyan-400 italic">Systems</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Curated PC builds tested for performance, reliability, and stability out of the box.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <>
              <div className="mb-4">
                <InventoryToolbar
                  categories={categories}
                  onCategoryChange={handleCategoryChange}
                  onClearCategories={handleClearCategories}
                  categoryLabel="Tiers"
                  itemLabel="systems"
                  itemCount={filteredAndSortedSystems.length}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  sortDirection={sortDirection}
                  onSortDirectionChange={setSortDirection}
                  supportedSorts={["Date Added", "Name", "Price", "Tier"]}
                  defaultSort="Date Added:desc"
                  view={view}
                  onViewChange={setView}
                  showViewToggle={true}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  searchPlaceholder="Search systems by name, SKU, or specs..."
                  showDetails={showAllDetails}
                  onShowDetailsChange={setShowAllDetails}
                  onResetAll={handleResetAll}
                />
              </div>

              {hasNoSelectedCategories(categories) ? (
                <CategorySelectionEmpty itemLabel="systems" categoryLabel="Tiers" onSelectAll={() => handleCategoryChange("All", true)} />
              ) : loading ? (
                view === 'grid' ? <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" aria-label="Loading systems" aria-busy="true">
                  {Array.from({length:8}, (_, index) => <PrebuiltCardSkeleton key={index} expanded={showAllDetails} />)}
                </div> : <Paper withBorder radius="lg" className="overflow-hidden bg-white/70 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10">
                  <PrebuiltsTable systems={[]} showActions={false} loading />
                </Paper>
              ) : filteredAndSortedSystems.length > 0 ? (
                <>
                  {view === "grid" ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {filteredAndSortedSystems.map((system, index) => (
                        <PrebuiltSystemCard
                          key={system.id}
                          system={system}
                          isAdminPreview={isAdminPreview}
                          priority={index < 4}
                          expanded={showAllDetails}
                          onToggle={() => setShowAllDetails(!showAllDetails)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Paper
                      withBorder
                      radius="lg"
                      className="overflow-hidden bg-white/70 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10"
                    >
                      <PrebuiltsTable
                        systems={filteredAndSortedSystems}
                        isAdminPreview={isAdminPreview}
                        showActions={false}
                        expandedIds={expandedIds}
                        onToggleExpand={toggleExpand}
                      />
                    </Paper>
                  )}

                  {hasMore && (
                    <div className="flex justify-center mt-6 mb-2">
                      <Button
                        onClick={loadMore}
                        loading={loadingMore}
                        variant="light"
                        color="cyan"
                        radius="md"
                        size="sm"
                        leftSection={<ChevronDown className="h-4 w-4" />}
                        className="px-6 font-medium"
                      >
                        Load More Systems
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <PrebuiltEmptyState searchQuery={searchQuery} />
              )}
            </>
          </motion.div>
        </main>
      </div>
    </>
  );
}
