"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { YourBuild } from "@/components/your-build";
import {
  Cpu,
  Server,
  CircuitBoard,
  MemoryStick,
  Database,
  Power,
  RectangleVertical,
  Wind,
  Plus,
  X,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Monitor
} from "lucide-react";
import type { ComponentData, Part, Build } from "@/lib/types";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { PCVisualizer } from "@/components/pc-visualizer";
import { useUserProfile } from "@/context/user-profile";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentCategories = [
  { name: "CPU", icon: Cpu },
  { name: "GPU", icon: Server },
  { name: "Motherboard", icon: CircuitBoard },
  { name: "RAM", icon: MemoryStick },
  { name: "Storage", icon: Database },
  { name: "PSU", icon: Power },
  { name: "Case", icon: RectangleVertical },
  { name: "Cooler", icon: Wind },
];

export default function BuilderPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, loading: authLoading } = useUserProfile();
  const router = useRouter();

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    }
  }, [authUser, authLoading, router]);

  // Fetch each category collection
  const cpuQuery = useMemo(() => firestore ? collection(firestore, 'CPU') : null, [firestore]);
  const { data: cpus, loading: cpusLoading } = useCollection<PartWithoutCategory>(cpuQuery);
  const gpuQuery = useMemo(() => firestore ? collection(firestore, 'GPU') : null, [firestore]);
  const { data: gpus, loading: gpusLoading } = useCollection<PartWithoutCategory>(gpuQuery);
  const motherboardQuery = useMemo(() => firestore ? collection(firestore, 'Motherboard') : null, [firestore]);
  const { data: motherboards, loading: motherboardsLoading } = useCollection<PartWithoutCategory>(motherboardQuery);
  const ramQuery = useMemo(() => firestore ? collection(firestore, 'RAM') : null, [firestore]);
  const { data: rams, loading: ramsLoading } = useCollection<PartWithoutCategory>(ramQuery);
  const storageQuery = useMemo(() => firestore ? collection(firestore, 'Storage') : null, [firestore]);
  const { data: storages, loading: storagesLoading } = useCollection<PartWithoutCategory>(storageQuery);
  const psuQuery = useMemo(() => firestore ? collection(firestore, 'PSU') : null, [firestore]);
  const { data: psus, loading: psusLoading } = useCollection<PartWithoutCategory>(psuQuery);
  const caseQuery = useMemo(() => firestore ? collection(firestore, 'Case') : null, [firestore]);
  const { data: cases, loading: casesLoading } = useCollection<PartWithoutCategory>(caseQuery);
  const coolerQuery = useMemo(() => firestore ? collection(firestore, 'Cooler') : null, [firestore]);
  const { data: coolers, loading: coolersLoading } = useCollection<PartWithoutCategory>(coolerQuery);

  // Combine all parts and add category back
  const allParts = useMemo(() => {
    const allParts: Part[] = [];
    cpus?.forEach(p => allParts.push({ ...p, category: 'CPU' }));
    gpus?.forEach(p => allParts.push({ ...p, category: 'GPU' }));
    motherboards?.forEach(p => allParts.push({ ...p, category: 'Motherboard' }));
    rams?.forEach(p => allParts.push({ ...p, category: 'RAM' }));
    storages?.forEach(p => allParts.push({ ...p, category: 'Storage' }));
    psus?.forEach(p => allParts.push({ ...p, category: 'PSU' }));
    cases?.forEach(p => allParts.push({ ...p, category: 'Case' }));
    coolers?.forEach(p => allParts.push({ ...p, category: 'Cooler' }));
    return allParts;
  }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers]);

  const [build, setBuild] = useState<Record<string, ComponentData | ComponentData[] | null>>({
    CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: [], PSU: null, Case: null, Cooler: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle AI suggestions from window-level
  useEffect(() => {
    const findPartRobustly = (suggestion: string) => {
      // 1. Exact Match
      let part = allParts.find(p => p.name.toLowerCase() === suggestion.toLowerCase());
      if (part) return part;

      // 2. Remove parentheticals (e.g. "Model X (or similar)")
      const cleanSuggestion = suggestion.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
      part = allParts.find(p => p.name.toLowerCase() === cleanSuggestion);
      if (part) return part;

      // 3. Substring match (if suggestion is a specific name that exists in a longer name)
      part = allParts.find(p => p.name.toLowerCase().includes(cleanSuggestion) || cleanSuggestion.includes(p.name.toLowerCase()));
      if (part) return part;

      // 4. Token intersection (find part with highest matching word count)
      const suggestionTokens = cleanSuggestion.split(' ').filter(t => t.length > 2);
      let bestMatch = null;
      let maxScore = 0;

      for (const p of allParts) {
        const nameTokens = p.name.toLowerCase().split(' ');
        let score = 0;
        for (const token of suggestionTokens) {
          if (nameTokens.some(nt => nt.includes(token) || token.includes(nt))) {
            score++;
          }
        }
        if (score > maxScore && score >= suggestionTokens.length * 0.5) { // At least 50% tokens match
          maxScore = score;
          bestMatch = p;
        }
      }

      return bestMatch;
    };

    const handleAddSuggestion = (e: any) => {
      const modelName = e.detail.model;
      const part = findPartRobustly(modelName);
      if (part) {
        handlePartToggle(part);
      } else {
        toast({
          variant: "destructive",
          title: "Part Not Found",
          description: `Could not find "${modelName}" in the current inventory.`
        });
      }
    };

    (window as any).__BOT_ADD_PART__ = (modelName: string) => {
      const part = findPartRobustly(modelName);
      if (part) handlePartToggle(part);
    };

    window.addEventListener('add-suggestion', handleAddSuggestion);
    return () => {
      window.removeEventListener('add-suggestion', handleAddSuggestion);
      delete (window as any).__BOT_ADD_PART__;
    };
  }, [allParts, build]);

  const loading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading;

  useEffect(() => {
    const saved = localStorage.getItem('pc_builder_state');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setBuild(prev => ({ ...prev, ...parsedState }));
      } catch (e) {
        console.error("Failed to parse saved build", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pc_builder_state', JSON.stringify(build));
    }
  }, [build, isLoaded]);

  const handleClearBuild = () => {
    setBuild({
      CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: [], PSU: null, Case: null, Cooler: null,
    });
    toast({ title: 'Build Cleared', description: 'Your build has been reset.' });
  };

  const handleRemovePart = (category: string, index?: number) => {
    setBuild(prev => {
      const next = { ...prev };
      if (category === 'Storage' && typeof index === 'number') {
        const currentStorage = [...(next['Storage'] as ComponentData[])];
        currentStorage.splice(index, 1);
        next['Storage'] = currentStorage;
      } else {
        next[category] = null;
      }
      return next;
    });
  };

  const [categories, setCategories] = useState(
    componentCategories.map(c => ({ name: c.name, selected: true, icon: c.icon }))
  );

  const [sortBy, setSortBy] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getCountInBuild = (partName: string) => {
    let count = 0;
    Object.entries(build).forEach(([category, data]) => {
      if (Array.isArray(data)) {
        count += data.filter(d => d.model === partName).length;
      } else if (data && data.model === partName) {
        count++;
      }
    });
    return count;
  };

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    setCurrentPage(1);
    setCategories(prev => {
      if (categoryName === 'All') {
        return prev.map(cat => ({ ...cat, selected: true }));
      } else {
        return prev.map(cat => ({
          ...cat,
          selected: cat.name === categoryName
        }));
      }
    });
  };

  const handlePartToggle = (part: Part) => {
    const category = part.category;

    if (category === 'Storage') {
      const currentCount = getCountInBuild(part.name);
      if (currentCount >= part.stock) {
        toast({ variant: 'destructive', title: 'Out of Stock', description: `No more units of ${part.name} available.` });
        return;
      }

      const componentData: ComponentData = {
        id: part.id,
        model: part.name,
        price: part.price,
        description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
        image: part.imageUrl,
        imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        icon: componentCategories.find(c => c.name === category)!.icon,
        wattage: part.wattage,
        socket: part.socket || part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString(),
        ramType: part.ramType || part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.specifications?.['Memory']?.toString(),
        performanceScore: part.performanceScore,
        performanceTier: part.performanceTier,
        specifications: part.specifications,
        dimensions: part.dimensions,
      };

      setBuild(prevBuild => ({
        ...prevBuild,
        Storage: [...(prevBuild['Storage'] as ComponentData[]), componentData]
      }));
      toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
      return;
    }

    const { compatible, message } = checkCompatibility(part, build);
    const isCurrentlySelected = (build[category] as ComponentData)?.model === part.name;

    if (isCurrentlySelected) {
      // Part is already selected, so remove it
      setBuild(prevBuild => ({ ...prevBuild, [category]: null }));
      toast({ title: 'Part Removed', description: `${part.name} has been removed from your build.` });
    } else {
      if (!compatible) {
        toast({
          variant: 'destructive',
          title: 'Compatibility Error',
          description: message || `This ${category} is not compatible with your current build.`
        });
        return;
      }

      const currentCount = getCountInBuild(part.name);
      if (currentCount >= part.stock) {
        toast({ variant: 'destructive', title: 'Out of Stock', description: `${part.name} is currently unavailable.` });
        return;
      }

      // Part is not selected or a different one is, so add/replace it
      const componentData: ComponentData = {
        id: part.id,
        model: part.name,
        price: part.price,
        description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
        image: part.imageUrl,
        imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        icon: componentCategories.find(c => c.name === category)!.icon,
        wattage: part.wattage,
        socket: part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString(),
        ramType: part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.specifications?.['Memory']?.toString(),
        performanceScore: part.performanceScore,
        performanceTier: part.performanceTier,
        specifications: part.specifications,
        dimensions: part.dimensions,
      };

      setBuild(prevBuild => ({ ...prevBuild, [category]: componentData }));
      toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
    }
  };

  const checkCompatibility = (part: Part, currentBuild: any) => {
    const category = part.category;
    const cpu = currentBuild['CPU'] as ComponentData | null;
    const mobo = currentBuild['Motherboard'] as ComponentData | null;
    const ram = currentBuild['RAM'] as ComponentData | null;

    const normalize = (s?: string | null) => s?.toString().trim().toLowerCase() || '';

    const partSocket = normalize(part.socket || part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString());
    const partRamType = normalize(part.ramType || part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.specifications?.['Memory']?.toString());

    if (category === 'CPU') {
      if (mobo) {
        const moboSocket = normalize(mobo.socket || mobo.specifications?.['Socket']?.toString());
        if (partSocket && moboSocket && moboSocket !== partSocket) {
          return { compatible: false, message: `This CPU uses ${partSocket.toUpperCase()} socket, but your motherboard is ${moboSocket.toUpperCase()}.` };
        }
      }
    }

    if (category === 'Motherboard') {
      if (cpu) {
        const cpuSocket = normalize(cpu.socket || cpu.specifications?.['Socket']?.toString());
        if (partSocket && cpuSocket && cpuSocket !== partSocket) {
          return { compatible: false, message: `This motherboard is ${partSocket.toUpperCase()}, but your CPU uses ${cpuSocket.toUpperCase()}.` };
        }
      }
      if (ram) {
        const currentRamType = normalize(ram.ramType || ram.specifications?.['Memory Type']?.toString() || ram.specifications?.['RAM Type']?.toString());
        if (partRamType && currentRamType) {
          if (!partRamType.includes(currentRamType) && !currentRamType.includes(partRamType)) {
            return { compatible: false, message: `This motherboard supports ${partRamType.toUpperCase()}, but your RAM is ${currentRamType.toUpperCase()}.` };
          }
        }
      }
    }

    if (category === 'RAM') {
      if (mobo) {
        const moboRamType = normalize(mobo.ramType || mobo.specifications?.['Memory Type']?.toString() || mobo.specifications?.['RAM Type']?.toString());
        if (moboRamType && partRamType) {
          if (!moboRamType.includes(partRamType) && !partRamType.includes(moboRamType)) {
            return { compatible: false, message: `Your motherboard supports ${moboRamType.toUpperCase()}, but this RAM is ${partRamType.toUpperCase()}.` };
          }
        }
      }
    }

    return { compatible: true, message: '' };
  };

  const sortedAndFilteredParts = useMemo(() => {
    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const parts = (allParts?.filter(part => selectedCategories.includes(part.category)) ?? [])
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'Name') compare = (a.name || '').localeCompare(b.name || '');
        else if (sortBy === 'Price') compare = (a.price || 0) - (b.price || 0);
        return sortDirection === 'asc' ? compare : -compare;
      });

    return parts.map(part => {
      const effectiveStock = part.stock - getCountInBuild(part.name);
      return {
        ...part,
        effectiveStock,
        compatibility: checkCompatibility(part, build)
      };
    });
  }, [allParts, categories, sortBy, sortDirection, build]);

  const totalPages = Math.ceil(sortedAndFilteredParts.length / itemsPerPage);
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredParts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredParts, currentPage, itemsPerPage]);

  const isSelected = (part: Part) => {
    return part.category === 'Storage'
      ? (build['Storage'] as ComponentData[]).some(c => c.model === part.name)
      : (build[part.category] as ComponentData)?.model === part.name;
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-headline font-bold">Build Your Masterpiece</h1>
          <p className="text-muted-foreground mt-2">
            Select high-performance components and let our AI ensure everything fits
            perfectly together.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">

          <InventoryToolbar
            categories={categories}
            onCategoryChange={handleCategoryChange}
            itemCount={sortedAndFilteredParts.length}
            sortBy={sortBy}
            onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
            sortDirection={sortDirection}
            onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
            supportedSorts={['Name', 'Price']}
            view={view}
            onViewChange={setView}
            showViewToggle={true}
          />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4"><Skeleton className="aspect-video w-full mb-2" /></CardContent>
                  <CardContent className="p-4 pt-0 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-9 w-20" /></CardFooter>
                </Card>
              ))}
            </div>
          ) : sortedAndFilteredParts.length > 0 ? (
            view === 'grid' ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {paginatedParts.map(part => (
                    <PartCard
                      key={part.id}
                      part={part}
                      effectiveStock={(part as any).effectiveStock}
                      onToggleBuild={handlePartToggle}
                      isSelected={isSelected(part)}
                      compatibility={(part as any).compatibility}
                    />
                  ))}
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
            ) : (
              <Card className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParts.map(part => {
                      const isSelected = part.category === 'Storage'
                        ? (build['Storage'] as ComponentData[]).some(c => c.model === part.name)
                        : (build[part.category] as ComponentData)?.model === part.name;
                      return (
                        <TableRow key={part.id} className={(part as any).effectiveStock === 0 && !isSelected ? "opacity-50 grayscale" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Image src={part.imageUrl} alt={part.name} width={40} height={40} className="rounded-sm object-cover" />
                              <div>
                                <p className="font-semibold">{part.name}</p>
                                <p className="text-xs text-muted-foreground">{part.brand}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(part as any).effectiveStock > 5 ? "secondary" : (part as any).effectiveStock > 0 ? "destructive" : "outline"}>
                              {(part as any).effectiveStock > 0 ? `${(part as any).effectiveStock} in stock` : "Out of stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(part.price)}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              onClick={() => handlePartToggle(part)}
                              disabled={((part as any).effectiveStock === 0 && !isSelected) || ((part as any).compatibility && !(part as any).compatibility.compatible && !isSelected)}
                              variant={isSelected ? 'destructive' : 'default'}
                            >
                              {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </Card>
            )
          ) : (
            <Card className="mt-6 min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground p-6">
                <p>No components found for the selected categories.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-20 flex flex-col gap-6 pb-4 pr-2">
            <YourBuild build={build} onClearBuild={handleClearBuild} onRemovePart={handleRemovePart} />
            <PCVisualizer build={build} />
          </div>
        </div>
      </div>
    </main >
  );
}
