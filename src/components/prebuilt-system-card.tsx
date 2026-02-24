"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { PrebuiltSystem } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getMissingParts } from '@/lib/prebuilt-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from 'lucide-react';
import { PrebuiltDetailsModal } from './prebuilt-details-modal';

interface PrebuiltSystemCardProps {
  system: PrebuiltSystem;
}

export function PrebuiltSystemCard({ system }: PrebuiltSystemCardProps) {
  const { toast } = useToast();

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  const handleAddToCart = () => {
    if (!isComplete) return;

    toast({
      title: 'Added to Cart',
      description: `${system.name} has been added to your cart.`,
    });
  }

  return (
    <PrebuiltDetailsModal system={system}>
      <Card className="flex flex-col h-full overflow-hidden transform group hover:-translate-y-1.5 transition-all duration-300 ease-out hover:shadow-xl hover:border-primary/40 cursor-pointer">
        <CardHeader className="p-4 pb-2 relative z-10">
          <div className="aspect-video relative w-full overflow-hidden rounded-md mb-2 shadow-sm group-hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Image
              src={system.imageUrl}
              alt={system.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <CardTitle className="text-lg font-headline leading-tight h-12 line-clamp-2 group-hover:text-primary transition-colors">{system.name}</CardTitle>
          <CardDescription className="text-xs pt-1 h-10 line-clamp-2 text-muted-foreground/80">{system.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0">
          <Badge variant="outline" className="text-xs">
            {system.tier}
          </Badge>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <p className="text-lg font-bold font-headline">{formatCurrency(system.price)}</p>

          {!isComplete ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">
                    <Button size="sm" variant="outline" disabled className="opacity-50">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Incomplete
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Missing: {missingParts.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button size="sm" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          )}
        </CardFooter>
      </Card>
    </PrebuiltDetailsModal>
  );
}
