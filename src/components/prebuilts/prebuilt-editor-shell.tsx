"use client";

import { useEffect, useId, useRef } from "react";
import { BrainCircuit, Cpu, Loader2 } from "lucide-react";
import { Badge, ThemeIcon } from "@mantine/core";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CatalogEditorHeaderActions } from "@/components/ui/catalog-editor-header-actions";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import {
  usePrebuiltForm,
  type AddPrebuiltFormSchema,
} from "@/hooks/use-prebuilt-form";
import { PrebuiltIdentitySection } from "./prebuilt-identity-section";
import { PrebuiltComponentsSection } from "./prebuilt-components-section";
import type { CreatedProduct } from "@/lib/product-identity";
import type { Part, PrebuiltSystem } from "@/lib/types";

interface PrebuiltEditorShellProps {
  variant: "dialog" | "inline";
  parts: Part[];
  initialData?: PrebuiltSystem;
  title?: string;
  open: boolean;
  onSave: (
    data: AddPrebuiltFormSchema,
    operationId?: string
  ) => Promise<CreatedProduct | void>;
  onCloseDialog?: () => void;
  onSaveAndView?: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export function PrebuiltEditorShell({
  variant,
  parts,
  initialData,
  title,
  open,
  onSave,
  onCloseDialog,
  onSaveAndView,
  onBusyChange,
}: PrebuiltEditorShellProps) {
  const isInline = variant === "inline";
  const inlineFormId = useId();
  const saveModeRef = useRef<"save" | "save-and-view">("save");
  const { toast } = useToast();

  const {
    form, inventory, gpuOptions, isSaving, isAiPending, aiDuration, tokensUsed,
    elapsedTime, justAutofilled,
    openSlot, setOpenSlot, ramSlots, nvmeSlots, totalStorageSlots, ramFields,
    getCompatibilityForPart, handleAiAssist, handleCancelAiAssist, resetFormState,
    executeSave, onFormError,
  } = usePrebuiltForm({ parts, initialData, open, onSave });

  useEffect(() => {
    onBusyChange?.(isSaving || isAiPending);
  }, [isSaving, isAiPending, onBusyChange]);

  const resolvedTitle =
    title || (initialData ? "Edit Prebuilt System" : "Add New Prebuilt System");
  const resolvedDescription = initialData
    ? "Refine system details, pricing, and component configuration."
    : "Configure new system inventory with AI-assisted identity generation.";

  const handleSubmit = async (values: AddPrebuiltFormSchema) => {
    const mode = saveModeRef.current;
    saveModeRef.current = "save";
    const result = await executeSave(values);
    if (!result) return;

    const { saved } = result;
    toast({
      title: initialData ? "Prebuilt Updated!" : "Prebuilt System Added!",
      description: `${values.name} has been ${initialData ? "updated" : "added"}.`,
      action:
        saved && mode === "save" ? (
          <ToastAction
            altText="View item"
            onClick={() => window.location.assign(saved.adminUrl)}
          >
            View item
          </ToastAction>
        ) : undefined,
    });

    if (!initialData) {
      resetFormState();
    }
    if (!isInline) {
      onCloseDialog?.();
    } else if (mode === "save-and-view") {
      onSaveAndView?.();
    }
  };

  const handleSaveAndView = () => {
    saveModeRef.current = "save-and-view";
    void form.handleSubmit(handleSubmit, onFormError)();
  };

  const headerContent = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <ThemeIcon size={44} radius="xl" variant="light" color="cyan" className="shadow-sm shrink-0">
          <Cpu className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </ThemeIcon>
        <div className="min-w-0">
          {isInline ? (
            <>
              <h1 className="text-lg sm:text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                {resolvedTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resolvedDescription}
              </p>
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                {resolvedTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resolvedDescription}
              </DialogDescription>
            </>
          )}
        </div>
      </div>

      <CatalogEditorHeaderActions
        mode="prebuilt"
        isInline={isInline}
        inlineFormId={inlineFormId}
        isAiPending={isAiPending}
        isSubmitting={isSaving}
        elapsedTime={elapsedTime}
        aiDuration={aiDuration}
        tokensUsed={tokensUsed}
        submitLabel={initialData ? "Update Prebuilt" : "Deploy System"}
        submittingLabel={initialData ? "Updating, please wait" : "Saving, please wait"}
        onTriggerAi={handleAiAssist}
        onCancelAi={handleCancelAiAssist}
        onReset={resetFormState}
        onResetPointerDown={() => setOpenSlot(null)}
        onSaveAndView={onSaveAndView ? handleSaveAndView : undefined}
      />
    </>
  );

  const formFields = (
    <div className={isInline ? "space-y-8" : "p-3 sm:p-4 space-y-6"}>
      <PrebuiltIdentitySection form={form} justAutofilled={justAutofilled} flat={isInline} />
      <PrebuiltComponentsSection
        form={form} inventory={inventory} gpuOptions={gpuOptions}
        openSlot={openSlot} setOpenSlot={setOpenSlot}
        getCompatibilityForPart={getCompatibilityForPart}
        ramSlots={ramSlots} nvmeSlots={nvmeSlots}
        totalStorageSlots={totalStorageSlots} ramFields={ramFields}
        flat={isInline}
      />
    </div>
  );

  const footerActions = (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onPointerDown={() => setOpenSlot(null)}
        onClick={() => {
          resetFormState();
          onCloseDialog?.();
        }}
        disabled={isSaving}
        className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
      >
        Cancel
      </Button>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
        <Button
          type="submit"
          disabled={isAiPending || isSaving}
          className="h-11 sm:h-10 px-7 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 transition-all duration-200"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving
            ? initialData
              ? "Updating, please wait"
              : "Saving, please wait"
            : initialData
              ? "Update Prebuilt"
              : "Deploy System"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={isInline ? "space-y-6" : undefined}>
      {isInline ? (
        <div className="pb-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          {headerContent}
        </div>
      ) : (
        <DialogHeader className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex flex-row items-center justify-between gap-3 space-y-0">
          {headerContent}
        </DialogHeader>
      )}

      {isAiPending && (
        <div className={isInline ? "relative overflow-hidden rounded-lg bg-cyan-500/10 border border-cyan-500/20" : "relative overflow-hidden bg-cyan-500/10 dark:bg-cyan-500/10 border-b border-cyan-500/20"}>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500/20">
            <div className="h-full bg-cyan-500 animate-progress-glow w-[35%]" />
          </div>
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ThemeIcon size={32} radius="lg" variant="light" color="cyan">
                <BrainCircuit className="h-4 w-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              </ThemeIcon>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                  Buildbot Intelligence Active
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Researching market tiers, pricing benchmarks, and system identities...
                </span>
              </div>
            </div>
            <Badge variant="filled" color="cyan" size="sm" className="font-mono font-bold animate-pulse shrink-0">
              Processing
            </Badge>
          </div>
        </div>
      )}

      <Form {...form}>
        <form
          id={isInline ? inlineFormId : undefined}
          onSubmit={form.handleSubmit(handleSubmit, onFormError)}
          className={isInline ? "flex flex-col space-y-8" : "flex flex-col"}
        >
          {isInline ? (
            formFields
          ) : (
            <ScrollArea className="h-[70vh]">{formFields}</ScrollArea>
          )}

          {!isInline && (
            <DialogFooter className="relative z-[60] p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#111722] flex-row justify-between items-center sm:justify-between">
              {footerActions}
            </DialogFooter>
          )}
        </form>
      </Form>
    </div>
  );
}
