"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  ScrollArea as MantineScrollArea,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { AlertCircle, Bookmark, Cpu, FolderOpen, MoreHorizontal, Trash2, X } from "lucide-react";
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

const UNIFIED_MODAL_CLASSNAMES = {
  content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
  header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
  body: "!px-6 !pt-5 !pb-6",
  close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
};

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
  const [saveOpen, setSaveOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

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
      toast({ title: "Build saved", description: `Saved as "${name.trim()}".` });
      setSaveName("");
      setSaveOpen(false);
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
    toast({ title: "Build loaded", description: `"${favorite.name}" loaded into Your Build.` });
  };

  const handleConfirmClear = () => {
    onClearBuild();
    setClearOpen(false);
    toast({ title: "Build cleared", description: "All selected parts have been removed." });
  };

  const renderHeaderActions = () => (
    <Menu shadow="md" width={240} position="bottom-end" radius="md">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="md"
          aria-label="Build options"
          className="text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal size={17} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-xl p-1.5">
        <Menu.Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Build Actions
        </Menu.Label>

        <Menu.Item
          leftSection={<Bookmark size={15} className="text-cyan-500" />}
          onClick={() => {
            setSaveName(`Build ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
            setSaveOpen(true);
          }}
          disabled={selectedParts === 0}
          className="text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          Save Current Build
        </Menu.Item>

        <Menu.Item
          color="red"
          leftSection={<Trash2 size={15} className="text-rose-500" />}
          onClick={() => setClearOpen(true)}
          disabled={selectedParts === 0}
          className="text-xs font-medium rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          Clear All Parts
        </Menu.Item>

        <Menu.Divider className="my-1 border-slate-200 dark:border-white/10" />

        <Menu.Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Saved Configurations ({favorites.length})
        </Menu.Label>

        {favorites.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
            No saved builds yet
          </div>
        ) : (
          <MantineScrollArea.Autosize mah={180} scrollbarSize={5} offsetScrollbars>
            {favorites.map((fav) => (
              <Menu.Item
                key={fav.id}
                leftSection={<FolderOpen size={14} className="text-amber-500 shrink-0" />}
                onClick={() => loadFavorite(fav)}
                className="text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{fav.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {fav.parts?.length || 0} parts • {formatCurrency(fav.totalPrice || 0)}
                  </span>
                </div>
              </Menu.Item>
            ))}
          </MantineScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );

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
        analysis={analysis}
        onCategorySelect={onCategorySelect}
        onAnalyze={() => { if (isBuildComplete) void handleAnalyze(); }}
        onReserve={(onSuccess) => { if (isBuildComplete) void handleCheckout(onSuccess); }}
        onAddPrebuilt={() => { if (isBuildComplete) handleAddPrebuiltWithAi(); }}
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
          <Box className="px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Group justify="space-between" align="center">
              <Group gap="xs" align="center">
                <ThemeIcon size={32} radius="md" variant="light" color="cyan" className="shadow-xs">
                  <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} className="font-headline text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Your Build
                  </Title>
                  <Text size="xs" c="dimmed">
                    Choose parts and reserve your setup.
                  </Text>
                </div>
              </Group>
              <Group gap="xs" align="center">
                <Badge
                  size="sm"
                  variant={isBuildComplete ? "filled" : "light"}
                  color={isBuildComplete ? "teal" : selectedParts > 0 ? "cyan" : "gray"}
                  radius="md"
                  fw={700}
                  className="font-mono tracking-wider text-[11px]"
                >
                  {selectedParts} / {requiredCategories.length} Parts
                </Badge>
                {renderHeaderActions()}
              </Group>
            </Group>
          </Box>
          {renderContent()}
        </Paper>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/90 dark:bg-[#111722]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              fullWidth
              size="lg"
              radius="md"
              color="cyan"
              className="font-headline font-bold shadow-lg shadow-cyan-500/20"
            >
              <Group justify="space-between" className="w-full">
                <Group gap="xs">
                  <ThemeIcon size={24} radius="sm" variant="light" color="white" className="bg-white/20">
                    <Cpu size={14} className="text-white" />
                  </ThemeIcon>
                  <span>Your Build ({selectedParts}/{requiredCategories.length})</span>
                </Group>
                <span className="font-mono font-bold">{formatCurrency(totalPrice)}</span>
              </Group>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" hideClose className="h-[85vh] p-0 flex flex-col rounded-t-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]">
            <SheetHeader className="px-5 py-4 flex flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 text-left bg-slate-50/50 dark:bg-white/[0.02]">
              <Group gap="xs">
                <ThemeIcon size={28} radius="md" variant="light" color="cyan">
                  <Cpu size={16} />
                </ThemeIcon>
                <div>
                  <SheetTitle className="font-headline text-base font-bold text-slate-900 dark:text-slate-100">Your Build</SheetTitle>
                  <Text size="xs" c="dimmed">{selectedParts} of {requiredCategories.length} core parts selected</Text>
                </div>
              </Group>
              <Group gap="xs" align="center">
                {renderHeaderActions()}
                <SheetClose asChild>
                  <button type="button" aria-label="Close Your Build" className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
                </SheetClose>
              </Group>
            </SheetHeader>
            <ScrollArea className="flex-1 min-h-0">{renderContent()}</ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Save Build Modal */}
      <Modal
        opened={saveOpen}
        onClose={() => setSaveOpen(false)}
        size="md"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="cyan" variant="light" radius="md">
              <Bookmark size={20} />
            </ThemeIcon>
            <div>
              <Title order={4} className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Save Build Configuration
              </Title>
              <Text size="xs" c="dimmed">
                Save this configuration to quickly load or edit later.
              </Text>
            </div>
          </Group>
        }
        classNames={UNIFIED_MODAL_CLASSNAMES}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (saveName.trim()) void saveFavorite(saveName);
          }}
          className="space-y-4"
        >
          <TextInput
            label="Configuration Name"
            description="Give your setup a memorable name"
            placeholder="e.g. Creator Rig 2026, RTX 5070 Ti Beast"
            value={saveName}
            onChange={(e) => setSaveName(e.currentTarget.value)}
            required
            autoFocus
            radius="md"
            classNames={{
              input: "bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/15 focus:border-cyan-500",
              label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
              description: "text-[11px] text-slate-500 dark:text-slate-400 mb-2",
            }}
          />

          <Paper withBorder radius="md" p="sm" className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/10">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Selected Parts:</Text>
              <Text size="xs" fw={700} className="font-mono">{selectedParts} items</Text>
            </Group>
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">Total Value:</Text>
              <Text size="xs" fw={700} className="font-mono text-cyan-600 dark:text-cyan-400">{formatCurrency(totalPrice)}</Text>
            </Group>
          </Paper>

          <Group justify="flex-end" gap="sm" pt="xs">
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => setSaveOpen(false)}
              className="text-xs border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="cyan"
              size="sm"
              radius="md"
              loading={isSaving}
              disabled={!saveName.trim() || selectedParts === 0}
              className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm shadow-cyan-500/20"
            >
              Save Configuration
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Clear Build Modal */}
      <Modal
        opened={clearOpen}
        onClose={() => setClearOpen(false)}
        size="sm"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="red" variant="light" radius="md">
              <AlertCircle size={20} />
            </ThemeIcon>
            <div>
              <Title order={4} className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Clear All Parts?
              </Title>
              <Text size="xs" c="dimmed">
                Reset your current configuration.
              </Text>
            </div>
          </Group>
        }
        classNames={UNIFIED_MODAL_CLASSNAMES}
      >
        <div className="space-y-4">
          <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to remove all {selectedParts} selected components from your build? This action cannot be undone unless you have previously saved this configuration.
          </Text>

          <Group justify="flex-end" gap="sm" pt="xs">
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => setClearOpen(false)}
              className="text-xs border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              color="red"
              size="sm"
              radius="md"
              leftSection={<Trash2 size={15} />}
              onClick={handleConfirmClear}
              className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm shadow-rose-500/20"
            >
              Clear Build
            </Button>
          </Group>
        </div>
      </Modal>

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
