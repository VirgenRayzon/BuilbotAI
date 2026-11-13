"use client";

import { Loader2 } from "lucide-react";
import { AiActionButton } from "@/components/ui/ai-action-button";
import { Button } from "@/components/ui/button";

interface CatalogEditorHeaderActionsProps {
  mode: "part" | "prebuilt";
  isInline: boolean;
  inlineFormId: string;
  isAiPending: boolean;
  isSubmitting: boolean;
  submitDisabled?: boolean;
  elapsedTime: number;
  aiDuration: number | null;
  tokensUsed: number | null;
  submitLabel: string;
  submittingLabel?: string;
  onTriggerAi: () => void;
  onCancelAi: () => void;
  onReset?: () => void;
  onResetPointerDown?: () => void;
  onSaveAndView?: () => void;
  onBeforeSubmit?: () => void;
}

/** Shared top-bar action strip pairing AI Autofill with inline form controls. */
export function CatalogEditorHeaderActions({
  mode,
  isInline,
  inlineFormId,
  isAiPending,
  isSubmitting,
  submitDisabled,
  elapsedTime,
  aiDuration,
  tokensUsed,
  submitLabel,
  submittingLabel = "Saving, please wait",
  onTriggerAi,
  onCancelAi,
  onReset,
  onResetPointerDown,
  onSaveAndView,
  onBeforeSubmit,
}: CatalogEditorHeaderActionsProps) {
  const isSaveDisabled = submitDisabled ?? (isSubmitting || isAiPending);

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
      <AiActionButton
        label="AI AUTOFILL"
        isPending={isAiPending}
        onTrigger={onTriggerAi}
        onCancel={onCancelAi}
        elapsedTime={elapsedTime}
        aiDuration={aiDuration}
        tokensUsed={tokensUsed}
        mode={mode}
        disabled={isSubmitting}
      />
      {isInline && (
        <>
          {onReset && (
            <Button
              type="button"
              variant="outline"
              onPointerDown={onResetPointerDown}
              onClick={onReset}
              disabled={isSubmitting || isAiPending}
              className="h-11 sm:h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Reset Form
            </Button>
          )}
          {onSaveAndView && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onBeforeSubmit?.();
                onSaveAndView();
              }}
              disabled={isSaveDisabled}
              className="h-11 sm:h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-xs border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10"
            >
              Save &amp; View in Inventory
            </Button>
          )}
          <Button
            type="submit"
            form={inlineFormId}
            onClick={onBeforeSubmit}
            disabled={isSaveDisabled}
            className="h-11 sm:h-9 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 transition-all duration-200"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </>
      )}
    </div>
  );
}

