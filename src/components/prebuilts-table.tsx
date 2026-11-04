"use client";
import Link from 'next/link';
import { productAdminUrl } from '@/lib/product-identity';

import { useState, useEffect } from "react";
import { Skeleton } from './ui/skeleton';
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
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Archive,
  RotateCcw,
  AlertCircle,
  QrCode,
} from "lucide-react";
import type { PrebuiltSystem, Part } from "@/lib/types";
import { ConfirmationAlertDialog } from "@/components/ui/confirmation-alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getMissingParts, checkSystemStock } from "@/lib/prebuilt-utils";
import { includedCpuCoolerName } from "@/lib/included-cpu-cooler";
import { inventoryItemPath } from "@/lib/inventory-paths";
import { PrebuiltCardSpecs } from "./prebuilt-card-specs";
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from "./add-prebuilt-dialog";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useSiteSettings } from "@/context/site-settings-context";

interface PrebuiltsTableProps {
  loading?: boolean;
  loadingCount?: number;
  systems: PrebuiltSystem[];
  isAdminPreview?: boolean;
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
  loading = false,
  loadingCount = 8,
  systems,
  isAdminPreview = false,
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
    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" aria-busy={loading}>
      <Table.Thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10">
        <Table.Tr>
          {showActions && (
            <Table.Th className="w-[40px]">
              <Checkbox
                disabled={loading}
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
          <Table.Th className="w-[140px] text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            SKU
          </Table.Th>
          <Table.Th className="w-[60px] text-center text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            QR
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
        {loading && systems.length === 0 && Array.from({length:loadingCount}, (_, index) => (
          <Table.Tr key={`loading-${index}`} aria-hidden="true">
            {showActions && <Table.Td><Skeleton className="h-4 w-4" /></Table.Td>}
            <Table.Td><Skeleton className="h-10 w-10" /></Table.Td>
            {Array.from({length:6}, (_, cell) => <Table.Td key={cell}><Skeleton><Text size="sm">Loading</Text></Skeleton></Table.Td>)}
          </Table.Tr>
        ))}
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
            isAdminPreview={isAdminPreview}
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
  isAdminPreview,
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
  isAdminPreview: boolean;
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

          if (category === 'cooler' && partId === 'included-stock-cooler' && system.components.cpu) {
            const cpuSnap = await getDoc(doc(firestore, inventoryItemPath('CPU', system.components.cpu)));
            const cpu = cpuSnap.exists() ? { id: cpuSnap.id, ...cpuSnap.data(), category: 'CPU' } as Part : null;
            if (cpu && !cpu.isArchived && includedCpuCoolerName(cpu)) {
              components[category] = { stock: Number.MAX_SAFE_INTEGER };
            }
            return;
          }

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
              <OptimizedImage
                src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
                alt={system.name}
                fill
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

        {/* SKU */}
        <Table.Td className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {system.sku || '—'}
        </Table.Td>

        {/* QR Button */}
        <Table.Td className="text-center" onClick={(e) => e.stopPropagation()}>
          {system.productId && (
            <ActionIcon
              component={Link}
              href={productAdminUrl('prebuilt', system.productId, isArchiveView)}
              variant="subtle"
              size="sm"
              className="text-muted-foreground/40 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors mx-auto"
              title="Open QR & item details"
            >
              <QrCode size={16} />
            </ActionIcon>
          )}
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
              <ConfirmationAlertDialog
                trigger={<ActionIcon
                    variant="subtle"
                    size="sm"
                    color="gray"
                    onClick={(e) => e.stopPropagation()}
                    title={isArchiveView ? "Restore" : "Archive"}
                  >
                    {isArchiveView ? <RotateCcw size={15} /> : <Archive size={15} />}
                  </ActionIcon>}
                icon={isArchiveView ? <RotateCcw size={16} /> : <Archive size={16} />}
                title={isArchiveView ? "Restore System" : "Archive System"}
                description={isArchiveView ? `This will restore ${system.name} to the public showcase.` : `This will move ${system.name} to the archive. It will no longer be visible to customers.`}
                actionLabel={isArchiveView ? "Restore" : "Archive"}
                tone={isArchiveView ? "cyan" : "orange"}
                onConfirm={() => onArchive(system.id, !isArchiveView)}
              />
            )}

            {showActions && onDelete && isSuperAdmin && (
              <ConfirmationAlertDialog
                trigger={<ActionIcon
                    variant="subtle"
                    size="sm"
                    color="red"
                    onClick={(e) => e.stopPropagation()}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </ActionIcon>}
                icon={<Trash2 size={16} />}
                title="Delete System"
                description={<>This action cannot be undone. This will permanently delete <strong>{system.name}</strong>.</>}
                actionLabel="Delete"
                tone="red"
                onConfirm={() => onDelete(system.id)}
              />
            )}

            {!showActions && (
              <Button
                component={Link}
                href={`/pre-builts/${system.productId || system.id}${isAdminPreview ? "?preview=admin" : ""}`}
                size="xs"
                radius="md"
                variant="light"
                color="cyan"
                leftSection={<ShieldCheck size={14} />}
              >
                View product
              </Button>
            )}
          </div>
        </Table.Td>
      </Table.Tr>

      {/* Expanded Specs Row */}
      {isExpanded && (
        <Table.Tr className="bg-slate-50/30 dark:bg-white/[0.01]">
          <Table.Td colSpan={showActions ? 8 : 7} className="p-4 pt-1">
            <Paper
              withBorder
              radius="md"
              p="sm"
              className="bg-white/85 dark:bg-[#111722] border-slate-200/70 dark:border-white/10"
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
