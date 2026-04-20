"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
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
  Monitor,
  Keyboard,
  Mouse,
  Headphones
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
import { formatCurrency, cn, getOptimizedStorageUrl } from "@/lib/utils";
import { FullPageLoader } from "@/components/full-page-loader";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { useUserProfile } from "@/context/user-profile";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { FloatingInsights } from "@/components/floating-insights";
import { useLoading } from "@/context/loading-context";
import { LayoutPanelLeft } from "lucide-react";
import type { Resolution, WorkloadType } from "@/lib/types";
import { checkCompatibility } from "@/lib/compatibility";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentCategories = [
  { name: "Case", icon: RectangleVertical },
  { name: "Motherboard", icon: CircuitBoard },
  { name: "CPU", icon: Cpu },
  { name: "GPU", icon: Server },
  { name: "RAM", icon: MemoryStick },
  { name: "Storage", icon: Database },
  { name: "PSU", icon: Power },
  { name: "Cooler", icon: Wind },
  { name: "Monitor", icon: Monitor },
  { name: "Keyboard", icon: Keyboard },
  { name: "Mouse", icon: Mouse },
  { name: "Headset", icon: Headphones },
];

export default function BuilderPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();
  const router = useRouter();

  // Redirect unauthenticated users to sign-in or admins to admin dashboard
  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/signin');
      } else if (profile?.isManager || profile?.isSuperAdmin) {
        router.push('/admin');
      }
    }
  }, [authUser, profile, authLoading, router]);

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
  const monitorQuery = useMemo(() => firestore ? collection(firestore, 'Monitor') : null, [firestore]);
  const { data: monitors, loading: monitorsLoading } = useCollection<PartWithoutCategory>(monitorQuery);
  const keyboardQuery = useMemo(() => firestore ? collection(firestore, 'Keyboard') : null, [firestore]);
  const { data: keyboards, loading: keyboardsLoading } = useCollection<PartWithoutCategory>(keyboardQuery);
  const mouseQuery = useMemo(() => firestore ? collection(firestore, 'Mouse') : null, [firestore]);
  const { data: mice, loading: miceLoading } = useCollection<PartWithoutCategory>(mouseQuery);
  const headsetQuery = useMemo(() => firestore ? collection(firestore, 'Headset') : null, [firestore]);
  const { data: headsets, loading: headsetsLoading } = useCollection<PartWithoutCategory>(headsetQuery);

  // Combine all parts and add category back
  const allParts = useMemo(() => {
    const allParts: Part[] = [];
    cpus?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'CPU' }));
    gpus?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'GPU' }));
    motherboards?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Motherboard' }));
    rams?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'RAM' }));
    storages?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Storage' }));
    psus?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'PSU' }));
    cases?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Case' }));
    coolers?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Cooler' }));
    monitors?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Monitor' }));
    keyboards?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Keyboard' }));
    mice?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Mouse' }));
    headsets?.filter(p => !p.isArchived).forEach(p => allParts.push({ ...p, category: 'Headset' }));
    return allParts;
  }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers, monitors, keyboards, mice, headsets]);

  const [build, setBuild] = useState<Record<string, ComponentData | ComponentData[] | null>>({
    CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
    Monitor: null, Keyboard: null, Mouse: null, Headset: null,
  });
  const [resolution, setResolution] = useState<Resolution>('1440p');
  const [workload, setWorkload] = useState<WorkloadType>('Balanced');
  const [showInsights, setShowInsights] = useState(false);
  const [isInsightsPinned, setIsInsightsPinned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setIsPageLoading } = useLoading();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with global layout loading
  useEffect(() => {
    setIsPageLoading(!mounted || authLoading || !isLoaded);
    
    // Cleanup on unmount
    return () => setIsPageLoading(false);
  }, [mounted, authLoading, isLoaded, setIsPageLoading]);

  // Handle AI suggestions from window-level
  useEffect(() => {
    const findPartRobustly = (suggestion: string, partId?: string) => {
      // 0. ID Match (Highest Priority)
      if (partId) {
        const part = allParts.find(p => p.id === partId);
        if (part) return part;
      }

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
      const partId = e.detail.id;
      const part = findPartRobustly(modelName, partId);
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

    (window as any).__BOT_ADD_PART__ = (modelName: string, partId?: string) => {
      const part = findPartRobustly(modelName, partId);
      if (part) handlePartToggle(part);
    };

    window.addEventListener('add-suggestion', handleAddSuggestion);
    return () => {
      window.removeEventListener('add-suggestion', handleAddSuggestion);
      delete (window as any).__BOT_ADD_PART__;
    };
  }, [allParts, build]);

  const loading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading || monitorsLoading || keyboardsLoading || miceLoading || headsetsLoading;

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

  const handleClearBuild = () => {
    setBuild({
      CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
      Monitor: null, Keyboard: null, Mouse: null, Headset: null,
    });
    toast({ title: 'Build Cleared', description: 'Your build has been reset.' });
  };

  const handleRemovePart = (category: string, index?: number) => {
    let next = { ...build };
    let toastMsg: { title: string; description: string } | null = null;

    if ((category === 'Storage' || category === 'RAM') && typeof index === 'number') {
      const currentItems = [...(next[category] as ComponentData[])];
      currentItems.splice(index, 1);
      next[category] = currentItems;
    } else {
      next[category] = null;

      // CASCADING REMOVAL LOGIC
      if (category === 'Case') {
        // Remove Motherboard and everything else
        Object.keys(next).forEach(key => {
          if (key === 'RAM' || key === 'Storage') next[key] = [];
          else next[key] = null;
        });
        toastMsg = { title: 'Build Reset', description: 'Removing the case removes all other components.' };
      } else if (category === 'Motherboard') {
        // Remove everything except Case
        Object.keys(next).forEach(key => {
          if (key !== 'Case') {
            if (key === 'RAM' || key === 'Storage') next[key] = [];
            else next[key] = null;
          }
        });
        toastMsg = { title: 'Components Removed', description: 'Changing or removing the motherboard removes all dependent parts.' };
      }

      // Auto-remove stock cooler if CPU is removed
      const currentCooler = next['Cooler'] as ComponentData | null;
      if (category === 'CPU' && currentCooler?.id === 'included-stock-cooler') {
        next['Cooler'] = null;
        toastMsg = { title: 'Cooler Removed', description: 'Stock cooler removed with its CPU.' };
      }
    }

    setBuild(next);
    if (toastMsg) {
      toast(toastMsg);
    }
  };

  const [categories, setCategories] = useState(
    componentCategories.map(c => ({ name: c.name, selected: true }))
  );

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pc_builder_state', JSON.stringify(build));

      // After loading/saving, check if motherboard is selected.
      // If not, and we are not already filtered to Motherboard, suggest it.
      if (!build['Motherboard'] && categories.some(c => c.selected && c.name !== 'Motherboard')) {
        // We don't force it every render to avoid annoying the user if they specifically want to look at something else,
        // but on initial load (when build is empty), we should definitely default to it.
      }
    }
  }, [build, isLoaded, categories]);


  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Date Added');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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
        const anyUnselected = prev.some(cat => !cat.selected);
        return prev.map(cat => ({ ...cat, selected: anyUnselected }));
      }
      return prev.map(cat => ({
        ...cat,
        selected: cat.name === categoryName ? true : false
      }));
    });
  };

  const handlePartToggle = (part: Part) => {
    const category = part.category;
    let nextBuild = { ...build };
    const toastsToShow: { title: string; description: string; variant?: "default" | "destructive" }[] = [];

    // SELECTION ORDER ENFORCEMENT
    if (category !== 'Case' && !build['Case']) {
      toast({
        variant: 'destructive',
        title: 'Selection Order',
        description: 'Please select a Case first before adding other components.'
      });
      return;
    }

    if (category !== 'Case' && category !== 'Motherboard' && !build['Motherboard']) {
      toast({
        variant: 'destructive',
        title: 'Selection Order',
        description: 'Please select a Motherboard before adding other components.'
      });
      return;
    }

    const { compatible, message } = checkCompatibility(part, build);

    if (category === 'Storage' || category === 'RAM') {
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

      const currentItems = Array.isArray(nextBuild[category]) ? (nextBuild[category] as ComponentData[]) : (nextBuild[category] ? [nextBuild[category] as ComponentData] : []);
      nextBuild[category] = [...currentItems, componentData];
      
      setBuild(nextBuild);
      toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
      return;
    }

    const isCurrentlySelected = (build[category] as ComponentData)?.model === part.name;

    if (isCurrentlySelected) {
      // Part is already selected, so remove it
      nextBuild[category] = null;

      // CASCADING REMOVAL ON TOGGLE OFF
      if (category === 'Case') {
        // Remove Motherboard and everything else
        Object.keys(nextBuild).forEach(key => {
          if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
          else nextBuild[key] = null;
        });
        toastsToShow.push({ title: 'Build Reset', description: 'Removing the case removes all other components.' });
      } else if (category === 'Motherboard') {
        // Remove everything except Case
        Object.keys(nextBuild).forEach(key => {
          if (key !== 'Case') {
            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
            else nextBuild[key] = null;
          }
        });
        toastsToShow.push({ title: 'Components Removed', description: 'Changing or removing the motherboard removes all dependent parts.' });
      }
      
      // Auto-remove stock cooler if it was the included one for this CPU
      const currentCooler = nextBuild['Cooler'] as ComponentData | null;
      if (category === 'CPU' && part.packageType === 'BOX' && currentCooler?.id === 'included-stock-cooler') {
        nextBuild['Cooler'] = null;
        toastsToShow.push({ title: 'Cooler Removed', description: 'Stock cooler removed with its CPU.' });
      }
      
      toastsToShow.push({ title: 'Part Removed', description: `${part.name} has been removed from your build.` });
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

      const prevBuildCopy = { ...nextBuild };
      nextBuild[category] = componentData;

      // CASCADING REMOVAL ON CHANGE
      const prevValue = prevBuildCopy[category];
      if (category === 'Case' && prevValue && !Array.isArray(prevValue) && prevValue.id !== componentData.id) {
        // If changing case, remove everything else
        Object.keys(nextBuild).forEach(key => {
          if (key !== 'Case') {
            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
            else nextBuild[key] = null;
          }
        });
        toastsToShow.push({ title: 'Build Updated', description: 'Changing the case removed dependent components.' });
      } else if (category === 'Motherboard' && prevValue && !Array.isArray(prevValue) && prevValue.id !== componentData.id) {
        // If changing motherboard, remove everything except Case
        Object.keys(nextBuild).forEach(key => {
          if (key !== 'Case' && key !== 'Motherboard') {
            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
            else nextBuild[key] = null;
          }
        });
        toastsToShow.push({ title: 'Build Updated', description: 'Changing the motherboard removed dependent components.' });
      }
      
      // Auto-add or update cooler if CPU category
      if (category === 'CPU') {
        const currentCooler = nextBuild['Cooler'] as ComponentData | null;
        if (part.packageType === 'BOX') {
          // If no cooler or currently a stock cooler, set/update to correct variant
          if (!currentCooler || currentCooler.id === 'included-stock-cooler') {
            const isIntel = part.brand.toLowerCase().includes('intel');
            const isAmd = part.brand.toLowerCase().includes('amd');
            const coolerModel = isIntel 
              ? "Intel Laminar RM1 CPU Cooler" 
              : isAmd 
                ? "AMD Wraith MAX CPU Cooler with RGB LED" 
                : `Stock Cooler (Included with ${part.name})`;

            if (currentCooler?.model !== coolerModel) {
              nextBuild['Cooler'] = {
                id: isAmd ? 'uGiAh2JerLwnDe5VW431' : 'included-stock-cooler',
                model: coolerModel,
                price: 0,
                description: `Standard retail cooling solution bundled with this ${part.brand} CPU.`,
                image: "https://picsum.photos/seed/stockcooler/800/600",
                imageHint: "included cooler",
                icon: Wind,
                wattage: 0,
                specifications: { "Type": "Air (Stock)" }
              };
              toastsToShow.push({ 
                title: 'Stock Cooler Sync', 
                description: `${coolerModel} has been ${currentCooler ? 'updated' : 'added'} for your ${part.brand} CPU.` 
              });
            }
          }
        } else if (part.packageType === 'TRAY' && currentCooler?.id === 'included-stock-cooler') {
          // Remove stock cooler if switching to TRAY
          nextBuild['Cooler'] = null;
          toastsToShow.push({ title: 'Cooler Removed', description: 'Stock cooler removed as TRAY CPUs do not include one.' });
        }
      }
      
      toastsToShow.push({ title: 'Part Added', description: `${part.name} has been added to your build.` });
    }

    setBuild(nextBuild);
    toastsToShow.forEach(t => toast(t));
  };



  const sortedAndFilteredParts = useMemo(() => {
    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const searchLower = searchQuery.toLowerCase();

    const parts = (allParts?.filter(part => {
      const matchesCategory = selectedCategories.includes(part.category);
      const matchesSearch = part.name.toLowerCase().includes(searchLower) ||
        (part.brand?.toLowerCase() || '').includes(searchLower) ||
        part.category.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    }) ?? [])
      .sort((a, b) => {
        let compare = 0;
        
        // Primary Sort: Compatibility (Compatible first)
        const compA = checkCompatibility(a, build).compatible;
        const compB = checkCompatibility(b, build).compatible;
        
        if (compA !== compB) {
          return compA ? -1 : 1;
        }

        // Secondary Sort: User's selection
        if (sortBy === 'Name') compare = (a.name || '').localeCompare(b.name || '');
        else if (sortBy === 'Price') compare = (a.price || 0) - (b.price || 0);
        else if (sortBy === 'Date Added') {
          const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
          const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
          compare = new Date(dateA).getTime() - new Date(dateB).getTime();
        }
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
  }, [allParts, categories, sortBy, sortDirection, build, searchQuery]);

  const totalPages = Math.ceil(sortedAndFilteredParts.length / itemsPerPage);
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredParts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredParts, currentPage, itemsPerPage]);

  const isSelected = (part: Part) => {
    if (part.category === 'Storage' || part.category === 'RAM') {
      const items = build[part.category];
      if (Array.isArray(items)) {
        return items.some(c => c.model === part.name);
      }
      return (items as ComponentData)?.model === part.name;
    }
    return (build[part.category] as ComponentData)?.model === part.name;
  };

  if (!mounted || authLoading || !isLoaded) {
    return null;
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 overflow-x-hidden",
      isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
    )}>
      {/* Circuit Pattern Background */}
      <div className={cn(
        "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
        isDark ? "invert" : ""
      )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 md:pt-32 relative z-10">
      <div className="relative mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary italic">Forge Your Machine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none mb-6">
            Masterpiece <span className="text-primary italic">Architect</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed font-medium">
            Select high-performance components and let our AI ensure everything fits perfectly together through real-time compatibility diagnostics.
          </p>
        </motion.div>
        
        {/* Background Accent */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 xl:gap-8">
        {/* Left Sidebar: Build Insights (Pinned) */}
        {isInsightsPinned && (
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-120px)] sticky top-20">
            <FloatingInsights
              isOpen={true}
              onClose={() => setIsInsightsPinned(false)}
              build={build}
              resolution={resolution}
              onResolutionChange={setResolution}
              workload={workload}
              onWorkloadChange={setWorkload}
              isPinned={true}
              onTogglePin={() => setIsInsightsPinned(false)}
            />
          </div>
        )}

        {/* Center: Parts Grid (Dynamic width based on pinned state) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-3xl border backdrop-blur-xl shadow-2xl transition-all duration-500",
              isInsightsPinned ? "lg:col-span-6" : "lg:col-span-9",
              isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
            )}
          >
            <div className="mb-8">
              <InventoryToolbar
                categories={categories}
                onCategoryChange={handleCategoryChange}
                itemCount={sortedAndFilteredParts.length}
                sortBy={sortBy}
                onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                sortDirection={sortDirection}
                onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
                supportedSorts={['Date Added', 'Name', 'Price']}
                view={view}
                onViewChange={setView}
                showViewToggle={true}
                searchQuery={searchQuery}
                onSearchQueryChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="rounded-2xl border-white/5 bg-white/5">
                    <CardContent className="p-4"><Skeleton className="aspect-square w-full mb-2 rounded-xl" /></CardContent>
                    <CardContent className="p-4 pt-0 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-9 w-20" /></CardFooter>
                  </Card>
                ))}
              </div>
            ) : sortedAndFilteredParts.length > 0 ? (
              view === 'grid' ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 md:gap-6">
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
                  <div className="mt-12">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
                </>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/20">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="uppercase text-[10px] font-bold tracking-widest">Component Identity</TableHead>
                        <TableHead className="uppercase text-[10px] font-bold tracking-widest">Inventory State</TableHead>
                        <TableHead className="text-right uppercase text-[10px] font-bold tracking-widest">Value (PHP)</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedParts.map(part => {
                        const isPartSelected = isSelected(part);
                        return (
                          <TableRow key={part.id} className={cn(
                            "transition-all duration-300",
                            (part as any).effectiveStock === 0 && !isPartSelected && "opacity-50 grayscale",
                            (part as any).compatibility && !(part as any).compatibility.compatible && "bg-destructive/[0.03] hover:bg-destructive/[0.06] border-l-2 border-l-destructive shadow-[inset_4px_0_0_-2px_rgba(239,68,68,0.5)]"
                          )}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border/50">
                                  <Image src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"} alt={part.name} fill className="object-cover" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm">{part.name}</p>
                                  </div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{part.brand}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={(part as any).effectiveStock > 5 ? "secondary" : (part as any).effectiveStock > 0 ? "destructive" : "outline"} className="rounded-md uppercase text-[9px] font-bold">
                                {(part as any).effectiveStock > 0 ? `${(part as any).effectiveStock} UNITS` : "DEPLETED"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">{formatCurrency(part.price)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                {(!((part as any).compatibility && !(part as any).compatibility.compatible) || isPartSelected) && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePartToggle(part)}
                                    disabled={(part as any).effectiveStock === 0 && !isPartSelected}
                                    variant={isPartSelected ? 'destructive' : 'default'}
                                    className="rounded-lg gap-2"
                                  >
                                    {isPartSelected ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    <span className="hidden sm:inline text-[10px] font-bold uppercase">{isPartSelected ? 'Remove' : 'Add'}</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t border-border/50">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1 italic">Query Returned No Results</h3>
                <p className="text-muted-foreground text-sm max-w-xs">Adjust your diagnostic filters to explore alternative component configurations.</p>
              </div>
            )}
          </motion.div>

        {/* Right Sidebar: Your Build */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 flex flex-col gap-6 pb-4 pr-2">
            <YourBuild
              build={build}
              onClearBuild={handleClearBuild}
              onRemovePart={handleRemovePart}
              resolution={resolution}
              onResolutionChange={setResolution}
              workload={workload}
              onWorkloadChange={setWorkload}
              showSystemBalance={false}
            />
          </div>
        </div>
      </div>

      {/* Floating Insights Toggle & Panel (Only shown if NOT pinned, or if on mobile) */}
      <div className={cn("fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-4", isInsightsPinned ? "lg:hidden" : "")}>
        {!showInsights && (
          <Button
            size="lg"
            onClick={() => setShowInsights(true)}
            className="rounded-full shadow-2xl h-14 px-6 gap-3 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest border border-white/10 ring-4 ring-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <LayoutPanelLeft className="w-5 h-5" />
            Build Insights
          </Button>
        )}
      </div>

      {(!isInsightsPinned || showInsights) && (
        <FloatingInsights
          isOpen={showInsights}
          onClose={() => setShowInsights(false)}
          build={build}
          resolution={resolution}
          onResolutionChange={setResolution}
          workload={workload}
          onWorkloadChange={setWorkload}
          isPinned={false}
          onTogglePin={() => {
            setIsInsightsPinned(true);
            setShowInsights(false);
          }}
        />
      )}

      <BuilderFloatingChat build={build} />
    </main>
    </div>
  );
}
