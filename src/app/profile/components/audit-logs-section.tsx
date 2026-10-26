"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  History,
  Calendar as CalendarIcon,
  Filter,
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
  Divider,
  Drawer,
  Group,
  Paper,
  Popover as MantinePopover,
  Radio,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import { CompactInfo } from "@/components/ui/compact-info";
import type { AuditLog } from "@/lib/types";
import { AdminHeaderSlot } from "@/app/admin/components/admin-tab-header";

interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
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

export function AuditLogsSection({
  logs,
  loading,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
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

      return matchesSearch && matchesType && matchesDate;
    });

    list.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()
        ? a.createdAt.toDate().getTime()
        : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
      const timeB = b.createdAt?.toDate?.()
        ? b.createdAt.toDate().getTime()
        : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [logs, searchQuery, filterScope, dateRange, sortBy]);

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

    const scopeOptions = [
    { value: "all", label: "All Resources" },
    { value: "Part", label: "Inventory Parts" },
    { value: "Prebuilt", label: "Prebuilts" },
    { value: "Order", label: "Orders" },
    { value: "User", label: "Users" },
    { value: "System", label: "System Config" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
  ];

  const scopeActive = filterScope !== "all";
  const dateActive = Boolean(dateRange?.from);
  const sortActive = sortBy !== "newest";
  const activeCount = Number(scopeActive) + Number(dateActive) + Number(sortActive);

  const handleResetAll = () => {
    setSearchQuery("");
    setFilterScope("all");
    setDateRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const filterButton = (mobile: boolean) => (
    <Button
      size="sm"
      h={36}
      variant={activeCount ? "light" : "default"}
      color={activeCount ? "cyan" : undefined}
      radius="md"
      leftSection={<Filter size={17} />}
      rightSection={activeCount ? <Badge color="cyan" circle size="sm">{activeCount}</Badge> : undefined}
      className="flex-1 whitespace-nowrap sm:flex-none"
      onClick={mobile ? () => setMobileOpened(true) : undefined}
      aria-expanded={mobile ? mobileOpened : desktopOpened}
      aria-label={`Filters and sort${activeCount ? `, ${activeCount} active` : ""}`}
    >
      Filters & sort
    </Button>
  );

  const filterContent = (close: () => void, maxHeight: string) => (
    <div className="flex flex-col" style={{ maxHeight }}>
      <Stack gap="sm" className="min-h-0 overflow-y-auto p-3">
        {/* Resource Scope Section */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="sm">Resource Scope</Text>
            {scopeActive && (
              <Button
                variant="subtle"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                onClick={() => {
                  setFilterScope("all");
                  setCurrentPage(1);
                }}
              >
                Reset
              </Button>
            )}
          </Group>
          <Radio.Group
            value={filterScope}
            onChange={(val) => {
              setFilterScope(val || "all");
              setCurrentPage(1);
            }}
          >
            <Stack gap={0}>
              {scopeOptions.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  color="cyan"
                  size="sm"
                  classNames={{ root: "flex min-h-11 items-center sm:min-h-7" }}
                />
              ))}
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        {/* Date Filter Quick Presets */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="sm">Date Presets</Text>
            {dateActive && (
              <Button
                variant="subtle"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                onClick={() => {
                  setDateRange(undefined);
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </Group>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => {
                setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
                setCurrentPage(1);
              }}
            >
              Today
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => {
                setDateRange({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) });
                setCurrentPage(1);
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => {
                setDateRange({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) });
                setCurrentPage(1);
              }}
            >
              Last 30 days
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => {
                setDateRange(undefined);
                setCurrentPage(1);
              }}
            >
              All time
            </Button>
          </div>
        </div>

        <Divider />

        {/* Sort Section */}
        <div>
          <Text fw={700} size="sm" mb="xs">Sort by</Text>
          <Radio.Group
            value={sortBy}
            onChange={(val) => {
              setSortBy(val as any);
              setCurrentPage(1);
            }}
          >
            <Stack gap={0}>
              {sortOptions.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  color="cyan"
                  size="sm"
                  classNames={{ root: "flex min-h-11 items-center sm:min-h-7" }}
                />
              ))}
            </Stack>
          </Radio.Group>
        </div>
      </Stack>

      {/* Popover / Drawer Action Footer */}
      <Group grow className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]">
        <Button variant="default" radius="md" className="h-11" onClick={handleResetAll}>
          Reset all
        </Button>
        <Button color="cyan" radius="md" className="h-11" onClick={close}>
          Show {filteredLogs.length} {filteredLogs.length === 1 ? "event" : "events"}
        </Button>
      </Group>
    </div>
  );

  return (
    <Stack gap="md">
      <div className="space-y-4">
        <AdminHeaderSlot
          countBadge={
            <Badge size="md" variant="light" color="cyan" radius="md">
              {filteredLogs.length} {filteredLogs.length === 1 ? "event" : "events"}
            </Badge>
          }
          actions={
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex sm:hidden">{filterButton(true)}</div>
              <div className="hidden sm:block">
                <MantinePopover
                  opened={desktopOpened}
                  onChange={setDesktopOpened}
                  width={360}
                  position="bottom-end"
                  shadow="lg"
                  withinPortal
                >
                  <MantinePopover.Target>
                    <div onClick={() => setDesktopOpened((opened) => !opened)}>{filterButton(false)}</div>
                  </MantinePopover.Target>
                  <MantinePopover.Dropdown p={0} className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]">
                    {filterContent(() => setDesktopOpened(false), "min(78vh, 760px)")}
                  </MantinePopover.Dropdown>
                </MantinePopover>
              </div>
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

        <div>
          <Drawer
            opened={mobileOpened}
            onClose={() => setMobileOpened(false)}
            position="bottom"
            size="85dvh"
            withCloseButton={false}
            padding={0}
            classNames={{
              content: "flex flex-col bg-white dark:bg-[#111722] rounded-t-2xl overflow-hidden",
              body: "flex flex-col flex-1 min-h-0 p-0",
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <div className="mx-auto -mt-1 mb-1 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20 sm:hidden" />
              <Text fw={700} size="md">Filters & sort</Text>
              <ActionIcon variant="subtle" color="gray" size={44} onClick={() => setMobileOpened(false)} aria-label="Close filters">
                <X size={18} />
              </ActionIcon>
            </div>
            <div className="flex-1 min-h-0">
              {filterContent(() => setMobileOpened(false), "calc(85dvh - 57px)")}
            </div>
          </Drawer>

        </div>

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
