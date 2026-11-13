"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MousePointer2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useProductSaveOperation } from "@/hooks/use-product-save-operation";
import { useFirestore, useDoc } from "@/firebase";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import type { CreatedProduct } from "@/lib/product-identity";
import type { ComponentData, Part, PrebuiltSystem } from "@/lib/types";
import {
  checkCompatibility,
  checkFullBuildCompatibility,
  type CompatibilityResult,
} from "@/lib/compatibility";
import {
  INCLUDED_INTEGRATED_GPU_ID,
  createIntegratedGpuPart,
} from "@/lib/integrated-graphics";

export const prebuiltFormSchema = z.object({
  name: z.string().min(1, "System name is required."),
  tier: z.string().min(1, "Please select a tier."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  imageUrl: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),
  cpu: z.string().min(1, "CPU is required."),
  gpu: z.string().min(1, "GPU is required."),
  motherboard: z.string().min(1, "Motherboard is required."),
  ram: z
    .array(z.string().optional().or(z.literal("")))
    .refine((items) => items.filter(Boolean).length > 0, {
      message: "At least one RAM module is required.",
    }),
  storage: z
    .array(z.string().optional().or(z.literal("")))
    .refine((items) => items.filter(Boolean).length > 0, {
      message: "At least one storage drive is required.",
    }),
  psu: z.string().min(1, "PSU is required."),
  case: z.string().min(1, "Case is required."),
  cooler: z.string().min(1, "Cooler is required."),
});

export type AddPrebuiltFormSchema = z.infer<typeof prebuiltFormSchema>;

export function getMissingAiAssistComponents(values: AddPrebuiltFormSchema): string[] {
  const missing: string[] = [];
  if (!values.cpu) missing.push("CPU");
  if (!values.motherboard) missing.push("motherboard");
  if (!values.gpu) missing.push("GPU");
  if (!values.cooler) missing.push("cooler");
  if (!values.psu) missing.push("power supply");
  if (!values.case) missing.push("case");
  if (!(values.ram || []).some(Boolean)) missing.push("RAM");
  if (!(values.storage || []).some(Boolean)) missing.push("storage");
  return missing;
}

export function getSelectedPartIds(values: AddPrebuiltFormSchema): string[] {
  return [
    values.cpu,
    values.gpu,
    values.motherboard,
    ...(values.ram || []),
    ...(values.storage || []),
    values.psu,
    values.case,
    values.cooler,
  ].filter((id): id is string => Boolean(id));
}

function getDefaultValues(initialData?: PrebuiltSystem): AddPrebuiltFormSchema {
  if (!initialData) {
    return {
      name: "",
      tier: "",
      description: "",
      price: 0,
      imageUrl: "",
      images: [],
      cpu: "",
      gpu: "",
      motherboard: "",
      ram: [],
      storage: [],
      psu: "",
      case: "",
      cooler: "",
    };
  }
  return {
    name: initialData.name,
    tier: initialData.tier,
    description: initialData.description || "",
    price: Math.round((initialData.price || 0) * 100) / 100,
    imageUrl: initialData.imageUrl || "",
    images: initialData.images || (initialData.imageUrl ? [initialData.imageUrl] : []),
    cpu: initialData.components.cpu || "",
    gpu: initialData.components.gpu || "",
    motherboard: initialData.components.motherboard || "",
    ram: initialData.components.ram || [],
    storage: initialData.components.storage || [],
    psu: initialData.components.psu || "",
    case: initialData.components.case || "",
    cooler: initialData.components.cooler || "",
  };
}

interface UsePrebuiltFormOptions {
  parts: Part[];
  initialData?: PrebuiltSystem;
  open: boolean;
  onSave: (
    data: AddPrebuiltFormSchema,
    operationId?: string
  ) => Promise<CreatedProduct | void>;
}

