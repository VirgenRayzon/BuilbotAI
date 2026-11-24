"use client";

import React from "react";
import { format } from "date-fns";
import { Avatar, Badge, Group, Table, Text } from "@mantine/core";
import { TableLoadingRows } from "@/components/loading/table-loading-rows";
import type { AuditLog } from "@/lib/types";

export function parseAuditDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof (val as { seconds?: number }).seconds === "number") {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d;
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

interface AuditLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
  pageSize?: number;
}

export function AuditLogsTable({ logs, loading, pageSize = 8 }: AuditLogsTableProps) {
  const rows = logs.map((log) => {
    const actionColor = actionColors[log.actionName] || "gray";
    const scopeColor = scopeColors[log.scope] || "gray";
    const logDate = parseAuditDate(log.createdAt);
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

        <Table.Td>
          <Text fz="sm" fw={500} className="text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
            {log.resourceName}
          </Text>
        </Table.Td>

        <Table.Td>
          <Badge color={scopeColor} variant="outline" size="sm" className="font-semibold text-[11px]">
            {log.scope}
          </Badge>
        </Table.Td>

        <Table.Td>
          <Text fz="sm" className="text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[260px]">
            {log.details || "—"}
          </Text>
        </Table.Td>

        <Table.Td>
          <Text fz="xs" className="text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
            {logDate ? format(logDate, "MMM dd, yyyy • p") : "Unknown date"}
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
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
              Resource
            </Table.Th>
            <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
              Scope
            </Table.Th>
            <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
              Details
            </Table.Th>
            <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
              Timestamp
            </Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {loading && rows.length === 0 ? (
            <TableLoadingRows count={pageSize} />
          ) : rows.length === 0 ? (
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
  );
}
