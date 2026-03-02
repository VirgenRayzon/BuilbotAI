import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { PrebuiltSystem } from '@/lib/types';
import { ShoppingCart, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getMissingParts } from '@/lib/prebuilt-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PrebuiltDetailsModal } from './prebuilt-details-modal';
import { PrebuiltCardSpecs } from './prebuilt-card-specs';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartImageMagnifier } from './smart-image-magnifier';

interface PrebuiltSystemCardProps {
  system: PrebuiltSystem;
}

export function PrebuiltSystemCard({ system }: PrebuiltSystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    if (!isComplete) return;

    toast({
      title: 'Added to Cart',
      description: `${system.name} has been added to your cart.`,
    });
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    setIsExpanded(!isExpanded);
  };

  return (
    <PrebuiltDetailsModal system={system}>
      <Card className="flex flex-col h-full overflow-hidden transform group hover:-translate-y-1.5 transition-all duration-300 ease-out hover:shadow-xl hover:border-primary/40 cursor-pointer relative bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader className="p-3.5 pb-0 relative z-10">
          <div className="aspect-video relative w-full overflow-hidden rounded-lg mb-2.5 shadow-sm group-hover:shadow-md transition-shadow bg-muted/30">
            <SmartImageMagnifier
              src={system.imageUrl}
              alt={system.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex justify-between items-start gap-2 h-10 mb-1">
            <CardTitle className="text-base font-headline leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-grow">{system.name}</CardTitle>
            <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase tracking-tighter border-primary/20 text-primary/70 shrink-0">
              {system.tier}
            </Badge>
          </div>

          <CardDescription className={`text-[11px] leading-relaxed text-muted-foreground/80 ${isExpanded ? '' : 'line-clamp-2 h-8'}`}>
            {system.description}
          </CardDescription>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="py-2 border-t border-primary/10 mt-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-primary/60 mb-1.5">Detailed Components</p>
                  <PrebuiltCardSpecs components={system.components} expanded={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <div className="min-h-[50px] pt-1 transition-all duration-300">
              <PrebuiltCardSpecs components={system.components} />
            </div>
          )}
        </CardHeader>

        <CardFooter className="p-3.5 pt-0 flex flex-col gap-2 mt-auto relative z-10">
          <div className="flex justify-between items-center w-full py-1">
            <p className="text-xl font-bold font-headline text-primary tracking-tight">{formatCurrency(system.price)}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={toggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className="w-full h-9">
            {!isComplete ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      <Button size="sm" variant="outline" disabled className="w-full h-full opacity-50 bg-secondary/20 border-red-500/20 text-red-500 text-[10px] uppercase font-bold tracking-widest">
                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                        Incomplete
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-[10px]">Missing: {missingParts.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button size="sm" onClick={handleAddToCart} className="w-full h-full group/btn text-[10px] uppercase font-bold tracking-widest">
                <ShoppingCart className="mr-2 h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5" />
                Add to Cart
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </PrebuiltDetailsModal>
  );
}
