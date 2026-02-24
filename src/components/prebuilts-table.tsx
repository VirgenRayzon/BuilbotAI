
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
import { getMissingParts } from "@/lib/prebuilt-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

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
          <TableRow key={system.id} className="group hover:bg-muted/50 transition-colors">
            <TableCell className="font-medium p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border shadow-sm group-hover:border-primary/30 transition-colors">
                  <Image
                    src={system.imageUrl}
                    alt={system.name}
                    fill
                    sizes="64px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div>
                  <p className="font-headline text-base group-hover:text-primary transition-colors">{system.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-[400px]">
                    {system.description}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="font-medium bg-secondary/50">{system.tier}</Badge>
            </TableCell>
            <TableCell className="text-right font-headline font-bold text-lg">
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
              ) : (() => {
                const missingParts = getMissingParts(system);
                const isComplete = missingParts.length === 0;

                if (!isComplete) {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed">
                            <Button size="icon" variant="outline" disabled className="opacity-50">
                              <AlertCircle className="h-4 w-4 text-warning" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Missing: {missingParts.join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return (
                  <Button size="icon" variant="outline" onClick={() => handleAddToCart(system.name)}>
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                );
              })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
