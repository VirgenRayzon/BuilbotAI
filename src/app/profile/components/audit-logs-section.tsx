"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  History,
  Calendar as CalendarIcon,
  User as UserIcon,
  Loader2,
  X,
  Shield,
  Info,
} from "lucide-react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import { CompactInfo } from "@/components/ui/compact-info";
import type { AuditLog } from "@/lib/types";

interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
}

const actionColors: Record<string, string> = {
  created: "teal",
  restored: "teal",
  updated: "yellow",
  status_changed: "yellow",
  deleted: "red",
  archived: "red",
  auth_update: "cyan",
  other: "gray",
};

const scopeColors: Record<string, string> = {
  Part: "blue",
  Prebuilt: "cyan",
  Order: "teal",
  User: "indigo",
  System: "violet",
};

export function AuditLogsSection({ logs, loading }: AuditLogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const uniqueUsers = useMemo(() => {
    const users = new Set(logs.map((log) => log.actorName));
    return Array.from(users);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUser = filterUser === "all" || log.actorName === filterUser;
      const matchesType = filterScope === "all" || log.scope === filterScope;

      let matchesDate = true;
      if (dateRange?.from) {
        const logDate = log.createdAt?.toDate?.() || log.createdAt;
        if (logDate) {
          const date = new Date(logDate);
          if (dateRange.to) {
            matchesDate = date >= dateRange.from && date <= dateRange.to;
          } else {
            matchesDate = date >= dateRange.from;
          }
        }
      }

      return matchesSearch && matchesUser && matchesType && matchesDate;
    });
  }, [logs, searchQuery, filterUser, filterScope, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <Paper
        withBorder
        radius="lg"
        p="xl"
        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-12 space-y-4"
      >
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400" />
        <Text size="sm" className="text-slate-700 dark:text-slate-300 font-medium">
          Loading enterprise audit logs...
        </Text>
      </Paper>
    );
  }

  const rows = currentLogs.map((log) => {
    const actionColor = actionColors[log.actionName] || "gray";
    const scopeColor = scopeColors[log.scope] || "gray";
    const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : null;
    const actorInitials =
      log.actorName
        ?.split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "ST";

    return (
      <Table.Tr
        key={log.id}
        className="transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/[0.035] [&>td]:border-slate-100 dark:[&>td]:border-white/[0.06]"
      >
        {/* Employee / Actor with Avatar */}
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              size={34}
              radius={34}
              color="cyan"
              variant="light"
              className="border border-slate-200 dark:border-white/10 shrink-0 font-bold text-xs"
            >
              {actorInitials}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <Text fz="sm" fw={600} className="text-slate-900 dark:text-slate-100 truncate max-w-[160px] sm:max-w-xs">
                {log.actorName}
              </Text>
              <Text fz="xs" className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                {log.actorEmail || "System Actor"}
              </Text>
            </div>
          </Group>
        </Table.Td>

        {/* Action Badge */}
        <Table.Td>
          <Badge
            color={actionColor}
            variant="light"
            size="sm"
            className="font-bold uppercase tracking-wider text-[10px]"
          >
            {log.actionName.replace("_", " ")}
          </Badge>
        </Table.Td>

        {/* Target Resource & Scope */}
        <Table.Td>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge color={scopeColor} variant="outline" size="sm" className="font-semibold text-[11px]">
              {log.scope}
            </Badge>
            <Text fz="sm" fw={500} className="text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
              {log.resourceName}
            </Text>
          </div>
        </Table.Td>

        {/* Event Details */}
        <Table.Td>
          <Text fz="sm" className="text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[260px]">
            {log.details || "—"}
          </Text>
        </Table.Td>

        {/* Timestamp */}
        <Table.Td>
          <Text fz="xs" className="text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
            {logDate ? format(logDate, "MMM dd, yyyy • p") : "Unknown date"}
          </Text>
        </Table.Td>

        {/* Row Action/Info */}
        <Table.Td>
          <Group gap={0} justify="flex-end">
            <Tooltip label={log.details ? `${log.resourceName}: ${log.details}` : log.resourceName} withArrow position="left">
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Event metadata">
                <Info size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <Paper
          withBorder
          radius="lg"
          p="xs"
          className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
            {/* Left: Search Input */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <TextInput
                placeholder="Search resource name or details..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                  setCurrentPage(1);
                }}
                leftSection={<Search size={14} className="text-slate-400" />}
                size="xs"
                radius="md"
                className="w-44 sm:w-56 lg:w-64 shrink-0"
              />
            </div>

            {/* Right: Filters & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Select
                value={filterUser}
                onChange={(val) => {
                  setFilterUser(val || "all");
                  setCurrentPage(1);
                }}
                data={[
                  { value: "all", label: "All Users / Staff" },
                  ...uniqueUsers.map((u) => ({ value: u, label: u })),
                ]}
                size="xs"
                radius="md"
                className="w-36 sm:w-44 shrink-0"
              />

              <Select
                value={filterScope}
                onChange={(val) => {
                  setFilterScope(val || "all");
                  setCurrentPage(1);
                }}
                data={[
                  { value: "all", label: "All Resources" },
                  { value: "Part", label: "Inventory Parts" },
                  { value: "Prebuilt", label: "Prebuilts" },
                  { value: "Order", label: "Orders" },
                  { value: "User", label: "Users" },
                  { value: "System", label: "System Config" },
                ]}
                size="xs"
                radius="md"
                className="w-32 sm:w-36 shrink-0"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? "light" : "default"}
                    color={dateRange?.from ? "cyan" : undefined}
                    size="xs"
                    radius="md"
                    leftSection={<CalendarIcon size={13} className={dateRange?.from ? "text-cyan-500" : "text-slate-400"} />}
                    className="shrink-0"
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

              {(searchQuery || filterUser !== "all" || filterScope !== "all" || dateRange) && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  radius="md"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterUser("all");
                    setFilterScope("all");
                    setDateRange(undefined);
                    setCurrentPage(1);
                  }}
                  leftSection={<X size={13} />}
                  className="shrink-0"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Paper>

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
              {filteredLogs.length} {filteredLogs.length === 1 ? "event" : "events"}
            </Badge>
          </Group>

          <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" highlightOnHover className="bg-transparent">
            <Table.Thead className="bg-slate-50/80 dark:bg-white/[0.025] border-b border-slate-200 dark:border-white/10">
              <Table.Tr>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                  Staff / Actor
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                  Action
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                  Resource & Scope
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                  Details
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                  Timestamp
                </Table.Th>
                <Table.Th className="py-3">
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="h-32 text-center text-slate-600 dark:text-slate-400 font-medium">
                    No audit logs found matching your criteria.
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows
              )}
            </Table.Tbody>
          </Table>
          </Table.ScrollContainer>
        </Paper>

        {/* Pagination */}
        <div className="pt-1">
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
        </div>
      </div>
    </Stack>
  );
}
