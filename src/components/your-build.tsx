"use client";

import { useEffect, useMemo, useState } from "react";
import { Paper } from "@mantine/core";
import { X } from "lucide-react";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIProgressModal } from "@/components/ai-progress-modal";
import { BuildContent } from "@/components/build/build-content";
import { BuildActionFooter } from "@/components/build/build-action-footer";
import { useBuildActions } from "@/hooks/use-build-actions";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import type { ComponentData, FavoriteBuild, FavoriteBuildPart, Part, Resolution, WorkloadType } from "@/lib/types";
import type { PrebuiltBuilderAddFormSchema } from "@/components/prebuilt-builder-add-dialog";

interface YourBuildProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  onClearBuild: () => void;
  onRemovePart: (category: string, index?: number) => void;
  onAnalyze?: (forceRefresh?: boolean) => void;
  resolution: Resolution;
  onResolutionChange: (resolution: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  showSystemBalance?: boolean;
  className?: string;
  isManagerMode?: boolean;
  allParts?: Part[];
  onAddPrebuilt?: (data: PrebuiltBuilderAddFormSchema) => void | Promise<void>;
  analysis?: unknown;
  onAnalysisUpdate?: (analysis: any) => void;
  onCategorySelect?: (category: string) => void;
  categories?: { name: string; selected?: boolean }[];
}

const requiredCategories = ["Motherboard", "CPU", "GPU", "RAM", "Storage", "PSU", "Cooler", "Case"];
const savedCategories = [...requiredCategories, "Monitor", "Keyboard", "Mouse", "Headset"];

