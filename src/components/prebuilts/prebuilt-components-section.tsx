"use client";

import { UseFormReturn } from "react-hook-form";
import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Paper, ThemeIcon } from "@mantine/core";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { PrebuiltPartSelector } from "./prebuilt-part-selector";
import type { Part } from "@/lib/types";
import type { CompatibilityResult } from "@/lib/compatibility";
import type { AddPrebuiltFormSchema } from "@/hooks/use-prebuilt-form";
import { INCLUDED_INTEGRATED_GPU_ID } from "@/lib/integrated-graphics";

interface RamFieldSlot {
  fieldIndex: number;
  isPlaceholder: boolean;
  part?: Part;
  sticks?: number;
  isEmpty: boolean;
  isBlocked: boolean;
}

interface PrebuiltComponentsSectionProps {
  form: UseFormReturn<AddPrebuiltFormSchema>;
  inventory: Record<string, Part[]>;
  gpuOptions: Part[];
  openSlot: string | null;
  setOpenSlot: (slot: string | null) => void;
  getCompatibilityForPart: (part: Part, currentValue?: string) => CompatibilityResult;
  ramSlots: number;
  nvmeSlots: number;
  totalStorageSlots: number;
  ramFields: RamFieldSlot[];
  flat?: boolean;
}

const CORE_SLOTS: {
  name: "cpu" | "motherboard" | "gpu" | "cooler" | "psu" | "case";
  label: string;
  selectorCategory: string;
  inventoryKey: string;
  badge: string;
  Icon: LucideIcon;
}[] = [
  { name: "cpu", label: "CPU", selectorCategory: "CPU", inventoryKey: "CPU", badge: "Core", Icon: Cpu },
  { name: "motherboard", label: "Motherboard", selectorCategory: "Motherboard", inventoryKey: "Motherboard", badge: "Base", Icon: CircuitBoard },
  { name: "gpu", label: "GPU", selectorCategory: "GPU", inventoryKey: "GPU", badge: "Graphics", Icon: Monitor },
  { name: "cooler", label: "Cooler", selectorCategory: "Cooler", inventoryKey: "Cooler", badge: "Thermal", Icon: Fan },
  { name: "psu", label: "Power Supply", selectorCategory: "PSU", inventoryKey: "PSU", badge: "Power", Icon: Zap },
  { name: "case", label: "Chassis / Case", selectorCategory: "Case", inventoryKey: "Case", badge: "Case", Icon: Box },
];

