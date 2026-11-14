"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import type {
  BuildLayoutViewModel,
  CaseFormFactorTier,
  CoreLayoutCategory,
  LayoutPartSummary,
} from "@/lib/build-layout-specs";
import {
  CpuAndCoolerShapes,
  MotherboardShape,
  getRadiatorVisualDims,
  getStrokePalette,
} from "./layout-part-shapes";
import {
  GpuAndPsuShapes,
  RamAndStorageShapes,
} from "./layout-secondary-shapes";

interface PcLayoutCanvasProps {
  viewModel: BuildLayoutViewModel;
  hoveredCategory: CoreLayoutCategory | null;
  onHoverCategory: (category: CoreLayoutCategory | null) => void;
  onSelectCategory: (category: CoreLayoutCategory) => void;
  activeSummary: LayoutPartSummary | null;
  expanded?: boolean;
}

const MM_SCALE = 0.72;

const CASE_VISUAL_SIZES: Record<
  CaseFormFactorTier,
  { w: number; h: number; shroudH: number }
> = {
  "full-tower": { w: 332, h: 376, shroudH: 64 },
  "mid-tower": { w: 288, h: 336, shroudH: 60 },
  "mini-tower": { w: 250, h: 294, shroudH: 56 },
  sff: { w: 250, h: 194, shroudH: 0 },
};

const UNSELECTED_CASE_VISUAL_SIZE = { w: 264, h: 312, shroudH: 56 };

const MOBO_TOWER_VISUAL_SIZES: Record<
  "eatx" | "atx" | "matx" | "itx",
  { w: number; h: number }
> = {
  eatx: { w: 190, h: 208 },
  atx: { w: 168, h: 208 },
  matx: { w: 168, h: 168 },
  itx: { w: 118, h: 118 },
};

