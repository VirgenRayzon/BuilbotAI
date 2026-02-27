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
        <CardHeader className="p-4 pb-2 relative z-10">
          <div className="aspect-video relative w-full overflow-hidden rounded-md mb-2 shadow-sm group-hover:shadow-md transition-shadow">
            <SmartImageMagnifier
              src={system.imageUrl}
              alt={system.name}
              className="w-full h-full"
            />
          </div>
          <div className="flex justify-between items-start gap-2 h-12">
            <CardTitle className="text-lg font-headline leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-grow">{system.name}</CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter shrink-0 border-primary/20 text-primary/70">
              {system.tier}
            </Badge>
          </div>

          <CardDescription className={`text-xs pt-1 text-muted-foreground/80 ${isExpanded ? '' : 'line-clamp-2'}`}>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-1">Detailed Components</p>
                  <PrebuiltCardSpecs components={system.components} expanded={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <div className="min-h-[56px] pt-1 transition-all duration-300">
              <PrebuiltCardSpecs components={system.components} />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-grow p-4 pt-0">
          {/* Content moved to Header for better alignment */}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-3 mt-auto">
          <div className="flex justify-between items-center w-full">
            <p className="text-lg font-bold font-headline text-primary">{formatCurrency(system.price)}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={toggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className="w-full flex gap-2">
            {!isComplete ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed flex-grow">
                      <Button size="sm" variant="outline" disabled className="w-full opacity-50 bg-secondary/20 border-red-500/20 text-red-500">
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
              <Button size="sm" onClick={handleAddToCart} className="flex-grow group/btn">
                <ShoppingCart className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
                Add to Cart
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </PrebuiltDetailsModal>
  );
}
