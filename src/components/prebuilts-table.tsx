
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Trash2, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PrebuiltSystem } from "@/lib/types";
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

interface PrebuiltsTableProps {
  systems: PrebuiltSystem[];
  onDelete?: (systemId: string) => void;
  showActions?: boolean;
}

export function PrebuiltsTable({ systems, onDelete, showActions = true }: PrebuiltsTableProps) {
  const { toast } = useToast();

  const handleAddToCart = (systemName: string) => {
    toast({
      title: 'Added to Cart',
      description: `${systemName} has been added to your cart.`,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>System Name</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {systems.map((system) => (
          <TableRow key={system.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Image
                  src={system.imageUrl}
                  alt={system.name}
                  width={40}
                  height={40}
                  className="rounded-sm object-cover"
                />
                <div>
                  <p>{system.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {system.description}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{system.tier}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(system.price)}
            </TableCell>
            <TableCell>
              {showActions && onDelete ? (
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
                        This action cannot be undone. This will permanently delete the prebuilt system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(system.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button size="icon" variant="outline" onClick={() => handleAddToCart(system.name)}>
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