export function usePrebuiltForm({
  parts,
  initialData,
  open,
  onSave,
}: UsePrebuiltFormOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAiPending, setIsAiPending] = useState(false);
  const [aiDuration, setAiDuration] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [justAutofilled, setJustAutofilled] = useState(false);
  const aiAbortRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { getOperation, resetOperation } = useProductSaveOperation();

  const firestore = useFirestore();
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, "siteSettings", "main");
    return null;
  }, [firestore]);
  const { data: settings } = useDoc<any>(settingsDocRef);
  const isAiKillSwitch = settings?.isAiKillSwitch || false;

  const inventory = useMemo(() => {
    const grouped: Record<string, Part[]> = {};
    for (const part of parts || []) {
      if (!grouped[part.category]) grouped[part.category] = [];
      grouped[part.category].push(part);
    }
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }, [parts]);

  const form = useForm<AddPrebuiltFormSchema>({
    resolver: zodResolver(prebuiltFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  const componentValues = form.watch();
  const selectedCpu = parts.find(
    (part) => part.category === "CPU" && part.id === componentValues.cpu
  );
  const includedGpu = selectedCpu ? createIntegratedGpuPart(selectedCpu) : null;
  const gpuOptions = includedGpu
    ? [includedGpu, ...(inventory.GPU || [])]
    : inventory.GPU || [];

  useEffect(() => {
    if (!open) return;
    if (
      includedGpu &&
      (!componentValues.gpu || componentValues.gpu === INCLUDED_INTEGRATED_GPU_ID)
    ) {
      if (componentValues.gpu !== INCLUDED_INTEGRATED_GPU_ID) {
        form.setValue("gpu", INCLUDED_INTEGRATED_GPU_ID);
      }
    } else if (!includedGpu && componentValues.gpu === INCLUDED_INTEGRATED_GPU_ID) {
      form.setValue("gpu", "");
    }
  }, [open, includedGpu?.name, componentValues.gpu, form]);

  const missingAiAssistComponents = getMissingAiAssistComponents(componentValues);
  const isComponentSelectionComplete = missingAiAssistComponents.length === 0;

  const selectedPartsPrice = useMemo(() => {
    const total = getSelectedPartIds(componentValues).reduce((sum, id) => {
      return sum + (parts.find((part) => part.id === id)?.price || 0);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [componentValues, parts]);

  const toComponentData = useCallback((part: Part): ComponentData => ({
    id: part.id,
    model: part.name,
    description: part.description || "",
    price: part.price,
    image: part.imageUrl,
    images: part.images,
    imageHint: part.name.toLowerCase().split(" ").slice(0, 2).join(" "),
    icon: MousePointer2,
    wattage: part.wattage,
    socket:
      part.specifications?.["Socket"]?.toString() ||
      part.specifications?.["socket"]?.toString() ||
      part.socket,
    ramType:
      part.specifications?.["Memory Type"]?.toString() ||
      part.specifications?.["RAM Type"]?.toString() ||
      part.ramType,
    performanceScore: part.performanceScore,
    performanceTier: part.performanceTier,
    specifications: part.specifications,
    dimensions: part.dimensions,
  }), []);

  const buildFromValues = useCallback(
    (values: AddPrebuiltFormSchema) => {
      const findSelected = (category: string, id?: string) => {
        if (!id) return null;
        const owner =
          category === "GPU" && id === INCLUDED_INTEGRATED_GPU_ID
            ? parts.find(
                (candidate) => candidate.category === "CPU" && candidate.id === values.cpu
              )
            : undefined;
        const part =
          category === "GPU" && id === INCLUDED_INTEGRATED_GPU_ID
            ? owner
              ? createIntegratedGpuPart(owner)
              : null
            : inventory[category]?.find((candidate) => candidate.id === id);
        return part ? toComponentData(part) : null;
      };

      return {
        CPU: findSelected("CPU", values.cpu),
        GPU: findSelected("GPU", values.gpu),
        Motherboard: findSelected("Motherboard", values.motherboard),
        RAM: (values.ram || [])
          .map((id) => findSelected("RAM", id))
          .filter((part): part is ComponentData => Boolean(part)),
        Storage: (values.storage || [])
          .map((id) => findSelected("Storage", id))
          .filter((part): part is ComponentData => Boolean(part)),
        PSU: findSelected("PSU", values.psu),
        Case: findSelected("Case", values.case),
        Cooler: findSelected("Cooler", values.cooler),
      } satisfies Record<string, ComponentData | ComponentData[] | null>;
    },
    [inventory, parts, toComponentData]
  );

  const compatibilityBuild: Record<string, ComponentData | ComponentData[] | null> =
    useMemo(() => buildFromValues(componentValues), [componentValues, buildFromValues]);

  const getCompatibilityForPart = (
    part: Part,
    currentValue = ""
  ): CompatibilityResult => {
    const build = { ...compatibilityBuild };
    if (part.category === "RAM" || part.category === "Storage") {
      const selected = [...((build[part.category] as ComponentData[]) || [])];
      const currentIndex = selected.findIndex((c) => c.id === currentValue);
      if (currentIndex >= 0) selected.splice(currentIndex, 1);
      build[part.category] = selected;
    } else {
      build[part.category] = null;
    }
    return checkCompatibility(part, build);
  };

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(initialData));
  }, [open, initialData, form]);

  useEffect(() => {
    if (!open || form.getValues("price") === selectedPartsPrice) return;
    form.setValue("price", selectedPartsPrice, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, open, selectedPartsPrice]);

  const rawRamWatch = form.watch("ram");
  useEffect(() => {
    const rawRamIds = form.getValues("ram") || [];
    const ramIds = rawRamIds.filter(Boolean);
    if (rawRamIds.length !== ramIds.length) {
      form.setValue("ram", ramIds);
    }
  }, [rawRamWatch, form]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAiPending) {
      setElapsedTime(0);
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAiPending]);

  const handleAiAssist = async () => {
    if (isAiKillSwitch) {
      toast({
        title: "AI Disabled",
        description: "AI is disable by Administrator.",
        variant: "destructive",
      });
      return;
    }
    const missingComponents = getMissingAiAssistComponents(form.getValues());
    if (missingComponents.length > 0) {
      toast({
        variant: "destructive",
        title: "Complete Component Selection",
        description: `Select a ${missingComponents.join(", ")} before using AI Assist.`,
      });
      return;
    }
    const getPartName = (id?: string) => {
      if (!id || id.trim() === "") return undefined;
      const targetId = id.trim();
      const part =
        targetId === INCLUDED_INTEGRATED_GPU_ID
          ? includedGpu
          : parts.find((p) => p.id === targetId);
      return part?.name || undefined;
    };
    const vals = form.getValues();
    const selectedComponents = {
      cpu: getPartName(vals.cpu),
      gpu: getPartName(vals.gpu),
      motherboard: getPartName(vals.motherboard),
      ram: (vals.ram || []).map(getPartName).filter((n): n is string => !!n),
      storage: (vals.storage || []).map(getPartName).filter((n): n is string => !!n),
      psu: getPartName(vals.psu),
      case: getPartName(vals.case),
      cooler: getPartName(vals.cooler),
    };
    const selectedIds = getSelectedPartIds(vals);
    const inventoryPrice = selectedIds.reduce(
      (total, id) => total + (parts.find((part) => part.id === id)?.price || 0),
      0
    );
    const productHighlights = selectedIds
      .map((id) =>
        id === INCLUDED_INTEGRATED_GPU_ID
          ? includedGpu
          : parts.find((part) => part.id === id)
      )
      .filter((part): part is Part => Boolean(part))
      .map((part) => {
        const maxChars = ["CPU", "GPU", "Motherboard"].includes(part.category) ? 900 : 280;
        const highlights = part.description?.trim().slice(0, maxChars);
        return highlights
          ? `${part.category} — ${part.name}:\n${highlights}`
          : `${part.category} — ${part.name}`;
      })
      .join("\n\n");

    setIsAiPending(true);
    aiAbortRef.current = false;
    setAiDuration(null);
    setTokensUsed(null);
    const startTime = performance.now();

    try {
      const result = await getAiPrebuiltSuggestions({
        components: {
          ...selectedComponents,
          ram: selectedComponents.ram.join(", "),
          storage: selectedComponents.storage.join(", "),
        },
        tier: vals.tier || undefined,
        inventoryPrice: inventoryPrice || undefined,
        productHighlights: productHighlights || undefined,
      });
      if (aiAbortRef.current) return;
      setAiDuration((performance.now() - startTime) / 1000);
      if (result) setTokensUsed(Math.round(JSON.stringify(result).length / 4));
      if (result && "description" in result && result.description) {
        form.setValue("description", result.description, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setJustAutofilled(true);
        setTimeout(() => setJustAutofilled(false), 2500);
        toast({
          title: "AI Suggestions Applied",
          description: "Successfully filled: Description.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "AI Response Error",
          description:
            (result as any)?.error ||
            "The AI returned an empty response. Please try again.",
        });
      }
    } catch (err: any) {
      if (!aiAbortRef.current) {
        toast({
          variant: "destructive",
          title: "AI Assist Failed",
          description:
            err.message || "An unexpected error occurred while communicating with the AI.",
        });
      }
    } finally {
      setIsAiPending(false);
    }
  };

  const handleCancelAiAssist = () => {
    aiAbortRef.current = true;
    setIsAiPending(false);
    setAiDuration(null);
    toast({
      title: "AI Assist Cancelled",
      description: "The AI suggestion generation has been aborted.",
    });
  };

  const resetFormState = () => {
    setOpenSlot(null);
    setAiDuration(null);
    setTokensUsed(null);
    form.reset(getDefaultValues(initialData));
    resetOperation();
  };

  const executeSave = async (
    values: AddPrebuiltFormSchema
  ): Promise<{ saved: CreatedProduct | void } | null> => {
    if (isSaving) return null;
    if (values.gpu === INCLUDED_INTEGRATED_GPU_ID && !includedGpu) {
      toast({
        variant: "destructive",
        title: "Integrated graphics unavailable",
        description: "Select a CPU with integrated graphics or choose a graphics card.",
      });
      return null;
    }
    const compatibilityIssues = checkFullBuildCompatibility(buildFromValues(values));
    const blockingIssue = compatibilityIssues.find(
      (issue) => issue.severity === "critical"
    );
    if (blockingIssue) {
      toast({
        variant: "destructive",
        title: "Compatibility Error",
        description: blockingIssue.message,
      });
      return null;
    }

    setIsSaving(true);
    try {
      const mobo = inventory["Motherboard"]?.find((m) => m.id === values.motherboard);
      const rSlots = mobo ? parseInt(mobo.specifications?.["Memory Slots"]?.toString() || "4") : 4;
      const nSlots = mobo ? parseInt(mobo.specifications?.["NVMe Slots"]?.toString() || "1") : 1;
      const sSlots = mobo ? parseInt(mobo.specifications?.["SATA Slots"]?.toString() || "2") : 1;

      let currentSticks = 0;
      const validRam: string[] = [];
      for (const rId of values.ram) {
        if (!rId) continue;
        const part = inventory["RAM"]?.find((r) => r.id === rId);
        const sticks = part ? parseInt(part.specifications?.["Stick Count"]?.toString() || "1") : 1;
        if (currentSticks + sticks <= rSlots) {
          validRam.push(rId);
          currentSticks += sticks;
        } else {
          break;
        }
      }
      values.ram = validRam;
      values.storage = values.storage.slice(0, nSlots + sSlots).filter(Boolean);

      const saved = await onSave(values, getOperation(values));
      return { saved };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "An unexpected error occurred while saving.",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const onFormError = (errors: any) => {
    const getErrorMessage = (err: any): string | null => {
      if (!err) return null;
      if (err.message) return err.message;
      if (Array.isArray(err)) return getErrorMessage(err.find(Boolean));
      if (typeof err === "object") {
        const firstKey = Object.keys(err)[0];
        return getErrorMessage(err[firstKey]);
      }
      return "Invalid field";
    };
    const errorMsg = getErrorMessage(errors);
    if (errorMsg) {
      toast({ variant: "destructive", title: "Validation Error", description: errorMsg });
    }
  };

  const selectedMoboId = form.watch("motherboard");
  const selectedMobo = inventory["Motherboard"]?.find((m) => m.id === selectedMoboId);
  const ramSlots = selectedMobo
    ? parseInt(selectedMobo.specifications?.["Memory Slots"]?.toString() || "4")
    : 4;
  const nvmeSlots = selectedMobo
    ? parseInt(selectedMobo.specifications?.["NVMe Slots"]?.toString() || "1")
    : 1;
  const sataSlots = selectedMobo
    ? parseInt(selectedMobo.specifications?.["SATA Slots"]?.toString() || "2")
    : 1;
  const totalStorageSlots = nvmeSlots + sataSlots;

  const ramIds = (form.watch("ram") || []).filter(Boolean);
  const ramFields: {
    fieldIndex: number;
    isPlaceholder: boolean;
    part?: Part;
    sticks?: number;
    isEmpty: boolean;
    isBlocked: boolean;
  }[] = [];
  let currentSticks = 0;
  for (let i = 0; i < ramIds.length; i++) {
    const id = ramIds[i];
    const part = inventory["RAM"]?.find((r) => r.id === id);
    const sticks = part ? parseInt(part.specifications?.["Stick Count"]?.toString() || "1") : 1;
    if (currentSticks + sticks <= ramSlots) {
      ramFields.push({ fieldIndex: i, isPlaceholder: false, part, sticks, isEmpty: false, isBlocked: false });
      currentSticks += sticks;
      for (let s = 1; s < sticks; s++) {
        ramFields.push({ fieldIndex: i, isPlaceholder: true, part, sticks, isEmpty: false, isBlocked: false });
      }
    }
  }
  if (currentSticks < ramSlots) {
    ramFields.push({ fieldIndex: ramIds.length, isPlaceholder: false, isEmpty: true, isBlocked: false });
    currentSticks++;
  }
  while (currentSticks < ramSlots) {
    ramFields.push({ fieldIndex: -1, isPlaceholder: true, isEmpty: false, isBlocked: true });
    currentSticks++;
  }

  return {
    form,
    inventory,
    gpuOptions,
    isSaving,
    isAiPending,
    aiDuration,
    tokensUsed,
    elapsedTime,
    justAutofilled,
    isAiKillSwitch,
    isComponentSelectionComplete,
    openSlot,
    setOpenSlot,
    ramSlots,
    nvmeSlots,
    totalStorageSlots,
    ramFields,
    getCompatibilityForPart,
    handleAiAssist,
    handleCancelAiAssist,
    resetFormState,
    executeSave,
    onFormError,
  };
}
