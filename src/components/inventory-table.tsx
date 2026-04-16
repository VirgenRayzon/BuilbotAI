
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Trash2, Archive, RotateCcw } from "lucide-react";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { Part } from "@/lib/types";
import { AddPartDialog, type AddPartFormSchema } from "./add-part-dialog";
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
import { StockEditor } from "./stock-editor";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryTableProps {
  parts: Part[];
  onDelete: (partId: string, category: Part['category']) => void;
  onArchive: (partId: string, category: Part['category'], isArchived?: boolean) => void;
  onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
  onUpdatePart: (partId: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
  selectedIds: { id: string, category: Part['category'] }[];
  onToggleSelection: (id: string, category: Part['category']) => void;
  onToggleSelectAll: () => void;
  isSuperAdmin?: boolean;
  isArchiveView?: boolean;
}

export function InventoryTable({ 
  parts, 
  onDelete, 
  onArchive,
  onUpdateStock, 
  onUpdatePart,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  isSuperAdmin,
  isArchiveView
}: InventoryTableProps) {
  const allSelected = parts.length > 0 && parts.every(p => selectedIds.some(s => s.id === p.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox 
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll()}
            />
          </TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parts.map((part) => (
          <TableRow key={part.id} className={selectedIds.some(s => s.id === part.id) ? "bg-muted/50" : ""}>
            <TableCell>
              <Checkbox 
                checked={selectedIds.some(s => s.id === part.id)}
                onCheckedChange={() => onToggleSelection(part.id, part.category)}
              />
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Image
                  src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                  alt={part.name}
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-sm object-cover"
                />
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
            <TableCell>{part.category}</TableCell>
            <TableCell>{part.brand}</TableCell>
            <TableCell className="w-[150px] text-center">
              {isArchiveView ? (
                <span className="font-mono text-muted-foreground">{part.stock}</span>
              ) : (
                <StockEditor
                  stock={part.stock}
                  onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
                />
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(part.price)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => onArchive(part.id, part.category, !isArchiveView)}
                    title={isArchiveView ? "Restore" : "Archive"}
                >
                  {isArchiveView ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>

                {isSuperAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the part from your inventory.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(part.id, part.category)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
