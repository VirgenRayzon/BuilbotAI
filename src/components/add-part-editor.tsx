"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { usePartForm, AddPartFormSchema } from "@/hooks/use-part-form";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";
import { PartEditorForm } from "./parts/part-editor-form";
import type { Part } from "@/lib/types";
import { normalizeProductDescription } from "@/lib/normalize-product-description";
import { useProductSaveOperation } from "@/hooks/use-product-save-operation";
import type { CreatedProduct } from "@/lib/product-identity";
import { ToastAction } from "./ui/toast";
import { InventorySaveSuccessDialog } from "./inventory-save-success-dialog";
import { findDuplicateCatalogName } from "@/lib/catalog-name-validation";

export interface AddPartEditorProps {
  children?: React.ReactNode;
  onSave: (data: AddPartFormSchema, operationId?: string) => Promise<CreatedProduct | void>;
  onSaveAndView?: () => void;
  initialData?: Part;
  title?: string;
  initiallyOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  existingPartNames?: readonly string[];
  variant?: "dialog" | "inline";
}

export function AddPartEditor({
  children,
  onSave,
  onSaveAndView,
  initialData,
  title,
  initiallyOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  existingPartNames = [],
  variant = "dialog",
}: AddPartEditorProps) {
  const isInline = variant === "inline";
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(initiallyOpen);
  const open = isInline ? true : isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (isOpen: boolean) => {
    if (isInline) return;
    if (!isOpen && (isAiPending || isSubmitting)) return;
    if (!isControlled) {
      setInternalOpen(isOpen);
    }
    controlledOnOpenChange?.(isOpen);
  };

  const { getOperation, resetOperation } = useProductSaveOperation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [justAutofilled, setJustAutofilled] = useState(false);
  const [savedPart, setSavedPart] = useState<{ name: string; seconds: number; url?: string } | null>(null);
  const saveStartRef = useRef<number | null>(null);
  const saveModeRef = useRef<"save" | "save-and-view">("save");
  const startTimeRef = useRef<number>(0);
  const prevPendingRef = useRef(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, "siteSettings", "main");
    return null;
  }, [firestore]);
  const { data: settings } = useDoc<any>(settingsDocRef);
  const isAiKillSwitch = settings?.isAiKillSwitch || false;

  const {
    form,
    isAiPending,
    aiDuration,
    tokensUsed,
    aiComponentWarning,
    handleGetAiDetails,
    handleCancelAiDetails,
    setSpecValue,
    resetPartForm,
  } = usePartForm({ initialData, open, isAiKillSwitch });

  const watchedPartName = form.watch("partName");
  const duplicatePartName = useMemo(
    () => findDuplicateCatalogName(watchedPartName, existingPartNames, initialData?.name),
    [existingPartNames, initialData?.name, watchedPartName]
  );

  const handleCategoryChange = (newCategory: string) => {
    form.setValue("category", newCategory, { shouldValidate: true });
    const categoryKeys = (CATEGORY_SPECS[newCategory] || []).map((s) => s.key);
    const current = form.getValues("specifications");
    form.setValue("specifications", current.filter((s) => categoryKeys.includes(s.key)));
  };

  const onSubmit = async (values: AddPartFormSchema) => {
    if (isSubmitting) return;
    const mode = saveModeRef.current;
    saveModeRef.current = "save";
    const saveStartedAt = saveStartRef.current ?? performance.now();
    setIsSubmitting(true);
    try {
      const normalizedValues = {
        ...values,
        description: normalizeProductDescription(values.description),
      };
      form.setValue("description", normalizedValues.description);
      const saved = await onSave(normalizedValues, getOperation(normalizedValues));
      const seconds = (performance.now() - saveStartedAt) / 1000;
      if (initialData) {
        toast({
          title: "Part Updated!",
          description: `${values.partName} has been updated in the inventory.`,
          action: saved ? <ToastAction altText="View item" onClick={() => window.location.assign(saved.adminUrl)}>View item</ToastAction> : undefined,
        });
      } else if (mode === "save-and-view") {
        toast({
          title: "Part Added!",
          description: `${values.partName} has been added to the inventory.`,
        });
      } else {
        setSavedPart({ name: values.partName, seconds, url: saved?.adminUrl });
      }
      if (!initialData) {
        resetPartForm();
      }
      if (!isInline) {
        if (!isControlled) setInternalOpen(false);
        controlledOnOpenChange?.(false);
      }
      resetOperation();
      if (mode === "save-and-view") {
        onSaveAndView?.();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: initialData ? "Error updating part" : "Error adding part",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      saveStartRef.current = null;
      setIsSubmitting(false);
    }
  };

  const handleSaveAndView = () => {
    saveModeRef.current = "save-and-view";
    void form.handleSubmit(onSubmit)();
  };

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

  useEffect(() => {
    if (prevPendingRef.current && !isAiPending && aiDuration !== null) {
      setJustAutofilled(true);
      const timer = setTimeout(() => setJustAutofilled(false), 2500);
      return () => clearTimeout(timer);
    }
    prevPendingRef.current = isAiPending;
  }, [isAiPending, aiDuration]);

  const editorBody = (
    <PartEditorForm
      variant={variant}
      form={form}
      initialData={initialData}
      title={title}
      isAiPending={isAiPending}
      isSubmitting={isSubmitting}
      elapsedTime={elapsedTime}
      aiDuration={aiDuration}
      tokensUsed={tokensUsed}
      aiComponentWarning={aiComponentWarning}
      justAutofilled={justAutofilled}
      duplicatePartName={duplicatePartName}
      onCategoryChange={handleCategoryChange}
      setSpecValue={setSpecValue}
      onGetAiDetails={handleGetAiDetails}
      onCancelAiDetails={handleCancelAiDetails}
      onSubmit={onSubmit}
      onSubmitAndView={onSaveAndView ? handleSaveAndView : undefined}
      onReset={() => {
        resetPartForm();
        resetOperation();
      }}
      onStartSave={() => {
        saveStartRef.current = performance.now();
      }}
    />
  );

  return (
    <>
      {isInline ? (
        editorBody
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          {children && <DialogTrigger asChild>{children}</DialogTrigger>}
          <DialogContent
            onEscapeKeyDown={(event) => {
              if (isSubmitting) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (isSubmitting) event.preventDefault();
            }}
            className="w-[90vw] max-w-[90vw] max-h-[calc(100vh-24px)] p-0 gap-0 overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111722] shadow-lg rounded-xl [&>button.absolute]:hidden"
          >
            {editorBody}
          </DialogContent>
        </Dialog>
      )}
      {savedPart && (
        <InventorySaveSuccessDialog
          itemType="component"
          name={savedPart.name}
          seconds={savedPart.seconds}
          url={savedPart.url}
          onClose={() => setSavedPart(null)}
        />
      )}
    </>
  );
}