export function PrebuiltComponentsSection({
  form,
  inventory,
  gpuOptions,
  openSlot,
  setOpenSlot,
  getCompatibilityForPart,
  ramSlots,
  nvmeSlots,
  totalStorageSlots,
  ramFields,
  flat = false,
}: PrebuiltComponentsSectionProps) {
  const wrapSlot = (key: string, content: React.ReactNode, compact = false) =>
    flat ? (
      <div key={key} className={compact ? "space-y-2" : "space-y-3"}>
        {content}
      </div>
    ) : (
      <Paper
        key={key}
        withBorder
        radius="xl"
        p="md"
        className={cn(
          "bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm transition-all hover:border-cyan-500/30",
          compact ? "space-y-2.5" : "space-y-3"
        )}
      >
        {content}
      </Paper>
    );

  const renderHeader = (Icon: LucideIcon, label: string, badgeLabel: string) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ThemeIcon size={24} radius="md" variant="light" color="cyan">
          <Icon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        </ThemeIcon>
        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">
          {label}
        </FormLabel>
      </div>
      <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">
        {badgeLabel}
      </Badge>
    </div>
  );

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
        <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
        Component Selection
        <span className="text-slate-400 dark:text-slate-500 normal-case font-normal tracking-normal ml-1">
          (sorted A–Z · type to search)
        </span>
      </p>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", flat ? "gap-x-6 gap-y-5" : "gap-4")}>
        {CORE_SLOTS.map(({ name, label, selectorCategory, inventoryKey, badge, Icon }) =>
          wrapSlot(
            name,
            <FormField
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  {renderHeader(Icon, label, badge)}
                  <PrebuiltPartSelector
                    category={selectorCategory}
                    items={name === "gpu" ? gpuOptions : inventory[inventoryKey] || []}
                    value={field.value || ""}
                    onChange={field.onChange}
                    getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                    isOpen={openSlot === name}
                    onOpenChange={(o) => setOpenSlot(o ? name : null)}
                  />
                  {name === "gpu" && field.value === INCLUDED_INTEGRATED_GPU_ID && (
                    <button
                      type="button"
                      className="text-xs text-cyan-700 dark:text-cyan-300 underline"
                      onClick={() => {
                        form.setValue("cpu", "");
                        form.setValue("gpu", "");
                      }}
                    >
                      Remove included graphics and CPU
                    </button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />,
            true
          )
        )}
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 pt-6", flat ? "gap-8 mt-6 border-t border-slate-200 dark:border-white/10" : "gap-4")}>
        {wrapSlot(
          "ram-config",
          <>
            {renderHeader(MemoryStick, "RAM Configuration", `${ramSlots} Slots`)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ramFields.map((fieldData, visualIndex) => {
                if (fieldData.isBlocked) {
                  return (
                    <div
                      key={`ram-blocked-${visualIndex}`}
                      className="flex items-center justify-center h-10 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.02]"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Unavailable
                      </span>
                    </div>
                  );
                }
                if (fieldData.isPlaceholder) {
                  return (
                    <div
                      key={`ram-placeholder-${visualIndex}`}
                      className="flex items-center justify-center h-10 px-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 truncate">
                        Occupied ({fieldData.part?.name})
                      </span>
                    </div>
                  );
                }
                return (
                  <FormField
                    key={`ram-${fieldData.fieldIndex}`}
                    control={form.control}
                    name={`ram.${fieldData.fieldIndex}` as any}
                    render={({ field }) => (
                      <div className="relative group">
                        <PrebuiltPartSelector
                          category={`RAM Module ${fieldData.fieldIndex + 1}`}
                          items={inventory["RAM"] || []}
                          value={field.value || ""}
                          onChange={field.onChange}
                          getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                          isOpen={openSlot === `ram-${fieldData.fieldIndex}`}
                          onOpenChange={(o) => setOpenSlot(o ? `ram-${fieldData.fieldIndex}` : null)}
                        />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange("");
                              const current = form.getValues("ram");
                              const next = [...current];
                              next.splice(fieldData.fieldIndex, 1);
                              form.setValue("ram", next);
                            }}
                            className="absolute -right-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  />
                );
              })}
            </div>
          </>
        )}

        {wrapSlot(
          "storage-array",
          <>
            {renderHeader(HardDrive, "Storage Array", `${totalStorageSlots} Slots`)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: totalStorageSlots }).map((_, index) => {
                const isNvme = index < nvmeSlots;
                const slotLabel = isNvme
                  ? `NVMe M.2 Slot ${index + 1}`
                  : `SATA Slot ${index - nvmeSlots + 1}`;
                return (
                  <FormField
                    key={`storage-${index}`}
                    control={form.control}
                    name={`storage.${index}` as any}
                    render={({ field }) => (
                      <div className="relative group">
                        <PrebuiltPartSelector
                          category={slotLabel}
                          items={
                            inventory["Storage"]?.filter((s) => {
                              if (!s.specifications) return true;
                              const isPartNvme =
                                s.specifications["Type"]?.toString().toLowerCase().includes("nvme") ||
                                s.name.toLowerCase().includes("nvme");
                              return isNvme ? isPartNvme : !isPartNvme;
                            }) || []
                          }
                          value={field.value || ""}
                          onChange={field.onChange}
                          getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                          isOpen={openSlot === `storage-${index}`}
                          onOpenChange={(o) => setOpenSlot(o ? `storage-${index}` : null)}
                        />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="absolute -right-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
