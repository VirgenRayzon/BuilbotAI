"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import { CompactInfo } from "@/components/ui/compact-info";
import type { AuditLog } from "@/lib/types";
import { AdminHeaderSlot } from "@/app/admin/components/admin-tab-header";
import { AuditLogsFilters } from "./audit-logs-filters";
import { AuditLogsTable, parseAuditDate } from "./audit-logs-table";

export interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  totalCount?: number;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
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
}: AuditLogsSectionProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = controlledSearchQuery ?? localSearchQuery;
  const setSearchQuery = onSearchQueryChange ?? setLocalSearchQuery;
  const [filterScope, setFilterScope] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [desktopOpened, setDesktopOpened] = useState(false);
  const [mobileOpened, setMobileOpened] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    setDesktopOpened(false);
    setMobileOpened(false);
  }, [isMobile]);

  const filteredLogs = useMemo(() => {
    const list = logs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterScope === "all" || log.scope === filterScope;

      let matchesDate = true;
      if (dateRange?.from) {
        const logDate = parseAuditDate(log.createdAt);
        if (logDate) {
          if (dateRange.to) {
            matchesDate = logDate >= dateRange.from && logDate <= dateRange.to;
          } else {
            matchesDate = logDate >= dateRange.from;
          }
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });

    list.sort((a, b) => {
      const dateA = parseAuditDate(a.createdAt);
      const dateB = parseAuditDate(b.createdAt);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [logs, searchQuery, filterScope, dateRange, sortBy]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleResetAll = () => {
    setSearchQuery("");
    setFilterScope("all");
    setDateRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const displayCount = totalCount !== undefined ? totalCount : filteredLogs.length;

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
                onFilterScopeChange={(scope) => {
                  setFilterScope(scope);
                  setCurrentPage(1);
                }}
                sortBy={sortBy}
                onSortByChange={(sort) => {
                  setSortBy(sort);
                  setCurrentPage(1);
                }}
                dateRange={dateRange}
                onDateRangeChange={(range) => {
                  setDateRange(range);
                  setCurrentPage(1);
                }}
                onResetAll={handleResetAll}
                filteredCount={filteredLogs.length}
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
                    onSelect={(range) => {
                      setDateRange(range);
                      setCurrentPage(1);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          }
        />

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
