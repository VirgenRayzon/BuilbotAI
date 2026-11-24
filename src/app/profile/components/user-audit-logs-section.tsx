"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  Calendar as CalendarIcon,
  X,
  Loader2,
  Info,
} from "lucide-react";
import {
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import type { UserAuditLog } from "@/lib/types";
import type { UserAuditLogFilters } from "../hooks/use-user-audit-logs";
import { CUSTOMER_AUDIT_SCOPES } from "@/lib/audit-scopes";
import { UserAuditLogsTable } from "./user-audit-logs-table";

export interface UserAuditLogsSectionProps {
  logs: UserAuditLog[];
  loading: boolean;
  totalCount?: number;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
  filters?: UserAuditLogFilters;
  onFiltersChange?: (filters: UserAuditLogFilters) => void;
}

export function UserAuditLogsSection({
  logs,
  loading,
  totalCount,
  hasMore,
  loadMore,
  isLoadingMore,
  filters: controlledFilters,
  onFiltersChange,
}: UserAuditLogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Local filter fallback if caller does not control filters
  const [localFilters, setLocalFilters] = useState<UserAuditLogFilters>({
    scope: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "newest",
  });

  const activeFilters = controlledFilters ?? localFilters;
  const updateActiveFilters = (next: UserAuditLogFilters) => {
    if (onFiltersChange) {
      onFiltersChange(next);
    } else {
      setLocalFilters(next);
    }
  };

  const filterScope = activeFilters.scope || "all";
  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!activeFilters.fromDate) return undefined;
    return {
      from: new Date(activeFilters.fromDate),
      to: activeFilters.toDate ? new Date(activeFilters.toDate) : undefined,
    };
  }, [activeFilters.fromDate, activeFilters.toDate]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

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

  const handleResetFilters = () => {
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
  const hasActiveFilters = Boolean(searchQuery || filterScope !== "all" || dateRange);
  const displayCount = hasSearch ? filteredLogs.length : (totalCount ?? filteredLogs.length);

  return (
    <Stack gap="md">
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="bg-white dark:bg-[#12161f] border-slate-200 dark:border-white/10 shadow-sm"
      >
        <div className="flex flex-col md:flex-row gap-3 items-center flex-wrap">
          <TextInput
            placeholder="Search activity by title or details..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setCurrentPage(1);
            }}
            leftSection={<Search size={16} className="text-slate-500 dark:text-slate-400" />}
            radius="md"
            className="flex-1 min-w-[220px]"
            classNames={{
              input:
                "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100",
            }}
          />

          <Select
            value={filterScope}
            onChange={(val) => handleScopeChange(val || "all")}
            data={[{ value: "all", label: "All Categories" }, ...CUSTOMER_AUDIT_SCOPES]}
            radius="md"
            className="w-full md:w-44"
            classNames={{
              input:
                "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium",
            }}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                radius="md"
                leftSection={<CalendarIcon size={14} className="text-slate-600 dark:text-slate-400" />}
                className="w-full md:w-auto h-9 bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium text-xs"
              >
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Filter by Date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl"
              align="end"
            >
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

          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              onClick={handleResetFilters}
              leftSection={<X size={14} />}
              className="font-bold text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Paper>

      {hasSearch && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-indigo-200/80 bg-indigo-50/50 text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06] dark:text-indigo-200 text-xs">
          <div className="flex items-center gap-2">
            <Info size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>
              Search matches loaded records ({filteredLogs.length} found).
              {hasMore ? " Older activity records can be retrieved from the server." : ""}
            </span>
          </div>
          {hasMore && loadMore && (
            <Button
              variant="subtle"
              color="indigo"
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
        <Group justify="space-between" className="border-b border-slate-200 px-3 py-3 dark:border-white/10">
          <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">
            Activity history
          </Text>
          <Badge variant="light" color="cyan" size="sm" radius="sm">
            {displayCount} {displayCount === 1 ? "event" : "events"}
          </Badge>
        </Group>

        <UserAuditLogsTable logs={currentLogs} loading={loading} pageSize={itemsPerPage} />
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
            color="indigo"
            size="sm"
            loading={isLoadingMore}
            leftSection={isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            onClick={loadMore}
            className="w-full sm:w-auto"
          >
            Load more history from server
          </Button>
        )}
      </div>
    </Stack>
  );
}
