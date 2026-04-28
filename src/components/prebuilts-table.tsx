import { useState, useEffect } from "react";
import { cn, formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
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
import { Trash2, ShieldCheck, ChevronDown, ChevronUp, Archive, RotateCcw } from "lucide-react";
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
import { PrebuiltCardSpecs } from "./prebuilt-card-specs";
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from "./add-prebuilt-dialog";
import type { Part } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { checkSystemStock } from "@/lib/prebuilt-utils";
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
  isArchiveView = false
}: PrebuiltsTableProps) {
  const { toast } = useToast();
  const allSelected = systems.length > 0 && systems.every(s => selectedIds.includes(s.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            {showActions && (
              <Checkbox 
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll()}
              />
            )}
          </TableHead>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>System Name</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
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
      </TableBody>
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
  isArchiveView
}: { 
  system: PrebuiltSystem, 
  onDelete?: (id: string) => void, 
  onArchive?: (id: string, isArchived: boolean) => void,
  onUpdate?: any, 
  parts: Part[], 
  showActions: boolean,
  isExpanded: boolean,
  onToggleExpand: () => void,
  isSelected: boolean,
  onToggleSelection: (id: string) => void,
  isSuperAdmin: boolean,
  isArchiveView: boolean
}) {
  const { shouldCorruptImages } = useSiteSettings();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [stockStatus, setStockStatus] = useState<'loading' | 'in-stock' | 'out-of-stock'>('loading');
  
  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  useEffect(() => {
    if (!firestore || !isComplete) {
      setStockStatus('out-of-stock');
      return;
    }

    const fetchStock = async () => {
      try {
        const components: Record<string, { stock: number } | null> = {};
        const promises = Object.entries(system.components).map(async ([category, id]) => {
          const collectionMap: Record<string, string> = {
            cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
            ram: 'RAM', storage: 'Storage', psu: 'PSU',
            case: 'Case', cooler: 'Cooler',
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
        setStockStatus(inStock ? 'in-stock' : 'out-of-stock');
      } catch (e) {
        console.error("Stock check error:", e);
        setStockStatus('out-of-stock');
      }
    };

    fetchStock();
  }, [firestore, isComplete, system.components]);

  const handleReserve = (systemName: string) => {
    toast({
      title: 'Reservation Initiated',
      description: `${systemName} has been reserved.`,
    });
  }

  return (
    <>
      <TableRow 
        className={cn(
          "group transition-colors cursor-pointer",
          isExpanded ? "bg-muted/30" : "hover:bg-muted/50",
          isSelected && "bg-muted/50"
        )}
        onClick={() => onToggleExpand()}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          {showActions && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(system.id)}
            />
          )}
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0 border shadow-sm group-hover:border-primary/30 transition-colors">
              <Image
                src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
                alt={system.name}
                fill
                unoptimized
                sizes="64px"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1">
              {onUpdate ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <AddPrebuiltDialog
                    initialData={system}
                    parts={parts}
                    onSave={(data) => onUpdate(system.id, data)}
                  >
                    <p className="font-headline text-base group-hover:text-primary transition-colors cursor-pointer hover:underline underline-offset-4 decoration-primary/30 italic">
                      {system.name}
                    </p>
                  </AddPrebuiltDialog>
                </div>
              ) : (
                <p className="font-headline text-base group-hover:text-primary transition-colors">{system.name}</p>
              )}
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
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {showActions && onArchive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                    title={isArchiveView ? "Restore" : "Archive"}
                  >
                    {isArchiveView ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isArchiveView ? "Restore System?" : "Archive System?"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isArchiveView 
                        ? `This will restore ${system.name} to the public showcase.`
                        : `This will move ${system.name} to the archive. It will no longer be visible to customers.`
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(system.id, !isArchiveView);
                      }}
                      className={isArchiveView ? "bg-primary hover:bg-primary/90" : "bg-orange-500 hover:bg-orange-600"}
                    >
                      {isArchiveView ? "Restore" : "Archive"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {showActions && onDelete && isSuperAdmin ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
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
            ) : !showActions && (
              (() => {
                if (!isComplete) {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed">
                            <Button size="icon" variant="outline" disabled className="opacity-50">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Incomplete: {missingParts.join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                if (stockStatus === 'loading') {
                  return (
                    <Button size="icon" variant="outline" disabled>
                      <ShieldCheck className="h-4 w-4 animate-pulse" />
                    </Button>
                  );
                }

                if (stockStatus === 'out-of-stock') {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed">
                            <Button size="icon" variant="outline" disabled className="opacity-50">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Out of Stock: One or more components are unavailable.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return (
                  <Button size="icon" variant="outline" onClick={() => handleReserve(system.name)} title="Reserve this Prebuilt">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                );
              })()
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-muted/10">
          <TableCell colSpan={6} className="p-4 pt-0">
            <div className="bg-background/50 rounded-lg p-4 border border-border/40 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Component Breakdown</p>
              <PrebuiltCardSpecs components={system.components} expanded={true} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
