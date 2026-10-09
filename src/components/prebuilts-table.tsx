"use client";

import { useState, useEffect } from "react";
import { cn, formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import {
  Table,
  Button,
  Badge,
  ActionIcon,
  Checkbox,
  Text,
  Group,
  Stack,
  Box,
  Paper,
} from "@mantine/core";
import Image from "next/image";
import {
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Archive,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import type { PrebuiltSystem, Part } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getMissingParts, checkSystemStock } from "@/lib/prebuilt-utils";
import { PrebuiltCardSpecs } from "./prebuilt-card-specs";
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from "./add-prebuilt-dialog";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useSiteSettings } from "@/context/site-settings-context";

interface PrebuiltsTableProps {
  systems: PrebuiltSystem[];
  onDelete?: (systemId: string) => void;
  onArchive?: (systemId: string, isArchived: boolean) => void;
  onUpdate?: (systemId: string, data: AddPrebuiltFormSchema) => Promise<void>;
  parts?: Part[];
  showActions?: boolean;
  expandedIds?: string[];
  onToggleExpand?: (id: string) => void;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
  onToggleSelectAll?: () => void;
  isSuperAdmin?: boolean;
  isArchiveView?: boolean;
}

export function PrebuiltsTable({
  systems,
  onDelete,
  onArchive,
  onUpdate,
  parts = [],
  showActions = true,
  expandedIds = [],
  onToggleExpand = () => {},
  selectedIds = [],
  onToggleSelection = () => {},
  onToggleSelectAll = () => {},
  isSuperAdmin = false,
  isArchiveView = false,
}: PrebuiltsTableProps) {
  const allSelected = systems.length > 0 && systems.every((s) => selectedIds.includes(s.id));

  return (
    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
      <Table.Thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10">
        <Table.Tr>
          {showActions && (
            <Table.Th className="w-[40px]">
              <Checkbox
                checked={allSelected}
                onChange={() => onToggleSelectAll()}
                size="xs"
              />
            </Table.Th>
          )}
          <Table.Th className="w-[40px]"></Table.Th>
          <Table.Th className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            System Name
          </Table.Th>
          <Table.Th className="w-[140px] whitespace-nowrap text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Tier
          </Table.Th>
          <Table.Th className="w-[140px] text-right text-[11px] font-semibold tracking-wider uppercase text-slate-500 whitespace-nowrap">
            Price
          </Table.Th>
          <Table.Th className="w-[100px] text-right"></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {systems.map((system) => (
          <PrebuiltTableRow
            key={system.id}
            system={system}
            onDelete={onDelete}
            onArchive={onArchive}
            onUpdate={onUpdate}
            parts={parts}
            showActions={showActions}
            isExpanded={expandedIds.includes(system.id)}
            onToggleExpand={() => onToggleExpand(system.id)}
            isSelected={selectedIds.includes(system.id)}
            onToggleSelection={onToggleSelection}
            isSuperAdmin={isSuperAdmin}
            isArchiveView={isArchiveView}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function PrebuiltTableRow({
  system,
  onDelete,
  onArchive,
  onUpdate,
  parts,
  showActions,
  isExpanded,
  onToggleExpand,
  isSelected,
  onToggleSelection,
  isSuperAdmin,
  isArchiveView,
}: {
  system: PrebuiltSystem;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onUpdate?: any;
  parts: Part[];
  showActions: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  isSuperAdmin: boolean;
  isArchiveView: boolean;
}) {
  const { shouldCorruptImages } = useSiteSettings();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [stockStatus, setStockStatus] = useState<"loading" | "in-stock" | "out-of-stock">("loading");

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  useEffect(() => {
    if (!firestore || !isComplete) {
      setStockStatus("out-of-stock");
      return;
    }

    const fetchStock = async () => {
      try {
        const components: Record<string, { stock: number } | null> = {};
        const promises = Object.entries(system.components).map(async ([category, id]) => {
          const collectionMap: Record<string, string> = {
            cpu: "CPU",
            gpu: "GPU",
            motherboard: "Motherboard",
            ram: "RAM",
            storage: "Storage",
            psu: "PSU",
            case: "Case",
            cooler: "Cooler",
          };
          const collectionName = collectionMap[category] || category;
          const partId = Array.isArray(id) ? id[0] : id;

          if (!partId) return;

          const partRef = doc(firestore, collectionName, partId as string);
          const snap = await getDoc(partRef);
          if (snap.exists()) {
            components[category] = { stock: (snap.data() as any).stock || 0 };
          } else {
            const q = query(collection(firestore, collectionName), where("name", "==", partId));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              components[category] = { stock: (querySnap.docs[0].data() as any).stock || 0 };
            }
          }
        });
        await Promise.all(promises);
        const inStock = checkSystemStock(components);
        setStockStatus(inStock ? "in-stock" : "out-of-stock");
      } catch (e) {
        console.error("Stock check error:", e);
        setStockStatus("out-of-stock");
      }
    };

    fetchStock();
  }, [firestore, isComplete, system.components]);

  const handleReserve = (systemName: string) => {
    toast({
      title: "Reservation Initiated",
      description: `${systemName} has been recorded. Check your profile for details.`,
    });
  };

  return (
    <>
      <Table.Tr
        className={cn(
          "transition-colors cursor-pointer",
          isExpanded ? "bg-slate-50/50 dark:bg-white/[0.02]" : "hover:bg-slate-50/80 dark:hover:bg-white/[0.03]",
          isSelected && "bg-cyan-50/30 dark:bg-cyan-950/20"
        )}
        onClick={() => onToggleExpand()}
      >
        {showActions && (
          <Table.Td onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelection(system.id)}
              size="xs"
            />
          </Table.Td>
        )}

        <Table.Td>
          <ActionIcon variant="subtle" size="sm" color="gray">
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </ActionIcon>
        </Table.Td>

        {/* System identity */}
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Box className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200/70 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.03]">
              <Image
                src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
                alt={system.name}
                fill
                unoptimized
                sizes="64px"
                className="object-cover"
              />
            </Box>
            <Stack gap={2} className="min-w-0">
              {onUpdate ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <AddPrebuiltDialog
                    initialData={system}
                    parts={parts}
                    onSave={(data) => onUpdate(system.id, data)}
                  >
                    <Text
                      size="sm"
                      fw={600}
                      className="cursor-pointer hover:text-cyan-500 transition-colors line-clamp-1"
                    >
                      {system.name}
                    </Text>
                  </AddPrebuiltDialog>
                </div>
              ) : (
                <Text size="sm" fw={600} className="line-clamp-1">
                  {system.name}
                </Text>
              )}
              <Text size="xs" c="dimmed" lineClamp={1}>
                {system.description}
              </Text>
            </Stack>
          </Group>
        </Table.Td>

        {/* Tier & Stock badge */}
        <Table.Td className="w-[140px] whitespace-nowrap">
          <Group gap={6} wrap="nowrap">
            <Badge
              size="xs"
              variant="light"
              color={
                system.tier === "High-End" || system.tier === "Workstation"
                  ? "cyan"
                  : system.tier === "Mid-Range"
                  ? "blue"
                  : "gray"
              }
              radius="sm"
              className="uppercase tracking-wider font-semibold whitespace-nowrap"
            >
              {system.tier}
            </Badge>

            {!showActions && (
              <Badge
                variant="dot"
                size="xs"
                color={
                  stockStatus === "in-stock"
                    ? "teal"
                    : stockStatus === "loading"
                    ? "gray"
                    : "red"
                }
                className="whitespace-nowrap"
              >
                {stockStatus === "in-stock"
                  ? "In Stock"
                  : stockStatus === "loading"
                  ? "Checking"
                  : "Out of Stock"}
              </Badge>
            )}
          </Group>
        </Table.Td>

        {/* Price */}
        <Table.Td className="w-[140px] text-right whitespace-nowrap">
          <Text size="sm" fw={700} className="font-mono">
            {formatCurrency(system.price)}
          </Text>
        </Table.Td>

        {/* Action column */}
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {showActions && onArchive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="gray"
                    onClick={(e) => e.stopPropagation()}
                    title={isArchiveView ? "Restore" : "Archive"}
                  >
                    {isArchiveView ? <RotateCcw size={15} /> : <Archive size={15} />}
                  </ActionIcon>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isArchiveView ? "Restore System?" : "Archive System?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isArchiveView
                        ? `This will restore ${system.name} to the public showcase.`
                        : `This will move ${system.name} to the archive. It will no longer be visible to customers.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(system.id, !isArchiveView);
                      }}
                      className={isArchiveView ? "bg-cyan-600 hover:bg-cyan-700" : "bg-orange-500 hover:bg-orange-600"}
                    >
                      {isArchiveView ? "Restore" : "Archive"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {showActions && onDelete && isSuperAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="red"
                    onClick={(e) => e.stopPropagation()}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </ActionIcon>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete System?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {system.name}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(system.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!showActions && (
              <Button
                size="xs"
                radius="md"
                variant="light"
                color="cyan"
                disabled={stockStatus !== "in-stock" || !isComplete}
                onClick={() => handleReserve(system.name)}
                leftSection={<ShieldCheck size={14} />}
              >
                Reserve
              </Button>
            )}
          </div>
        </Table.Td>
      </Table.Tr>

      {/* Expanded Specs Row */}
      {isExpanded && (
        <Table.Tr className="bg-slate-50/30 dark:bg-white/[0.01]">
          <Table.Td colSpan={showActions ? 6 : 5} className="p-4 pt-1">
            <Paper
              withBorder
              radius="md"
              p="sm"
              className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/70 dark:border-white/10"
            >
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" className="tracking-wider mb-2 text-[10px]">
                Component Breakdown
              </Text>
              <PrebuiltCardSpecs components={system.components} expanded={true} />
            </Paper>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}
