import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, getOptimizedStorageUrl, cn } from '@/lib/utils';
import type { PrebuiltSystem } from '@/lib/types';
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getMissingParts } from '@/lib/prebuilt-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PrebuiltCardSpecs } from './prebuilt-card-specs';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartImageMagnifier } from './smart-image-magnifier';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { reservePrebuiltSystem } from '@/app/prebuilt-reservation-actions';
import { useUserProfile } from '@/context/user-profile';
import type { Part } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface PrebuiltSystemCardProps {
  system: PrebuiltSystem;
}

export function PrebuiltSystemCard({ system }: PrebuiltSystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  const [partsStock, setPartsStock] = useState<Record<string, number>>({});
  const [resolvedParts, setResolvedParts] = useState<Record<string, Part>>({});
  const [loadingStock, setLoadingStock] = useState(isComplete);
  const [isReserving, setIsReserving] = useState(false);
  const firestore = useFirestore();
  const { authUser, profile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!firestore || !isComplete) {
      setLoadingStock(false);
      return;
    }

    const fetchStock = async () => {
      const stockMap: Record<string, number> = {};
      const partsMap: Record<string, Part> = {};
      try {
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
            const partData = { id: snap.id, ...snap.data() } as Part;
            stockMap[category] = partData.stock || 0;
            partsMap[category] = partData;
          } else {
            // Check by name for legacy
            const q = query(collection(firestore, collectionName), where("name", "==", partId));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const partData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
            }
          }
        });
        await Promise.all(promises);
        setPartsStock(stockMap);
        setResolvedParts(partsMap);
      } catch (e) {
        console.error("Stock check failed:", e);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [firestore, system.components, isComplete]);

  const isInStock = isComplete && Object.keys(partsStock).length > 0 && 
                    Object.values(partsStock).every(stock => stock > 0);

  const handleReserve = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isComplete || !authUser || !profile || isReserving || !isInStock) {
      if (!authUser) {
        toast({
          title: 'Sign In Required',
          description: 'Please sign in to reserve a prebuilt rig.',
          variant: 'destructive'
        });
      }
      return;
    }

    setIsReserving(true);
    try {
      // Prepare component map for the reservation action
      const componentsMap: Record<string, { id: string, name: string, price: number, category: string }> = {};
      Object.entries(resolvedParts).forEach(([category, part]) => {
        if (part) {
          componentsMap[category] = {
            id: part.id,
            name: part.name,
            price: part.price,
            category: category
          };
        }
      });

      const result = await reservePrebuiltSystem(
        authUser.uid,
        profile.email,
        profile.name || profile.email.split('@')[0],
        system,
        componentsMap
      );

      if (result.success) {
        toast({
          title: 'Reservation Successful',
          description: `Your reservation for ${system.name} has been recorded.`,
        });
        router.push('/profile');
      } else {
        toast({
          title: 'Reservation Failed',
          description: result.error || 'An error occurred during reservation.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsReserving(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Link href={`/pre-builts/${system.id}`} className="block h-full">
      <Card className={cn(
        "flex flex-col h-full overflow-hidden transform group hover:-translate-y-1.5 transition-all duration-300 ease-out hover:shadow-xl hover:border-primary/40 cursor-pointer relative bg-card/50 backdrop-blur-sm border-primary/10",
        (!isComplete || (!loadingStock && !isInStock)) && "grayscale-[0.8] opacity-80 border-destructive/20"
      )}>
        <CardHeader className="p-3.5 pb-0 relative z-10">
          <div className="aspect-square relative w-full overflow-hidden rounded-lg mb-2.5 shadow-sm group-hover:shadow-md transition-shadow bg-muted/30">
            <SmartImageMagnifier
              src={getOptimizedStorageUrl(system.imageUrl) || "/placeholder-system.png"}
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
            ) : !loadingStock && !isInStock ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      <Button size="sm" variant="outline" disabled className="w-full h-full opacity-50 bg-destructive/10 border-destructive/20 text-destructive text-[10px] uppercase font-bold tracking-widest">
                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                        Diagnostics Failed
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-[10px]">One or more components are currently out of stock.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                size="sm" 
                onClick={handleReserve} 
                disabled={loadingStock || isReserving} 
                className="w-full h-full group/btn text-[10px] uppercase font-bold tracking-widest"
              >
                {isReserving ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5" />
                )}
                {isReserving ? "Processing..." : "Reserve this Prebuilt"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
