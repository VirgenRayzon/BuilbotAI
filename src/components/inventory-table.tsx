/**
 * InventoryTable — Admin data table for managing inventory parts.
 * Supports inline stock editing, bulk selection, archive/restore, and delete actions.
 * Part names are clickable to open the AddPartDialog for editing.
 */

import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { productAdminUrl } from '@/lib/product-identity';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Trash2, Archive, RotateCcw, Plus, QrCode } from "lucide-react";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { Part } from "@/lib/types";
import { AddPartDialog } from "./add-part-dialog";
import { AddStockDialog } from "./add-stock-dialog";
import { type AddPartFormSchema } from "@/hooks/use-part-form";
import { ConfirmationAlertDialog } from "@/components/ui/confirmation-alert-dialog";
import { StockEditor } from "./stock-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { useSiteSettings } from "@/context/site-settings-context";

interface InventoryTableProps {
  loading?: boolean;
  loadingCount?: number;
  parts: Part[];
  onDelete: (partId: string, category: Part['category']) => void;
  onArchive: (partId: string, category: Part['category'], isArchived?: boolean) => void;
  onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
  onAddStock?: (partId: string, category: Part['category'], amount: number) => Promise<void> | void;
  onUpdatePart: (partId: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
  selectedIds: { id: string, category: Part['category'] }[];
  onToggleSelection: (id: string, category: Part['category']) => void;
  onToggleSelectAll: () => void;
  isSuperAdmin?: boolean;
  isArchiveView?: boolean;
}

export function InventoryTable({
  loading = false,
  loadingCount = 8,
  parts,
  onDelete,
  onArchive,
  onUpdateStock,
  onAddStock,
  onUpdatePart,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  isSuperAdmin,
  isArchiveView
}: InventoryTableProps) {
  const { shouldCorruptImages } = useSiteSettings();
  const allSelected = parts.length > 0 && parts.every(p => selectedIds.some(s => s.id === p.id));

  return (
    <Table className="bg-transparent [&_th]:h-10 [&_th]:px-4 [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-600 dark:[&_th]:text-slate-300 [&_td]:border-slate-100 dark:[&_td]:border-white/[0.06]">
      <TableHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.025]">
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              disabled={loading}
              checked={allSelected}
              onCheckedChange={() => onToggleSelectAll()}
            />
          </TableHead>
          <TableHead>Item</TableHead>
          <TableHead className="w-[140px]">SKU</TableHead>
          <TableHead className="w-[60px] text-center">QR</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && parts.length === 0 && Array.from({length:loadingCount}, (_, index) => (
          <TableRow key={`loading-${index}`} aria-hidden="true">
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 shrink-0" /><Skeleton>Component name</Skeleton></div></TableCell>
            {Array.from({length:7}, (_, cell) => <TableCell key={cell}><Skeleton>Loading</Skeleton></TableCell>)}
          </TableRow>
        ))}
        {parts.map((part) => (
          <TableRow
            key={part.id}
            className={selectedIds.some(s => s.id === part.id)
              ? "bg-cyan-50/50 dark:bg-cyan-950/20"
              : "transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/[0.035]"}
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.some(s => s.id === part.id)}
                onCheckedChange={() => onToggleSelection(part.id, part.category)}
              />
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
                  <OptimizedImage
                    src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || "/placeholder-part.png"}
                    alt={part.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <AddPartDialog
                  initialData={part}
                  onSave={(data) => onUpdatePart(part.id, part.category, data)}
                >
                  <span className="cursor-pointer hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all font-semibold italic">
                    {part.name}
                  </span>
                </AddPartDialog>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {part.sku || "—"}
            </TableCell>
            <TableCell className="text-center">
              {part.productId && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/40 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors mx-auto"
                  onClick={(e) => e.stopPropagation()}
                  title="Open QR & item details"
                >
                  <Link href={productAdminUrl('part', part.productId, isArchiveView)}>
                    <QrCode className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </TableCell>
            <TableCell>{part.category}</TableCell>
            <TableCell>{part.brand}</TableCell>
            <TableCell className="w-[170px] text-center">
              {isArchiveView ? (
                <span className="font-mono text-muted-foreground">{part.stock}</span>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <StockEditor
                    stock={part.stock}
                    onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
                  />
                  <AddStockDialog
                    part={part}
                    onAddStock={onAddStock || ((id, cat, amt) => onUpdateStock(id, cat, part.stock + amt))}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                      title="Save Stock"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </AddStockDialog>
                </div>
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(part.price)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ConfirmationAlertDialog
                  trigger={<Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => e.stopPropagation()}
                      title={isArchiveView ? "Restore" : "Archive"}
                    >
                      {isArchiveView ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>}
                  icon={isArchiveView ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  title={isArchiveView ? "Restore Part" : "Archive Part"}
                  description={isArchiveView ? `This will restore ${part.name} to the active inventory.` : `This will move ${part.name} to the archive. It will no longer be visible to customers.`}
                  actionLabel={isArchiveView ? "Restore" : "Archive"}
                  tone={isArchiveView ? "cyan" : "orange"}
                  onConfirm={() => onArchive(part.id, part.category, !isArchiveView)}
                />

                {isSuperAdmin && (
                  <ConfirmationAlertDialog
                    trigger={<Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Delete Part"
                    description={<>This action cannot be undone. This will permanently delete <strong>{part.name}</strong> from your inventory.</>}
                    actionLabel="Delete"
                    tone="red"
                    onConfirm={() => onDelete(part.id, part.category)}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
