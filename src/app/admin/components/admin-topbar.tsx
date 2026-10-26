"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import {
  ActionIcon,
  Anchor,
  Box,
  Breadcrumbs,
  Divider,
  Group,
  Text,
  TextInput,
} from "@mantine/core";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import {
  AdminSidebarTrigger,
  type AdminTabKey,
} from "./admin-sidebar";

interface AdminTopbarProps {
  currentTab?: AdminTabKey | "prebuilt-builder" | string;
  aiSubTab?: "intelligence" | "prompts";
  salesSubTab?: "overview" | "popularity";
  sectionLabel?: string;
  profile?: {
    isManager?: boolean;
    isSuperAdmin?: boolean;
    name?: string;
    username?: string;
    email?: string;
    photoURL?: string;
  } | null;
  authUser?: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
}

const TAB_BREADCRUMBS: Record<string, { group: string; page: string }> = {
  stock: { group: "Inventory", page: "Manage Stock" },
  prebuilts: { group: "Inventory", page: "Manage Prebuilts" },
  "prebuilt-builder": { group: "Inventory", page: "Prebuilt Builder" },
  archive: { group: "Inventory", page: "Archive" },
  reservations: { group: "Platform", page: "Reservations" },
  sales: { group: "Sales & Analytics", page: "Performance & Revenue" },
  ai: { group: "Models & AI", page: "Model Intelligence" },
  audit: { group: "Management", page: "Audit Logs" },
  management: { group: "Management", page: "Management Portal" },
};

export function AdminTopbar({
  currentTab = "stock",
  aiSubTab = "intelligence",
  salesSubTab = "overview",
  sectionLabel,
  showSearch = false,
  searchQuery = "",
  onSearchQueryChange,
  searchPlaceholder = "Search...",
  searchAriaLabel,
}: AdminTopbarProps) {
  const crumb = TAB_BREADCRUMBS[currentTab] || {
    group: "Platform",
    page: "Dashboard",
  };
  const pageTitle = sectionLabel
    ? sectionLabel
    : currentTab === "ai"
      ? aiSubTab === "prompts"
        ? "System Prompts"
        : "Model Intelligence"
      : currentTab === "sales"
        ? salesSubTab === "popularity"
          ? "Popularity Matrix"
          : "Performance & Revenue"
        : crumb.page;

  return (
    <Box
      component="header"
      className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0f14]/80 backdrop-blur-md sticky top-0 z-30"
    >
      <Group unstyled className="flex items-center gap-2 px-4 min-w-0 shrink-0">
        <AdminSidebarTrigger className="-ml-1" />
        <Divider
          unstyled
          orientation="vertical"
          role="none"
          className="mr-2 h-4 w-[1px] shrink-0 bg-border"
        />
        <Box component="nav" aria-label="Main Navigation" className="min-w-0">
          <Breadcrumbs
            unstyled
            separator={<ChevronRight className="size-3.5" />}
            classNames={{
              root: "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
              breadcrumb: "inline-flex items-center gap-1.5",
              separator: "hidden md:block [&>svg]:size-3.5",
            }}
          >
            <Anchor
              unstyled
              component={Link}
              href="/admin"
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
            >
              {crumb.group}
            </Anchor>
            <Text
              unstyled
              component="span"
              role="link"
              aria-disabled="true"
              aria-current="page"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-foreground whitespace-nowrap"
            >
              {pageTitle}
            </Text>
          </Breadcrumbs>
        </Box>
      </Group>

      <Group unstyled className="flex flex-1 items-center justify-end gap-2 px-4 min-w-0">
        {showSearch && onSearchQueryChange && (
          <Box className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[360px] lg:max-w-[420px]">
            <TextInput
              size="xs"
              radius="md"
              aria-label={searchAriaLabel || searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
              leftSection={<Search size={14} className="text-slate-400" />}
              rightSection={
                searchQuery ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={22}
                    radius="sm"
                    aria-label="Clear search"
                    onClick={() => onSearchQueryChange("")}
                  >
                    <X size={13} />
                  </ActionIcon>
                ) : undefined
              }
              classNames={{
                input:
                  "h-8 bg-slate-100/80 dark:bg-[#141a23] border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500",
              }}
            />
          </Box>
        )}
        <NotificationCenter />
        <ThemeToggle />
      </Group>
    </Box>
  );
}