export function YourBuild({
  build, onClearBuild, onRemovePart, onAnalyze, showSystemBalance = true,
  className, isManagerMode = false, onAddPrebuilt, analysis, onAnalysisUpdate,
  onCategorySelect, categories,
}: YourBuildProps) {
  const user = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteBuild[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const settingsRef = useMemo(
    () => firestore ? doc(firestore, "siteSettings", "main") : null,
    [firestore]
  );
  const { data: settings } = useDoc<{ isAiKillSwitch?: boolean }>(settingsRef);

  const missingCategories = requiredCategories.filter((category) => {
    const value = build[category];
    return Array.isArray(value) ? value.length === 0 : !value;
  });
  const isBuildComplete = missingCategories.length === 0;
  const selectedParts = Object.values(build).reduce<number>(
    (sum, value) => sum + (Array.isArray(value) ? value.length : value ? 1 : 0), 0
  );
  const totalPrice = Object.values(build).reduce<number>(
    (sum, value) => sum + (Array.isArray(value)
      ? value.reduce((partSum, part) => partSum + (part.price || 0), 0)
      : value?.price || 0), 0
  );
  const totalWattage = requiredCategories.reduce((sum, category) => {
    if (!["CPU", "GPU", "Motherboard", "RAM", "Storage"].includes(category)) return sum;
    const value = build[category];
    return sum + (Array.isArray(value)
      ? value.reduce((partSum, part) => partSum + (part.wattage || 0), 0)
      : value?.wattage || 0);
  }, 0);
  const psu = build.PSU;
  const psuWattage = psu && !Array.isArray(psu) ? psu.wattage || 0 : 0;
  const activeFilter = categories?.filter((category) => category.selected);
  const activeCategory = activeFilter?.length === 1 ? activeFilter[0].name : null;

  const {
    isCheckingOut, showLocalAiProgress, setShowLocalAiProgress,
    aiPhase, isAiPending, tokensUsed, handleAddPrebuiltWithAi,
    handleCancelAi, handleCheckout, handleAnalyze,
  } = useBuildActions({
    build, user, isAiKillSwitch: settings?.isAiKillSwitch || false,
    onClearBuild, onAnalyze, onAddPrebuilt, totalPrice, onAnalysisUpdate,
  });

  useEffect(() => {
    if (isManagerMode || !user || !firestore) return;
    const favoritesQuery = query(
      collection(firestore, "users", user.uid, "favorites"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(favoritesQuery, (snapshot) => {
      setFavorites(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as FavoriteBuild)));
    });
  }, [isManagerMode, user, firestore]);

  const saveFavorite = async (name: string): Promise<boolean> => {
    if (!user || !firestore || !name.trim() || selectedParts === 0) return false;
    const parts: FavoriteBuildPart[] = [];
    savedCategories.forEach((category) => {
      const value = build[category];
      const items = Array.isArray(value) ? value : value ? [value] : [];
      items.forEach((part) => {
        parts.push({ category, partId: part.id, name: part.model, price: part.price || 0 });
      });
    });
    setIsSaving(true);
    try {
      await addDoc(collection(firestore, "users", user.uid, "favorites"), {
        name: name.trim(), parts, totalPrice, source: "builder", createdAt: serverTimestamp(),
      });
      toast({ title: "Build saved", description: "Saved as " + name.trim() + "." });
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: "Could not save build", description: "Please try again.", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const loadFavorite = (favorite: FavoriteBuild) => {
    window.dispatchEvent(new CustomEvent("load-favorite-build", { detail: favorite }));
    toast({ title: "Build loaded", description: favorite.name + " is now in Your Build." });
  };

  const renderContent = () => (
    <>
      <BuildContent
        build={build}
        onRemovePart={onRemovePart}
        onCategorySelect={onCategorySelect}
        activeFilter={activeCategory}
        categories={categories}
        showSystemBalance={showSystemBalance}
        totalWattage={totalWattage}
        psuWattage={psuWattage}
        totalPrice={totalPrice}
      />
      <BuildActionFooter
        build={build}
        totalPrice={totalPrice}
        selectedParts={selectedParts}
        missingCategories={missingCategories}
        isManagerMode={isManagerMode}
        isAiPending={isAiPending}
        isCheckingOut={isCheckingOut}
        isSaving={isSaving}
        analysis={analysis}
        favorites={favorites}
        onCategorySelect={onCategorySelect}
        onAnalyze={() => { if (isBuildComplete) void handleAnalyze(); }}
        onReserve={(onSuccess) => { if (isBuildComplete) void handleCheckout(onSuccess); }}
        onAddPrebuilt={() => { if (isBuildComplete) handleAddPrebuiltWithAi(); }}
        onSave={saveFavorite}
        onLoad={loadFavorite}
        onClear={onClearBuild}
      />
    </>
  );

  return (
    <>
      <div className="hidden lg:block">
        <Paper withBorder radius="lg" shadow="sm" className={cn(
          "sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-slate-900/5 dark:shadow-black/30",
          className
        )}>
          <div className="px-5 py-5 border-b border-slate-200 dark:border-white/10">
            <h2 className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Your Build</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Choose parts and reserve your setup.</p>
          </div>
          {renderContent()}
        </Paper>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/90 dark:bg-[#111722]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10">
        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between rounded-xl bg-[#448FC4] px-4 py-3 text-white shadow-lg">
              <span className="font-headline font-semibold">Your Build</span>
              <span className="font-bold">{formatCurrency(totalPrice)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" hideClose className="h-[85vh] p-0 flex flex-col rounded-t-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]">
            <SheetHeader className="px-5 py-4 flex flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 text-left">
              <SheetTitle className="font-headline text-lg font-bold text-slate-900 dark:text-slate-100">Your Build</SheetTitle>
              <SheetClose asChild>
                <button type="button" aria-label="Close Your Build" className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
              </SheetClose>
            </SheetHeader>
            <ScrollArea className="flex-1 min-h-0">{renderContent()}</ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <AIProgressModal
        isOpen={showLocalAiProgress}
        onComplete={() => setShowLocalAiProgress(false)}
        onCancel={handleCancelAi}
        title="Creating prebuilt"
        currentPhase={aiPhase}
        tokensUsed={tokensUsed || undefined}
      />
    </>
  );
}
