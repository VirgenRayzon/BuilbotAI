"use client";

import React from "react";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Filter, X } from "lucide-react";
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Popover as MantinePopover,
  Radio,
  Stack,
  Text,
} from "@mantine/core";
import { DateRange } from "react-day-picker";
import { STAFF_AUDIT_SCOPES } from "@/lib/audit-scopes";

interface AuditLogsFiltersProps {
  filterScope: string;
  onFilterScopeChange: (scope: string) => void;
  sortBy: "newest" | "oldest";
  onSortByChange: (sort: "newest" | "oldest") => void;
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  onResetAll: () => void;
  filteredCount: number;
  desktopOpened: boolean;
  onDesktopOpenedChange: (opened: boolean) => void;
  mobileOpened: boolean;
  onMobileOpenedChange: (opened: boolean) => void;
}

const scopeOptions = [{ value: "all", label: "All Resources" }, ...STAFF_AUDIT_SCOPES];

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export function AuditLogsFilters({
  filterScope,
  onFilterScopeChange,
  sortBy,
  onSortByChange,
  dateRange,
  onDateRangeChange,
  onResetAll,
  filteredCount,
  desktopOpened,
  onDesktopOpenedChange,
  mobileOpened,
  onMobileOpenedChange,
}: AuditLogsFiltersProps) {
  const scopeActive = filterScope !== "all";
  const dateActive = Boolean(dateRange?.from);
  const sortActive = sortBy !== "newest";
  const activeCount = Number(scopeActive) + Number(dateActive) + Number(sortActive);

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
      onClick={mobile ? () => onMobileOpenedChange(true) : undefined}
      aria-expanded={mobile ? mobileOpened : desktopOpened}
      aria-label={`Filters and sort${activeCount ? `, ${activeCount} active` : ""}`}
    >
      Filters & sort
    </Button>
  );

  const filterContent = (close: () => void, maxHeight: string) => (
    <div className="flex flex-col" style={{ maxHeight }}>
      <Stack gap="sm" className="min-h-0 overflow-y-auto p-3">
        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="sm">Resource Scope</Text>
            {scopeActive && (
              <Button
                variant="subtle"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                onClick={() => onFilterScopeChange("all")}
              >
                Reset
              </Button>
            )}
          </Group>
          <Radio.Group value={filterScope} onChange={(val) => onFilterScopeChange(val || "all")}>
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

        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="sm">Date Presets</Text>
            {dateActive && (
              <Button
                variant="subtle"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                onClick={() => onDateRangeChange(undefined)}
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
              onClick={() => onDateRangeChange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}
            >
              Today
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => onDateRangeChange({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) })}
            >
              Last 7 days
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => onDateRangeChange({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) })}
            >
              Last 30 days
            </Button>
            <Button
              variant="default"
              size="xs"
              radius="md"
              className="min-h-11 sm:min-h-8"
              onClick={() => onDateRangeChange(undefined)}
            >
              All time
            </Button>
          </div>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb="xs">Sort by</Text>
          <Radio.Group value={sortBy} onChange={(val) => onSortByChange((val as "newest" | "oldest") || "newest")}>
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

      <Group grow className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]">
        <Button variant="default" radius="md" className="h-11" onClick={onResetAll}>
          Reset all
        </Button>
        <Button color="cyan" radius="md" className="h-11" onClick={close}>
          Show {filteredCount} {filteredCount === 1 ? "event" : "events"}
        </Button>
      </Group>
    </div>
  );

  return (
    <>
      <div className="flex sm:hidden">{filterButton(true)}</div>
      <div className="hidden sm:block">
        <MantinePopover
          opened={desktopOpened}
          onChange={onDesktopOpenedChange}
          width={360}
          position="bottom-end"
          shadow="lg"
          withinPortal
        >
          <MantinePopover.Target>
            <div onClick={() => onDesktopOpenedChange(!desktopOpened)}>{filterButton(false)}</div>
          </MantinePopover.Target>
          <MantinePopover.Dropdown p={0} className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]">
            {filterContent(() => onDesktopOpenedChange(false), "min(78vh, 760px)")}
          </MantinePopover.Dropdown>
        </MantinePopover>
      </div>

      <Drawer
        opened={mobileOpened}
        onClose={() => onMobileOpenedChange(false)}
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
          <ActionIcon variant="subtle" color="gray" size={44} onClick={() => onMobileOpenedChange(false)} aria-label="Close filters">
            <X size={18} />
          </ActionIcon>
        </div>
        <div className="flex-1 min-h-0">
          {filterContent(() => onMobileOpenedChange(false), "calc(85dvh - 57px)")}
        </div>
      </Drawer>
    </>
  );
}
