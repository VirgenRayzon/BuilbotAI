"use client";

import { useState } from "react";
import { Button, Menu, Modal, Paper, TextInput } from "@mantine/core";
import { AlertTriangle, FolderOpen, Heart, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { ComponentData, FavoriteBuild } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const reviewCategories = ["Motherboard", "CPU", "GPU", "RAM", "Storage", "PSU", "Cooler", "Case", "Monitor", "Keyboard", "Mouse", "Headset"];

interface BuildActionFooterProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  totalPrice: number;
  selectedParts: number;
  missingCategories: string[];
  isManagerMode: boolean;
  isAiPending: boolean;
  isCheckingOut: boolean;
  isSaving: boolean;
  analysis?: unknown;
  favorites: FavoriteBuild[];
  onCategorySelect?: (category: string) => void;
  onAnalyze: () => void;
  onReserve: (onSuccess: () => void) => void;
  onAddPrebuilt: () => void;
  onSave: (name: string) => Promise<boolean>;
  onLoad: (favorite: FavoriteBuild) => void;
  onClear: () => void;
}

export function BuildActionFooter({
  build, totalPrice, selectedParts, missingCategories, isManagerMode,
  isAiPending, isCheckingOut, isSaving, analysis, favorites,
  onCategorySelect, onAnalyze, onReserve, onAddPrebuilt, onSave, onLoad, onClear,
}: BuildActionFooterProps) {
  const [reserveOpen, setReserveOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const complete = missingCategories.length === 0;

  const save = async () => {
    if (await onSave(saveName)) {
      setSaveOpen(false);
      setSaveName("");
    }
  };

  return (
    <div className="px-4 sm:px-5 pb-5 pt-2 space-y-3">
      {!complete && (
        <Paper withBorder radius="md" p="sm" className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" /> Incomplete build
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Complete these required parts before {isManagerMode ? "adding this prebuilt" : "analyzing or reserving"}:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missingCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onCategorySelect?.(category)}
                className="rounded-md border border-amber-300 dark:border-amber-500/35 bg-amber-100 dark:bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-500/25"
              >
                + {category}
              </button>
            ))}
          </div>
        </Paper>
      )}

      {isManagerMode ? (
        <Button fullWidth size="md" radius="md" leftSection={<Sparkles size={17} />} disabled={!complete || isAiPending} loading={isAiPending} onClick={onAddPrebuilt}>
          Add new prebuilt
        </Button>
      ) : (
        <>
          <Button fullWidth size="md" radius="md" color="teal" leftSection={<ShieldCheck size={18} />} disabled={!complete} onClick={() => setReserveOpen(true)}>
            Reserve build
          </Button>
          <Button fullWidth size="md" radius="md" variant="outline" color="cyan" leftSection={<Sparkles size={17} />} disabled={!complete} onClick={onAnalyze}>
            {analysis ? "Refresh analysis" : "Analyze build"}
          </Button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="light" color="gray" radius="md" leftSection={<Heart size={15} />} disabled={selectedParts === 0} onClick={() => setSaveOpen(true)}>
              Save
            </Button>
            <Menu width={250} position="bottom-end" withinPortal shadow="md">
              <Menu.Target>
                <Button variant="light" color="gray" radius="md" leftSection={<FolderOpen size={15} />} disabled={favorites.length === 0}>
                  Load ({favorites.length})
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Saved builds</Menu.Label>
                {favorites.map((favorite) => (
                  <Menu.Item key={favorite.id} onClick={() => onLoad(favorite)}>
                    <span className="block truncate text-sm font-semibold">{favorite.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{favorite.parts.length} parts · {formatCurrency(favorite.totalPrice)}</span>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </div>
        </>
      )}

      <Button fullWidth variant="subtle" color="red" size="xs" leftSection={<RotateCcw size={14} />} disabled={selectedParts === 0} onClick={() => setClearOpen(true)}>
        Clear build
      </Button>

      <Modal opened={clearOpen} onClose={() => setClearOpen(false)} title="Clear your build?" centered radius="lg" overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}>
        <p className="text-sm text-slate-600 dark:text-slate-300">This removes every selected part from your current build.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="default" onClick={() => setClearOpen(false)}>Cancel</Button>
          <Button color="red" onClick={() => { onClear(); setClearOpen(false); }}>Clear build</Button>
        </div>
      </Modal>

      {!isManagerMode && (
        <>
          <Modal opened={saveOpen} onClose={() => setSaveOpen(false)} title="Save build" centered radius="lg" overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}>
            <TextInput label="Build name" placeholder="My 4K build" value={saveName} onChange={(event) => setSaveName(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") void save(); }} radius="md" />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="default" onClick={() => setSaveOpen(false)}>Cancel</Button>
              <Button disabled={!saveName.trim()} loading={isSaving} onClick={() => void save()}>Save build</Button>
            </div>
          </Modal>

          <Modal opened={reserveOpen} onClose={() => setReserveOpen(false)} title="Confirm reservation" centered radius="lg" overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}>
            <p className="text-sm text-slate-600 dark:text-slate-300">Review your selected parts before reserving.</p>
            <div className="my-4 max-h-64 space-y-2 overflow-y-auto border-y border-slate-200 dark:border-white/10 py-3">
              {reviewCategories.flatMap((category) => {
                const value = build[category];
                const parts = Array.isArray(value) ? value : value ? [value] : [];
                return parts.map((part, index) => (
                  <div key={`${category}-${index}`} className="flex justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{category}: {part.model}</span>
                    <span className="shrink-0 font-semibold">{formatCurrency(part.price || 0)}</span>
                  </div>
                ));
              })}
            </div>
            <div className="flex justify-between font-bold"><span>Total value</span><span>{formatCurrency(totalPrice)}</span></div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="default" onClick={() => setReserveOpen(false)}>Cancel</Button>
              <Button color="teal" loading={isCheckingOut} onClick={() => onReserve(() => setReserveOpen(false))}>Confirm reservation</Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
