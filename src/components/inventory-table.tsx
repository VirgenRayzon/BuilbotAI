
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
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Part } from "@/lib/types";
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

interface InventoryTableProps {
  parts: Part[];
  onDelete: (partId: string, category: Part['category']) => void;
  onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
}

export function InventoryTable({ parts, onDelete, onUpdateStock }: InventoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parts.map((part) => (
          <TableRow key={part.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Image
                  src={part.imageUrl}
                  alt={part.name}
                  width={40}
                  height={40}
                  className="rounded-sm object-cover"
                />
                <span>{part.name}</span>
              </div>
            </TableCell>
            <TableCell>{part.category}</TableCell>
            <TableCell>{part.brand}</TableCell>
            <TableCell className="w-[150px]">
              <StockEditor 
                stock={part.stock}
                onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
              />
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(part.price)}
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
