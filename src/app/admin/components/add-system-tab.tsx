"use client";

import React from "react";
import { PrebuiltEditorShell } from "@/components/prebuilts/prebuilt-editor-shell";
import type { AddPrebuiltFormSchema } from "@/hooks/use-prebuilt-form";
import type { CreatedProduct } from "@/lib/product-identity";
import type { Part } from "@/lib/types";

interface AddSystemTabProps {
  parts: Part[];
  onAddPrebuilt: (
    data: AddPrebuiltFormSchema,
    operationId?: string
  ) => Promise<CreatedProduct | void>;
  onViewPrebuilts: () => void;
}

export function AddSystemTab({
  parts,
  onAddPrebuilt,
  onViewPrebuilts,
}: AddSystemTabProps) {
  return (
    <div className="mt-2">
      <PrebuiltEditorShell
        variant="inline"
        parts={parts}
        open={true}
        onSave={onAddPrebuilt}
        onSaveAndView={onViewPrebuilts}
      />
    </div>
  );
}
