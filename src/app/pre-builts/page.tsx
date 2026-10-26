"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { Button, Card, Stack, Group, Box, Paper, Text } from "@mantine/core";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PrebuiltSystemCard } from "@/components/prebuilt-system-card";
import type { PrebuiltSystem } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { PrebuiltsTable } from "@/components/prebuilts-table";
import { ArrowLeft, SearchX, MonitorOff } from "lucide-react";
import { useUserProfile } from "@/context/user-profile";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { RouteGuard } from "@/components/auth/route-guard";
import { getMissingParts } from "@/lib/prebuilt-utils";

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
  const searchParams = useSearchParams();
  const isAdminPreview = searchParams.get("preview") === "admin";

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
  const [searchQuery, setSearchQuery] = useState("");

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
    const selectedCategories = categories.filter((c) => c.selected).map((c) => c.name);
    const searchLower = searchQuery.toLowerCase().trim();

    return prebuiltSystems
      .filter((system) => {
        const isNotArchived = !system.isArchived;
        const matchesCategory = selectedCategories.includes(system.tier);
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
    <>
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

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card
                      key={`prebuilt-skeleton-${i}`}
                      withBorder
                      radius="lg"
                      padding={0}
                      className="flex flex-col justify-between h-full relative overflow-hidden bg-white/85 dark:bg-[#111722] border-slate-200/80 dark:border-white/10 animate-pulse select-none"
                    >
                      <Stack gap={0}>
                        <Group justify="space-between" align="center" wrap="nowrap" className="px-3 pt-3 pb-2">
                          <div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded-sm" />
                          <div className="h-5 w-20 bg-slate-200/60 dark:bg-white/5 rounded-sm" />
                        </Group>

                        <Box className="aspect-[4/3] relative w-full overflow-hidden bg-slate-100/80 dark:bg-white/[0.03] border-y border-slate-200/70 dark:border-white/10 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-lg bg-slate-200/60 dark:bg-white/5" />
                        </Box>

                        <Stack gap={4} className="px-3 pt-3">
                          <div className="min-h-[2.5rem] flex flex-col justify-center gap-1.5">
                            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-4/5" />
                            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                          </div>
                          <div className="min-h-[2rem] flex flex-col justify-center gap-1.5">
                            <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-full" />
                            <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-2/3" />
                          </div>
                        </Stack>
                      </Stack>

                      <Stack gap="xs" className="px-3 pt-3 pb-3">
                        <Group justify="space-between" align="center">
                          <Stack gap={4}>
                            <div className="h-2.5 w-14 bg-slate-200/80 dark:bg-white/10 rounded" />
                            <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                          </Stack>
                          <div className="h-7 w-7 rounded-md bg-slate-200/60 dark:bg-white/5" />
                        </Group>
                        <div className="h-9 w-full rounded-md bg-slate-200 dark:bg-white/10" />
                      </Stack>
                    </Card>
                  ))}
                </div>
              ) : filteredAndSortedSystems.length > 0 ? (
                view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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
            </>
          </motion.div>
        </main>
      </div>
    </>
  );
}
