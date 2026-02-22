"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

interface PartCardProps {
  part: Part;
  onAddToBuild: (part: Part) => void;
}

export function PartCard({ part, onAddToBuild }: PartCardProps) {
  const { toast } = useToast();

  const handleAdd = () => {
    if (part.stock === 0) return;
    onAddToBuild(part);
    toast({
      title: 'Part Added',
      description: `${part.name} has been added to your build.`,
    });
  }
  
  const mainSpecs = Object.entries(part.specifications).slice(0, 4);

  return (
    <TooltipProvider>
        <Card className={cn(
        "flex flex-col justify-between h-full overflow-hidden transform transition-transform duration-300 ease-in-out hover:-translate-y-1",
        part.stock === 0 && "grayscale opacity-60"
        )}>
            <CardHeader className="p-4 relative">
                <Button size="icon" onClick={handleAdd} disabled={part.stock === 0} className="absolute top-4 right-4 h-8 w-8 rounded-full">
                <Plus className="h-4 w-4" />
                </Button>
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
                            <React.Fragment>
                                <div className="text-xs text-muted-foreground uppercase">Stock</div>
                                <div className="text-xs font-semibold text-right">{part.stock > 0 ? part.stock : 'Out of stock'}</div>
                            </React.Fragment>
                        </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 flex-grow content-start">
                {mainSpecs.map(([key, value]) => (
                    <div key={key}>
                    <p className="text-xs text-muted-foreground uppercase">{key}</p>
                    <p className="font-semibold text-sm">{value}</p>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>
    </TooltipProvider>
  );
}
