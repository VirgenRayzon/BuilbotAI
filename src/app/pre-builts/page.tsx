"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { Paper, Text } from "@mantine/core";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PrebuiltSystemCard } from "@/components/prebuilt-system-card";
import type { PrebuiltSystem } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { PrebuiltsTable } from "@/components/prebuilts-table";
import { SearchX, MonitorOff } from "lucide-react";
import { useUserProfile } from "@/context/user-profile";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RouteGuard } from "@/components/auth/route-guard";

const prebuiltCategories = [
  { name: "Entry", selected: true },
  { name: "Mid-Range", selected: true },
  { name: "High-End", selected: true },
  { name: "Workstation", selected: true },
];

export default function PreBuiltsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const firestore = useFirestore();
  const { authUser, profile, loading: authLoading } = useUserProfile();
  const router = useRouter();

  const prebuiltSystemsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "prebuiltSystems"));
  }, [firestore]);
  const { data: prebuiltSystems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

  const [categories, setCategories] = useState(prebuiltCategories);
  const [sortBy, setSortBy] = useState("Date Added");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    setCategories((prev) => {
      if (categoryName === "All") {
        const anyUnselected = prev.some((cat) => !cat.selected);
        return prev.map((cat) => ({ ...cat, selected: anyUnselected }));
      }
      return prev.map((cat: any) => ({
        ...cat,
        selected: cat.name === categoryName ? true : false,
      }));
    });
  };

  const filteredAndSortedSystems = useMemo(() => {
    if (!prebuiltSystems) return [];
    const selectedCategories = categories.filter((c) => c.selected).map((c) => c.name);
    const searchLower = searchQuery.toLowerCase();

    return prebuiltSystems
      .filter((system) => {
        const isNotArchived = !system.isArchived;
        const matchesCategory = selectedCategories.includes(system.tier);
        const matchesSearch =
          system.name.toLowerCase().includes(searchLower) ||
          (system.description?.toLowerCase() || "").includes(searchLower);
        return isNotArchived && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
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
  }, [prebuiltSystems, categories, sortBy, sortDirection, searchQuery]);

  // When showAllDetails changes, sync expandedIds for list view
  useEffect(() => {
    if (showAllDetails) {
      setExpandedIds(filteredAndSortedSystems.map((s) => s.id));
    } else {
      setExpandedIds([]);
    }
  }, [showAllDetails, filteredAndSortedSystems]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <RouteGuard requiredPermission="isClientOnly">
      <div
        className={cn(
          "min-h-screen transition-colors duration-500 overflow-x-hidden",
          isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
        )}
      >
        {/* Subtle Circuit / Dot Background */}
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

        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-8 md:py-12 pt-10 md:pt-20 relative z-10">
          <div className="relative mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-cyan-500" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-cyan-500">
                  Ready to Ship
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight leading-none mb-3">
                Pre-Built <span className="text-cyan-500">Systems</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed font-normal">
                Curated PC builds tested for performance, reliability, and stability out of the box.
              </p>
            </motion.div>

            {/* Background Accent */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              withBorder
              radius="xl"
              p="md"
              className="bg-white/60 dark:bg-[#111722]/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm"
            >
              <div className="mb-4">
                <InventoryToolbar
                  categories={categories}
                  onCategoryChange={handleCategoryChange}
                  itemCount={filteredAndSortedSystems.length}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  sortDirection={sortDirection}
                  onSortDirectionChange={setSortDirection}
                  supportedSorts={["Date Added", "Name", "Price", "Tier"]}
                  view={view}
                  onViewChange={setView}
                  showViewToggle={true}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  showDetails={showAllDetails}
                  onShowDetailsChange={setShowAllDetails}
                />
              </div>

              {loading ? null : filteredAndSortedSystems.length > 0 ? (
                view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {filteredAndSortedSystems.map((system) => (
                      <PrebuiltSystemCard
                        key={system.id}
                        system={system}
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
                      showActions={false}
                      expandedIds={expandedIds}
                      onToggleExpand={toggleExpand}
                    />
                  </Paper>
                )
              ) : (
                <Paper
                  withBorder
                  radius="lg"
                  p="xl"
                  className="min-h-[360px] flex flex-col items-center justify-center text-center bg-white/40 dark:bg-[#141a23]/60 border-slate-200/70 dark:border-white/10"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400">
                    {searchQuery ? (
                      <SearchX className="h-6 w-6 opacity-60" />
                    ) : (
                      <MonitorOff className="h-6 w-6 opacity-60" />
                    )}
                  </div>
                  <Text fw={600} size="md" mb={4}>
                    No pre-built systems found
                  </Text>
                  <Text c="dimmed" size="xs" maw={320}>
                    {searchQuery
                      ? `No systems match "${searchQuery}". Try adjusting your search query or tier filters.`
                      : "No pre-built systems match the currently selected criteria."}
                  </Text>
                </Paper>
              )}
            </Paper>
          </motion.div>
        </main>
      </div>
    </RouteGuard>
  );
}
