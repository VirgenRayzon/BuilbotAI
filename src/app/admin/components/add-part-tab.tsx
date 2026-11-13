"use client";

import React, { useMemo } from "react";
import { AddPartEditor } from "@/components/add-part-editor";
import type { AddPartFormSchema } from "@/hooks/use-part-form";
import type { CreatedProduct } from "@/lib/product-identity";
import type { Part } from "@/lib/types";

interface AddPartTabProps {
  parts: Part[];
  onAddPart: (
    data: AddPartFormSchema,
    operationId?: string
  ) => Promise<CreatedProduct | void>;
  onViewInventory: () => void;
}

export function AddPartTab({
  parts,
  onAddPart,
  onViewInventory,
}: AddPartTabProps) {
  const existingPartNames = useMemo(
    () => parts.map((part) => part.name),
    [parts]
  );

  return (
    <div className="mt-2">
      <AddPartEditor
        variant="inline"
        onSave={onAddPart}
        onSaveAndView={onViewInventory}
        existingPartNames={existingPartNames}
      />
    </div>
  );
}