export function PcLayoutCanvas({
  viewModel,
  hoveredCategory,
  onHoverCategory,
  onSelectCategory,
  activeSummary,
  expanded = false,
}: PcLayoutCanvasProps) {
  const gridPatternId = useId();
  const { caseSpec, moboSpec, categoryStatus } = viewModel;
  const caseHovered = hoveredCategory === "Case";
  const isItxCase = caseSpec.formFactorTier === "sff";

  const casePalette = getStrokePalette(
    caseSpec.selected,
    categoryStatus.Case.status,
    caseHovered,
    "#06b6d4",
    "rgba(6, 182, 212, 0.04)"
  );

  // 4 Distinct Fixed Case Visualizer Sizes when selected + baseline unselected size
  const caseVisual = caseSpec.selected
    ? CASE_VISUAL_SIZES[caseSpec.formFactorTier]
    : UNSELECTED_CASE_VISUAL_SIZE;
  const caseW = caseVisual.w;
  const caseH = caseVisual.h;
  const caseX = Math.round((440 - caseW) / 2);
  const caseY = Math.round((404 - caseH) / 2) + 8;

  const shroudHeight = caseVisual.shroudH;
  const shroudTopY = caseY + caseH - shroudHeight;
  const maxInteriorGpuWidthPx = caseW - (isItxCase ? 18 : 38);

  // 4 Distinct Fixed Motherboard Visualizer Sizes (E-ATX, ATX, mATX, Mini-ITX)
  const towerMoboSize = MOBO_TOWER_VISUAL_SIZES[moboSpec.formFactorTier];
  const moboX = caseX + 10;
  const moboY = isItxCase ? caseY + 26 : caseY + 22;
  const moboW = isItxCase
    ? moboSpec.formFactorTier === "itx"
      ? 138
      : towerMoboSize.w
    : towerMoboSize.w;
  const moboH = isItxCase
    ? moboSpec.formFactorTier === "itx"
      ? 158
      : towerMoboSize.h
    : towerMoboSize.h;

  // PCIe / GPU Coordinates
  const pciSlotPitch = 14;
  const gpuX = caseX + 6;
  const gpuY = isItxCase
    ? moboY + moboH - 36
    : moboSpec.formFactorTier === "itx"
      ? moboY + 92
      : moboSpec.formFactorTier === "matx"
        ? moboY + 122
        : moboY + 142;

  // CPU Socket / Cooler, DIMM, M.2, Radiator & PSU coordinates
  const socketCenterX = isItxCase
    ? moboX + Math.round(moboW * 0.42)
    : moboX + Math.min(58, Math.round(moboW * 0.36));
  const socketCenterY = isItxCase ? moboY + 46 : moboY + 50;
  const dimmStartX = isItxCase
    ? moboX + moboW - 24
    : socketCenterX + 42;
  const dimmStartY = isItxCase ? moboY + 14 : moboY + 16;
  const radZoneX = caseX + 8;
  const radZoneY = caseY + 6;

  const m2StartX = moboX + 10;
  const m2StartY = isItxCase ? moboY + 82 : socketCenterY + 40;

  // ITX Case: PSU is vertical on top-right; Standard Tower: PSU is horizontal in bottom compartment
  const psuX = isItxCase ? caseX + caseW - 78 : caseX + 12;
  const psuY = isItxCase ? caseY + 8 : shroudTopY + 11;

  const sataBayX = caseX + caseW - 84;
  const sataBayY = shroudTopY + 16;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border transition-colors",
        "border-slate-200 bg-slate-900 text-slate-200",
        "dark:border-white/10 dark:bg-[#0b0f17] dark:text-slate-200",
        expanded ? "p-3 sm:p-4" : "p-2"
      )}
    >
      <svg
        viewBox="0 0 440 426"
        role="img"
        aria-label="2D form-factor PC layout schematic"
        className={cn(
          "w-full h-auto select-none",
          expanded ? "max-h-[660px]" : "max-h-[490px]"
        )}
      >
        <defs>
          <pattern
            id={gridPatternId}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.45"
              opacity="0.12"
            />
          </pattern>
        </defs>

        {/* Blueprint Grid */}
        <rect
          x="0"
          y="0"
          width="440"
          height="426"
          fill={`url(#${gridPatternId})`}
        />

        {/* Case Outer Perimeter */}
        <g
          role="button"
          tabIndex={0}
          aria-label={`Case: ${caseSpec.name} (${caseSpec.formFactorLabel})`}
          className="cursor-pointer focus:outline-none"
          onMouseEnter={() => onHoverCategory("Case")}
          onMouseLeave={() => onHoverCategory(null)}
          onClick={() => onSelectCategory("Case")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory("Case");
            }
          }}
        >
          <rect
            x={caseX}
            y={caseY}
            width={caseW}
            height={caseH}
            rx={isItxCase ? 3 : 6}
            fill="rgba(15, 23, 42, 0.78)"
            stroke={casePalette.stroke}
            strokeWidth={caseHovered ? 2.6 : 2}
            strokeDasharray={casePalette.dash}
            style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />

          <text
            x={caseX + 4}
            y={caseY - 6}
            fontSize={8.5}
            fontWeight={800}
            fill={caseSpec.selected || caseHovered ? "#38bdf8" : "#94a3b8"}
            className="font-mono uppercase"
          >
            {caseSpec.selected ? caseSpec.name : "SELECT PC CASE"}
          </text>
          <text
            x={caseX + caseW - 4}
            y={caseY - 6}
            textAnchor="end"
            fontSize={8.5}
            fontWeight={800}
            fill={caseSpec.selected || caseHovered ? "#cbd5e1" : "#94a3b8"}
            className="font-mono uppercase"
          >
            {caseSpec.formFactorLabel}
          </text>

          {/* Tower Case: Bottom PSU Chamber Divider & Right Vertical Radiator (only when AIO is selected) */}
          {!isItxCase && (
            <>
              <line
                x1={caseX}
                y1={shroudTopY}
                x2={caseX + caseW}
                y2={shroudTopY}
                stroke={casePalette.stroke}
                strokeWidth={1.8}
                strokeDasharray={casePalette.dash}
              />
              {viewModel.coolerSpec.selected &&
                viewModel.coolerSpec.mode === "aio" && (() => {
                  const radMm =
                    viewModel.coolerSpec.radiatorMm ?? caseSpec.maxRadiatorMm;
                  const rightRad = getRadiatorVisualDims(radMm, false);
                  return (
                    <rect
                      x={caseX + caseW - 8 - rightRad.thicknessPx}
                      y={caseY + 18}
                      width={rightRad.thicknessPx}
                      height={rightRad.lengthPx}
                      rx={3}
                      fill="rgba(168, 85, 247, 0.22)"
                      stroke="#a855f7"
                      strokeWidth={1.7}
                      style={{
                        transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  );
                })()}
            </>
          )}
        </g>

        {/* Motherboard */}
        <MotherboardShape
          vm={viewModel}
          moboX={moboX}
          moboY={moboY}
          moboW={moboW}
          moboH={moboH}
          isItxCase={isItxCase}
          hoveredCategory={hoveredCategory}
          onHover={onHoverCategory}
          onSelect={onSelectCategory}
        />

        {/* RAM + Storage */}
        <RamAndStorageShapes
          vm={viewModel}
          dimmStartX={dimmStartX}
          dimmStartY={dimmStartY}
          m2StartX={m2StartX}
          m2StartY={m2StartY}
          sataBayX={sataBayX}
          sataBayY={sataBayY}
          isItxCase={isItxCase}
          mmScale={MM_SCALE}
          hoveredCategory={hoveredCategory}
          onHover={onHoverCategory}
          onSelect={onSelectCategory}
        />

        {/* GPU + PSU */}
        <GpuAndPsuShapes
          vm={viewModel}
          gpuX={gpuX}
          gpuY={gpuY}
          maxInteriorGpuWidthPx={maxInteriorGpuWidthPx}
          pciSlotPitch={pciSlotPitch}
          psuX={psuX}
          psuY={psuY}
          isItxCase={isItxCase}
          mmScale={MM_SCALE}
          hoveredCategory={hoveredCategory}
          onHover={onHoverCategory}
          onSelect={onSelectCategory}
        />

        {/* CPU + Cooler */}
        <CpuAndCoolerShapes
          vm={viewModel}
          socketCenterX={socketCenterX}
          socketCenterY={socketCenterY}
          radZoneX={radZoneX}
          radZoneY={radZoneY}
          isItxCase={isItxCase}
          mmScale={MM_SCALE}
          hoveredCategory={hoveredCategory}
          onHover={onHoverCategory}
          onSelect={onSelectCategory}
        />

        {/* Subtle Bottom Inline HUD inside SVG when hovering a component */}
        {activeSummary && (
          <g>
            <rect
              x={12}
              y={402}
              width={416}
              height={20}
              rx={4}
              fill="rgba(15, 23, 42, 0.90)"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth={1}
            />
            <text
              x={20}
              y={415}
              fontSize={8.5}
              fontWeight={700}
              fill="#38bdf8"
              className="font-mono"
            >
              {activeSummary.category.toUpperCase()}: {activeSummary.name}
            </text>
            <text
              x={420}
              y={415}
              textAnchor="end"
              fontSize={8}
              fontWeight={700}
              fill="#e2e8f0"
              className="font-mono"
            >
              {activeSummary.tierBadge}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
