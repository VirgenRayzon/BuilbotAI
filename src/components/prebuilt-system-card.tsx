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
    <Card className="flex flex-col h-full overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <CardHeader className="p-4 pb-2">
        <div className="aspect-video relative w-full overflow-hidden rounded-md mb-2">
          <Image
            src={system.imageUrl}
            alt={system.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <CardTitle className="text-base font-headline leading-tight h-10 line-clamp-2">{system.name}</CardTitle>
        <CardDescription className="text-xs pt-1 h-8 line-clamp-2">{system.description}</CardDescription>
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
  );
}
