"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PrebuiltEditorShell } from "./prebuilts/prebuilt-editor-shell";
import type { AddPrebuiltFormSchema } from "@/hooks/use-prebuilt-form";
import type { CreatedProduct } from "@/lib/product-identity";
import type { Part, PrebuiltSystem } from "@/lib/types";

export type { AddPrebuiltFormSchema };

interface AddPrebuiltDialogProps {
  children?: React.ReactNode;
  onSave: (
    data: AddPrebuiltFormSchema,
    operationId?: string
  ) => Promise<CreatedProduct | void>;
  parts: Part[];
  initialData?: PrebuiltSystem;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddPrebuiltDialog({
  children,
  onSave,
  parts,
  initialData,
  title,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddPrebuiltDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && isBusy) return;
    if (!isControlled) {
      setInternalOpen(isOpen);
    }
    controlledOnOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isBusy) event.preventDefault();
        }}
        className="w-[90vw] max-w-[90vw] max-h-[calc(100vh-24px)] p-0 gap-0 overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111722] shadow-lg rounded-xl [&>button.absolute]:hidden"
      >
        <PrebuiltEditorShell
          variant="dialog"
          parts={parts}
          initialData={initialData}
          title={title}
          open={open}
          onSave={onSave}
          onCloseDialog={() => handleOpenChange(false)}
          onBusyChange={setIsBusy}
        />
      </DialogContent>
    </Dialog>
  );
}
