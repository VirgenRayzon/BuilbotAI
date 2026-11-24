"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Info } from "lucide-react";
import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import { CompactInfo } from "@/components/ui/compact-info";
import type { AuditLog } from "@/lib/types";
import type { AuditLogFilters } from "../hooks/use-audit-logs";
import { AdminHeaderSlot } from "@/app/admin/components/admin-tab-header";
import { AuditLogsFilters } from "./audit-logs-filters";
import { AuditLogsTable } from "./audit-logs-table";

export interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  totalCount?: number;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
  filters?: AuditLogFilters;
  onFiltersChange?: (filters: AuditLogFilters) => void;
}

export function AuditLogsSection({
  logs,
  loading,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
  totalCount,
  hasMore,
  loadMore,
  isLoadingMore,
  filters: controlledFilters,
  onFiltersChange,
}: AuditLogsSectionProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = controlledSearchQuery ?? localSearchQuery;
  const setSearchQuery = onSearchQueryChange ?? setLocalSearchQuery;

  // Local filter fallback if caller does not control filters
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>({
    scope: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "newest",
  });

  const activeFilters = controlledFilters ?? localFilters;
  const updateActiveFilters = (next: AuditLogFilters) => {
    if (onFiltersChange) {
      onFiltersChange(next);
    } else {
      setLocalFilters(next);
    }
  };

  const filterScope = activeFilters.scope || "all";
  const sortBy = activeFilters.sortBy || "newest";
  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!activeFilters.fromDate) return undefined;
    return {
      from: new Date(activeFilters.fromDate),
      to: activeFilters.toDate ? new Date(activeFilters.toDate) : undefined,
    };
  }, [activeFilters.fromDate, activeFilters.toDate]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [desktopOpened, setDesktopOpened] = useState(false);
  const [mobileOpened, setMobileOpened] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    setDesktopOpened(false);
    setMobileOpened(false);
  }, [isMobile]);

  // Server handles scope, fromDate, toDate, and sortBy; client search applies in-memory
  const filteredLogs = useMemo(() => {
    if (!searchQuery?.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      return (
        log.resourceName?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleScopeChange = (scope: string) => {
    setCurrentPage(1);
    updateActiveFilters({
      ...activeFilters,
      scope: scope === "all" ? undefined : scope,
    });
  };

  const handleDateRangeChange = (range?: DateRange) => {
    setCurrentPage(1);
    updateActiveFilters({
      ...activeFilters,
      fromDate: range?.from ? range.from.toISOString() : undefined,
      toDate: range?.to ? range.to.toISOString() : undefined,
    });
  };

  const handleSortByChange = (sort: "newest" | "oldest") => {
    setCurrentPage(1);
    updateActiveFilters({
      ...activeFilters,
      sortBy: sort,
    });
  };

  const handleResetAll = () => {
    setSearchQuery("");
    setCurrentPage(1);
    updateActiveFilters({
      ...activeFilters,
      scope: undefined,
      fromDate: undefined,
      toDate: undefined,
      sortBy: "newest",
    });
  };

  const hasSearch = Boolean(searchQuery?.trim());
  const displayCount = hasSearch ? filteredLogs.length : (totalCount ?? filteredLogs.length);

  return (
    <Stack gap="md">
      <div className="space-y-4">
        <AdminHeaderSlot
          countBadge={
            <Badge size="md" variant="light" color="cyan" radius="md">
              {displayCount} {displayCount === 1 ? "event" : "events"}
            </Badge>
          }
          actions={
            <div className="flex shrink-0 items-center gap-2">
              <AuditLogsFilters
                filterScope={filterScope}
                onFilterScopeChange={handleScopeChange}
                sortBy={sortBy}
                onSortByChange={handleSortByChange}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                onResetAll={handleResetAll}
                filteredCount={displayCount}
                desktopOpened={desktopOpened}
                onDesktopOpenedChange={setDesktopOpened}
                mobileOpened={mobileOpened}
                onMobileOpenedChange={setMobileOpened}
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    h={36}
                    variant={dateRange?.from ? "light" : "default"}
                    color={dateRange?.from ? "cyan" : undefined}
                    radius="md"
                    leftSection={<CalendarIcon size={16} className={dateRange?.from ? "text-cyan-500" : "text-slate-400"} />}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {dateRange?.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                        : format(dateRange.from, "LLL dd, y")
                      : "Filter by Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-900" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          }
        />

        {hasSearch && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-cyan-200/80 bg-cyan-50/50 text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/[0.06] dark:text-cyan-200 text-xs">
            <div className="flex items-center gap-2">
              <Info size={14} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>
                Search matches loaded records ({filteredLogs.length} found).
                {hasMore ? " Older records can be retrieved from the server." : ""}
              </span>
            </div>
            {hasMore && loadMore && (
              <Button
                variant="subtle"
                color="cyan"
                size="compact-xs"
                loading={isLoadingMore}
                onClick={loadMore}
                className="shrink-0"
              >
                Load more logs
              </Button>
            )}
          </div>
        )}

        <Paper
          withBorder
          radius="md"
          className="overflow-hidden bg-white/80 shadow-sm dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10"
        >
          <Group justify="space-between" className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <Group gap={6} align="center" wrap="nowrap">
              <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">
                Activity log
              </Text>
              <CompactInfo
                label="About the activity log"
                message="Review recent staff and system events, including account, inventory, and system changes."
              />
            </Group>
            <Badge variant="light" color="cyan" size="sm" radius="sm">
              {displayCount} {displayCount === 1 ? "event" : "events"}
            </Badge>
          </Group>

          <AuditLogsTable logs={currentLogs} loading={loading} pageSize={itemsPerPage} />
        </Paper>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />

          {hasMore && loadMore && (
            <Button
              variant="light"
              color="cyan"
              size="sm"
              loading={isLoadingMore}
              leftSection={isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              onClick={loadMore}
              className="w-full sm:w-auto"
            >
              Load more logs from server
            </Button>
          )}
        </div>
      </div>
    </Stack>
  );
}
