"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  History,
  Calendar as CalendarIcon,
  Loader2,
  X,
  Package,
  Heart,
  User as UserIcon,
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
import type { UserAuditLog } from "@/lib/types";

interface UserAuditLogsSectionProps {
  logs: UserAuditLog[];
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
  Order: "cyan",
  Favorite: "pink",
  Profile: "indigo",
  System: "violet",
};

export function UserAuditLogsSection({ logs, loading }: UserAuditLogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScope = filterScope === "all" || log.scope === filterScope;

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

      return matchesSearch && matchesScope && matchesDate;
    });
  }, [logs, searchQuery, filterScope, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "Order":
        return <Package size={15} />;
      case "Favorite":
        return <Heart size={15} />;
      case "Profile":
        return <UserIcon size={15} />;
      default:
        return <Shield size={15} />;
    }
  };

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
          Loading your activity history...
        </Text>
      </Paper>
    );
  }

  const rows = currentLogs.map((log) => {
    const actionColor = actionColors[log.actionName] || "gray";
    const scopeColor = scopeColors[log.scope] || "gray";
    const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : null;

    return (
      <Table.Tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
        {/* Resource with Avatar/Icon */}
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              size={34}
              radius={34}
              color={scopeColor}
              variant="light"
              className="border border-slate-200 dark:border-white/10 shrink-0"
            >
              {getScopeIcon(log.scope)}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <Text fz="sm" fw={600} className="text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                {log.resourceName}
              </Text>
              <Text fz="xs" className="text-slate-500 dark:text-slate-400">
                {log.scope === "Order" ? "Reservation Item" : log.scope}
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

        {/* Category Scope */}
        <Table.Td>
          <Badge color={scopeColor} variant="outline" size="sm" className="font-semibold text-[11px]">
            {log.scope === "Order" ? "Reservation" : log.scope}
          </Badge>
        </Table.Td>

        {/* Activity Details */}
        <Table.Td>
          <Text fz="sm" className="text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[260px]">
            {log.details || "Action recorded successfully"}
          </Text>
        </Table.Td>

        {/* Date & Time */}
        <Table.Td>
          <Text fz="xs" className="text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
            {logDate ? format(logDate, "MMM dd, yyyy • p") : "Unknown date"}
          </Text>
        </Table.Td>

        {/* Row Action/Info */}
        <Table.Td>
          <Group gap={0} justify="flex-end">
            <Tooltip label={log.details || log.resourceName} withArrow position="left">
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Event details">
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
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <Title order={2} className="text-2xl font-headline font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <History className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            <span>Audit Logs</span>
          </Title>
          <Text size="sm" className="text-slate-600 dark:text-slate-400 font-medium">
            Review your reservations, saved configurations, and account security history.
          </Text>
        </div>
        <Badge color="cyan" variant="light" size="md" className="font-bold">
          {filteredLogs.length} events
        </Badge>
      </div>

      <Paper
        withBorder
        radius="lg"
        p="lg"
        className="bg-white dark:bg-[#12161f] border-slate-200 dark:border-white/10 shadow-sm"
      >
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center flex-wrap mb-5">
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
            data={[
              { value: "all", label: "All Categories" },
              { value: "Order", label: "Reservations" },
              { value: "Favorite", label: "Favorites" },
              { value: "Profile", label: "Profile" },
            ]}
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

        {/* Mantine Users Table Pattern */}
        <Table.ScrollContainer minWidth={750} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
          <Table verticalSpacing="sm" highlightOnHover className="bg-white dark:bg-[#12161f]">
            <Table.Thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10">
              <Table.Tr>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                  Resource / Activity
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                  Action
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                  Category
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                  Details
                </Table.Th>
                <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                  Timestamp
                </Table.Th>
                <Table.Th className="py-3.5">
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="h-32 text-center text-slate-600 dark:text-slate-400 font-medium">
                    No activity logs match your selected filter criteria.
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {/* Pagination */}
        <div className="mt-4">
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
      </Paper>
    </Stack>
  );
}
