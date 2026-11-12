"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  Calendar as CalendarIcon,
  X,
  Loader2,
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
import { CUSTOMER_AUDIT_SCOPES } from "@/lib/audit-scopes";
import { UserAuditLogsTable, parseUserAuditDate } from "./user-audit-logs-table";

export interface UserAuditLogsSectionProps {
  logs: UserAuditLog[];
  loading: boolean;
  totalCount?: number;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
}

export function UserAuditLogsSection({
  logs,
  loading,
  totalCount,
  hasMore,
  loadMore,
  isLoadingMore,
}: UserAuditLogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScope = filterScope === "all" || log.scope === filterScope;

      let matchesDate = true;
      if (dateRange?.from) {
        const logDate = parseUserAuditDate(log.createdAt);
        if (logDate) {
          if (dateRange.to) {
            matchesDate = logDate >= dateRange.from && logDate <= dateRange.to;
          } else {
            matchesDate = logDate >= dateRange.from;
          }
        }
      }

      return matchesSearch && matchesScope && matchesDate;
    });
  }, [logs, searchQuery, filterScope, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const displayCount = totalCount !== undefined ? totalCount : filteredLogs.length;

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
            onChange={(val) => {
              setFilterScope(val || "all");
              setCurrentPage(1);
            }}
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
                onSelect={(range) => {
                  setDateRange(range);
                  setCurrentPage(1);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {(searchQuery || filterScope !== "all" || dateRange) && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              onClick={() => {
                setSearchQuery("");
                setFilterScope("all");
                setDateRange(undefined);
                setCurrentPage(1);
              }}
              leftSection={<X size={14} />}
              className="font-bold text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Paper>

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
