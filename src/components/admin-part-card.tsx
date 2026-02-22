
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { StockEditor } from './stock-editor';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

interface AdminPartCardProps {
  part: Part;
  onDelete: (partId: string, category: Part['category']) => void;
  onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
}

export function AdminPartCard({ part, onDelete, onUpdateStock }: AdminPartCardProps) {
    const mainSpecs = Object.entries(part.specifications).slice(0, 4);

    return (
        <TooltipProvider>
            <Card className={cn(
            "flex flex-col justify-between h-full overflow-hidden",
            part.stock === 0 && "grayscale"
            )}>
            <CardHeader className="p-4 relative">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {part.name}.
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{part.brand}</p>
                <CardTitle className="text-lg font-headline leading-tight pr-10">{part.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-2xl font-bold font-headline">{formatCurrency(part.price)}</p>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Info className="h-4 w-4" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2">
                            {Object.entries(part.specifications).map(([key, value]) => (
                                <React.Fragment key={key}>
                                    <div className="text-xs text-muted-foreground uppercase">{key}</div>
                                    <div className="text-xs font-semibold text-right">{value}</div>
                                </React.Fragment>
                            ))}
                            {part.wattage && (
                                <>
                                <div className="text-xs text-muted-foreground uppercase">Wattage</div>
                                <div className="text-xs font-semibold text-right">{part.wattage}W</div>
                                </>
                            )}
                        </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Separator />
                <div className="mt-4 space-y-4 flex-grow flex flex-col justify-end">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 content-start">
                        {mainSpecs.map(([key, value]) => (
                            <div key={key}>
                            <p className="text-xs text-muted-foreground uppercase">{key}</p>
                            <p className="font-semibold text-sm">{value}</p>
                            </div>
                        ))}
                    </div>
                     <StockEditor
                        stock={part.stock}
                        onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
                    />
                </div>
            </CardContent>
            </Card>
        </TooltipProvider>
    );
}
