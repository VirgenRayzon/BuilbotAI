/**
 * usePartForm — Custom hook for AddPartDialog form state and AI autofill logic.
 * Manages Zod-validated form schema, spec value helpers, PSU dimension auto-fill,
 * and AI-driven specification pre-filling via Genkit flows.
 */
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getAiPartDetails } from "@/app/actions";
import { Part } from "@/lib/types";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";

const specificationSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const formSchema = z.object({
  partName: z.string().min(1, "Part name is required."),
  category: z.string().min(1, "Please select a category."),
  brand: z.string().min(1, "Brand is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  stockCount: z.coerce.number().int().min(0, "Stock must be a positive integer."),
  imageUrl: z.string().optional().or(z.literal("")),
  wattage: z.coerce.number().min(0).optional(),
  performanceScore: z.coerce.number().min(0).max(100).optional(),
  dimensions: z.object({
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
    depth: z.coerce.number().min(0),
  }).optional(),
  specifications: z.array(specificationSchema),
  description: z.string().optional(),
  packageType: z.enum(['TRAY', 'BOX']).optional().or(z.literal("")),
});

export type AddPartFormSchema = z.infer<typeof formSchema>;

interface UsePartFormProps {
  initialData?: Part;
  open: boolean;
  isAiKillSwitch: boolean;
}

export function usePartForm({ initialData, open, isAiKillSwitch }: UsePartFormProps) {
  const [isAiPending, startAiTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<AddPartFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partName: initialData?.name || "",
      category: initialData?.category || "",
      brand: initialData?.brand || "",
      price: initialData?.price || 0,
      stockCount: initialData?.stock || 0,
      imageUrl: initialData?.imageUrl || "",
      wattage: initialData?.wattage,
      performanceScore: initialData?.performanceScore || 50,
      dimensions: initialData?.dimensions || { width: 0, height: 0, depth: 0 },
      specifications: initialData?.specifications
        ? Object.entries(initialData.specifications).map(([key, value]) => ({ key, value: String(value) }))
        : [],
      description: initialData?.description || "",
      packageType: initialData?.packageType || "",
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        partName: initialData.name,
        category: initialData.category,
        brand: initialData.brand,
        price: initialData.price,
        stockCount: initialData.stock,
        imageUrl: initialData.imageUrl,
        wattage: initialData.wattage,
        performanceScore: initialData.performanceScore,
        dimensions: initialData.dimensions || { width: 0, height: 0, depth: 0 },
        specifications: Object.entries(initialData.specifications || {}).map(([key, value]) => ({ key, value: String(value) })),
        description: initialData.description || "",
        packageType: initialData.packageType || "",
      });
    } else if (open && !initialData) {
      form.reset({
        partName: "",
        category: "",
        brand: "",
        price: 0,
        stockCount: 0,
        imageUrl: "",
        wattage: undefined,
        performanceScore: 50,
        dimensions: { width: 0, height: 0, depth: 0 },
        specifications: [],
        description: "",
        packageType: "",
      });
    }
  }, [open, initialData, form]);

  const selectedCategory = form.watch("category");

  const setSpecValue = (key: string, value: string) => {
    const current = form.getValues("specifications");
    const idx = current.findIndex((s) => s.key === key);
    let updated = [...current];

    if (value === "") {
      updated = current.filter((s) => s.key !== key);
    } else if (idx >= 0) {
      updated[idx] = { key, value };
    } else {
      updated.push({ key, value });
    }

    if (selectedCategory === "PSU" && key === "Form Factor") {
      const val = value.toLowerCase();
      if (val === "atx") {
        updated = updateOrAddSpec(updated, "Width (mm)", "150 mm");
        updated = updateOrAddSpec(updated, "Depth (mm)", "140 mm");
        updated = updateOrAddSpec(updated, "Height (mm)", "86 mm");
        form.setValue("dimensions", { width: 150, depth: 140, height: 86 });
      } else if (val === "sfx") {
        updated = updateOrAddSpec(updated, "Width (mm)", "125 mm");
        updated = updateOrAddSpec(updated, "Depth (mm)", "100 mm");
        updated = updateOrAddSpec(updated, "Height (mm)", "64 mm");
        form.setValue("dimensions", { width: 125, depth: 100, height: 64 });
      }
    }

    form.setValue("specifications", updated);
  };

  const updateOrAddSpec = (specs: { key: string; value: string }[], key: string, value: string) => {
    const existingIdx = specs.findIndex((s) => s.key === key);
    if (existingIdx >= 0) {
      const copy = [...specs];
      copy[existingIdx] = { key, value };
      return copy;
    }
    return [...specs, { key, value }];
  };

  const handleGetAiDetails = () => {
    if (isAiKillSwitch) {
      toast({
        title: "AI Disabled",
        description: "AI is disable by Administrator.",
        variant: "destructive"
      });
      return;
    }

    const partName = form.getValues("partName");
    if (!partName) {
      form.setError("partName", { message: "Please enter a part name first." });
      return;
    }
    startAiTransition(async () => {
      const result = (await getAiPartDetails({ partName })) as any;
      if (result && !("error" in result)) {
        form.setValue("partName", result.partName, { shouldValidate: true });
        form.setValue("category", result.category, { shouldValidate: true });
        form.setValue("brand", result.brand, { shouldValidate: true });
        if (result.packageType) {
          form.setValue("packageType", result.packageType, { shouldValidate: true });
        }
        if (result.description && !form.getValues("description")) {
          form.setValue("description", result.description, { shouldValidate: true });
        }
        form.setValue("price", result.price, { shouldValidate: true });
        form.setValue("wattage", result.wattage, { shouldValidate: true });
        form.setValue(
          "performanceScore",
          result.performanceScore || (result.performanceTier ? result.performanceTier * 10 : 50),
          { shouldValidate: true }
        );
        form.setValue("dimensions", result.dimensions || { width: 0, height: 0, depth: 0 }, {
          shouldValidate: true,
        });

        const finalSpecs = [...(form.getValues("specifications") || [])];
        const updateSpec = (k: string, v: any) => {
          if (v === undefined || v === null || v === "") return;
          let valStr = String(v);

          if (k === "Form Factor" && (result.category === "Motherboard" || result.category === "PSU")) {
            const lower = valStr.toLowerCase();
            if (lower.includes("eatx") || lower.includes("e-atx")) valStr = "eatx";
            else if (lower.includes("matx") || lower.includes("m-atx") || lower.includes("micro")) valStr = "matx";
            else if (lower.includes("itx") || lower.includes("mini")) valStr = "itx";
            else if (lower.includes("atx")) valStr = "atx";
          } else if (result.category === "Case") {
            const lower = valStr.toLowerCase();
            if (k === "Type") {
              if (lower.includes("full")) valStr = "full tower";
              else if (lower.includes("mid")) valStr = "mid tower";
              else if (lower.includes("mini")) valStr = "mini tower";
              else if (lower.includes("sff") || lower.includes("small")) valStr = "sff";
            } else if (k === "Back-Connect Cutout") {
              valStr = lower.includes("yes") ? "yes" : "no";
            } else if (k === "Mobo Support") {
              valStr = valStr.split(",").map(s => s.trim().toLowerCase()).filter(s => ["eatx", "atx", "matx", "itx"].includes(s)).join(",");
            } else if (k === "Radiator Support (mm)") {
              valStr = valStr.split(",").map(s => s.trim()).filter(s => ["120", "140", "240", "280", "360", "480"].includes(s)).join(",");
            } else if (k === "Slot Thickness") {
              const num = valStr.match(/\d+/)?.[0];
              if (num) valStr = `${num} Slot`;
            }
          } else if (result.category === "Storage" && k === "Type") {
            const lower = valStr.toLowerCase();
            if (lower.includes("nvme")) valStr = "NVME";
            else if (lower.includes("sata")) valStr = "SATA";
          }

          const i = finalSpecs.findIndex((s) => s.key === k);
          if (i >= 0) finalSpecs[i] = { key: k, value: valStr };
          else finalSpecs.push({ key: k, value: valStr });
        };

        if (result.specifications?.length > 0) {
          result.specifications.forEach((aiSpec: { key: string; value: string }) => {
            updateSpec(aiSpec.key, aiSpec.value);
          });
        }

        if (result.wattage) {
          if (result.category === "CPU") updateSpec("TDP / Peak Power", `${result.wattage} W`);
          else if (result.category === "GPU") updateSpec("TGP / Power Draw (W)", `${result.wattage} W`);
          else if (result.category === "PSU") updateSpec("Wattage (W)", `${result.wattage} W`);
          else if (result.category === "Cooler") updateSpec("TDP Rating", `${result.wattage} W`);
        }

        if (result.dimensions) {
          if (result.category === "GPU") updateSpec("Length (Depth) (mm)", `${result.dimensions.depth} mm`);
          else if (result.category === "Case") {
            updateSpec("Width (mm)", `${result.dimensions.width} mm`);
            updateSpec("Depth (mm)", `${result.dimensions.depth} mm`);
            updateSpec("Height (mm)", `${result.dimensions.height} mm`);
            updateSpec("Max GPU Length", `${result.dimensions.depth} mm`);
          }
        }

        form.setValue("specifications", finalSpecs, { shouldValidate: true });
      } else {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: (result as any)?.error || "Could not fetch details for this part.",
        });
      }
    });
  };

  return {
    form,
    isAiPending,
    handleGetAiDetails,
    setSpecValue,
    selectedCategory,
  };
}
