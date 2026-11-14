"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComponentData } from "@/lib/types";
import {
  buildLayoutViewModel,
  type BuildLayoutViewModel,
  type CoreLayoutCategory,
  type LayoutCategory,
  type LayoutPartSummary,
} from "@/lib/build-layout-specs";

export interface UseBuildLayoutResult {
  viewModel: BuildLayoutViewModel;
  hoveredCategory: CoreLayoutCategory | null;
  setHoveredCategory: (category: CoreLayoutCategory | null) => void;
  activeSummary: LayoutPartSummary | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleSelectCategory: (category: LayoutCategory) => void;
}

export function useBuildLayout(
  build: Record<string, ComponentData | ComponentData[] | null>,
  onCategorySelect?: (category: string) => void
): UseBuildLayoutResult {
  const [hoveredCategory, setHoveredCategory] = useState<CoreLayoutCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const viewModel = useMemo(() => buildLayoutViewModel(build), [build]);

  const activeSummary = useMemo<LayoutPartSummary | null>(() => {
    if (!hoveredCategory) return null;
    return viewModel.partSummaries[hoveredCategory] ?? null;
  }, [hoveredCategory, viewModel.partSummaries]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleSelectCategory = useCallback(
    (category: LayoutCategory) => {
      onCategorySelect?.(category);
    },
    [onCategorySelect]
  );

  return {
    viewModel,
    hoveredCategory,
    setHoveredCategory,
    activeSummary,
    isModalOpen,
    openModal,
    closeModal,
    handleSelectCategory,
  };
}
