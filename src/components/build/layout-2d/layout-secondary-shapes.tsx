"use client";

import React from "react";
import type { BuildLayoutViewModel } from "@/lib/build-layout-specs";
import { getStrokePalette, type ShapeInteractionProps } from "./layout-part-shapes";

interface RamAndStorageShapeProps extends ShapeInteractionProps {
  vm: BuildLayoutViewModel;
  dimmStartX: number;
  dimmStartY: number;
  m2StartX: number;
  m2StartY: number;
  sataBayX: number;
  sataBayY: number;
  mmScale: number;
  isItxCase: boolean;
}

export function RamAndStorageShapes({
  vm,
  dimmStartX,
  dimmStartY,
  m2StartX,
  m2StartY,
  sataBayX,
  sataBayY,
  mmScale,
  isItxCase,
  hoveredCategory,
  onHover,
  onSelect,
}: RamAndStorageShapeProps) {
  const { ramSpec, moboSpec, storageSpec, categoryStatus } = vm;
  const ramHovered = hoveredCategory === "RAM";
  const storageHovered = hoveredCategory === "Storage";

  const ramPalette = getStrokePalette(
    ramSpec.selected,
    categoryStatus.RAM.status,
    ramHovered,
    "#22d3ee",
    "rgba(34, 211, 238, 0.22)"
  );
  const storagePalette = getStrokePalette(
    storageSpec.selected,
    categoryStatus.Storage.status,
    storageHovered,
    "#a78bfa",
    "rgba(167, 139, 250, 0.22)"
  );

  const slotCount = Math.min(4, Math.max(2, moboSpec.dimmSlots));
  const maxVisibleM2 =
    isItxCase || moboSpec.formFactorTier === "itx"
      ? 2
      : moboSpec.formFactorTier === "matx"
        ? 2
        : 3;
  const m2SlotCount = Math.min(maxVisibleM2, Math.max(1, moboSpec.nvmeSlots));

  // Enlarged DIMM module dimensions
  const stickHeightPx = Math.round(
    ramSpec.stickLengthMm * mmScale * (isItxCase ? 0.44 : 0.5)
  );
  const dimmPitch = isItxCase ? 9.5 : 10.5;
  const populatedWidth = isItxCase ? 7 : 7.8;
  const emptyWidth = isItxCase ? 5.8 : 6.4;

  return (
    <>
      {/* RAM DIMM Bank */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`RAM: ${ramSpec.totalSticks}/${moboSpec.dimmSlots} sticks (${ramSpec.generationLabel})`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("RAM")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("RAM");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("RAM");
          }
        }}
      >
        <rect
          x={dimmStartX - 3}
          y={dimmStartY - 3}
          width={slotCount * dimmPitch + 6}
          height={stickHeightPx + 6}
          rx={3}
          fill="transparent"
        />
        {Array.from({ length: slotCount }, (_, idx) => {
          const isPopulated = ramSpec.populatedSlots.includes(idx);
          const x = dimmStartX + idx * dimmPitch;
          return (
            <rect
              key={idx}
              x={x}
              y={isPopulated ? dimmStartY : dimmStartY + 3}
              width={isPopulated ? populatedWidth : emptyWidth}
              height={isPopulated ? stickHeightPx : stickHeightPx - 6}
              rx={2}
              fill={isPopulated ? ramPalette.stroke : "rgba(148, 163, 184, 0.06)"}
              fillOpacity={isPopulated ? 0.9 : 1}
              stroke={
                isPopulated
                  ? ramPalette.stroke
                  : ramHovered
                    ? "#22d3ee"
                    : "rgba(148, 163, 184, 0.46)"
              }
              strokeWidth={ramHovered ? 1.6 : 1.2}
              strokeDasharray={isPopulated ? undefined : "3 2"}
              style={{ transition: "all 240ms ease" }}
            />
          );
        })}
        <text
          x={dimmStartX + (slotCount * dimmPitch) / 2 - 1}
          y={dimmStartY + stickHeightPx + 11}
          textAnchor="middle"
          fontSize={7.8}
          fontWeight={800}
          fill={ramSpec.selected || ramHovered ? "#38bdf8" : "#94a3b8"}
          className="font-mono select-none"
        >
          {ramSpec.selected ? `${ramSpec.totalSticks}×${ramSpec.generationLabel}` : "DIMM"}
        </text>
      </g>

      {/* Storage: Enlarged M.2 NVMe Slots + SATA Bay */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`Storage: ${storageSpec.m2Drives.length} M.2, ${storageSpec.sataDrives.length} SATA`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("Storage")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Storage");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("Storage");
          }
        }}
      >
        {Array.from({ length: m2SlotCount }, (_, idx) => {
          const drive = storageSpec.m2Drives[idx];
          const slotH = 13;
          const rowGap = 15.5;
          const y = m2StartY + idx * rowGap;
          const slotW = drive
            ? Math.round(drive.lengthMm * mmScale * 1.05)
            : Math.round(80 * mmScale * 1.05);
          return (
            <g key={idx}>
              <rect
                x={m2StartX}
                y={y}
                width={slotW}
                height={slotH}
                rx={2.5}
                fill={drive ? storagePalette.fill : "rgba(148, 163, 184, 0.05)"}
                stroke={
                  drive
                    ? storagePalette.stroke
                    : storageHovered
                      ? "#a78bfa"
                      : "rgba(148, 163, 184, 0.46)"
                }
                strokeWidth={storageHovered ? 1.6 : 1.2}
                strokeDasharray={drive ? undefined : "3 2"}
                style={{ transition: "all 240ms ease" }}
              />
              <circle
                cx={m2StartX + slotW - 5}
                cy={y + slotH / 2}
                r={1.6}
                fill={drive ? storagePalette.stroke : "rgba(148, 163, 184, 0.5)"}
              />
              <text
                x={m2StartX + 5}
                y={y + 9}
                fontSize={7.2}
                fontWeight={800}
                fill={drive ? "#ddd6fe" : "#94a3b8"}
                className="font-mono select-none"
              >
                {drive ? `${drive.capacity || "M.2"} (${drive.lengthMm}mm)` : `M.2_${idx + 1}`}
              </text>
            </g>
          );
        })}

        {storageSpec.sataDrives.length > 0 &&
          storageSpec.sataDrives.slice(0, 2).map((drive, idx) => {
            const w = Math.round(drive.lengthMm * mmScale * 0.46);
            const h = Math.round(drive.widthMm * mmScale * 0.28);
            const y = sataBayY + idx * (h + 3);
            return (
              <g key={drive.id}>
                <rect
                  x={sataBayX}
                  y={y}
                  width={w}
                  height={h}
                  rx={3}
                  fill={storagePalette.fill}
                  stroke={storagePalette.stroke}
                  strokeWidth={storageHovered ? 1.6 : 1.2}
                />
                <text
                  x={sataBayX + w / 2}
                  y={y + h / 2 + 2.5}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={700}
                  fill="#ddd6fe"
                  className="font-mono select-none"
                >
                  {drive.sizeTier}&quot; SATA
                </text>
              </g>
            );
          })}
      </g>
    </>
  );
}

interface GpuAndPsuShapeProps extends ShapeInteractionProps {
  vm: BuildLayoutViewModel;
  gpuX: number;
  gpuY: number;
  maxInteriorGpuWidthPx: number;
  pciSlotPitch: number;
  psuX: number;
  psuY: number;
  isItxCase: boolean;
  mmScale: number;
}

export function GpuAndPsuShapes({
  vm,
  gpuX,
  gpuY,
  maxInteriorGpuWidthPx,
  pciSlotPitch,
  psuX,
  psuY,
  isItxCase,
  mmScale,
  hoveredCategory,
  onHover,
  onSelect,
}: GpuAndPsuShapeProps) {
  const { gpuSpec, psuSpec, caseSpec, categoryStatus } = vm;
  const gpuHovered = hoveredCategory === "GPU";
  const psuHovered = hoveredCategory === "PSU";

  const gpuPalette = getStrokePalette(
    gpuSpec.selected,
    categoryStatus.GPU.status,
    gpuHovered,
    "#eab308",
    "rgba(234, 179, 8, 0.20)"
  );
  const psuPalette = getStrokePalette(
    psuSpec.selected,
    categoryStatus.PSU.status,
    psuHovered,
    "#f97316",
    "rgba(249, 115, 22, 0.22)"
  );

  // GPU Horizontal Bar: Max clearance always fits inside the case; selected GPU scales with lengthMm
  const gpuScaleFactor = isItxCase ? 0.78 : 0.85;
  const maxGpuWidthPx = Math.min(
    maxInteriorGpuWidthPx,
    Math.round(caseSpec.maxGpuMm * mmScale * gpuScaleFactor)
  );
  const rawSelectedGpuWidthPx = Math.round(
    gpuSpec.lengthMm * mmScale * gpuScaleFactor
  );
  const actualGpuWidthPx =
    gpuSpec.selected && !gpuSpec.isIntegrated
      ? gpuSpec.lengthMm <= caseSpec.maxGpuMm
        ? Math.min(maxGpuWidthPx, rawSelectedGpuWidthPx)
        : maxGpuWidthPx +
          Math.min(26, Math.round((gpuSpec.lengthMm - caseSpec.maxGpuMm) * 0.45))
      : maxGpuWidthPx;
  const actualGpuHeightPx =
    gpuSpec.selected && !gpuSpec.isIntegrated
      ? Math.max(26, Math.round(gpuSpec.slotThickness * pciSlotPitch))
      : Math.round(2.1 * pciSlotPitch);

  // PSU Dimensions:
  // ITX Case: Vertical rectangle on top-right; Standard Tower: Horizontal rectangle in bottom PSU compartment
  const maxPsuW = isItxCase ? 66 : Math.round(caseSpec.maxPsuDepthMm * mmScale * 0.72);
  const maxPsuH = isItxCase ? Math.round(caseSpec.maxPsuDepthMm * mmScale * 1.05) : 38;

  const actualPsuW = isItxCase
    ? psuSpec.sizeTier === "atx"
      ? 70
      : 66
    : Math.round(psuSpec.depthMm * mmScale * 0.72);
  const actualPsuH = isItxCase
    ? Math.round(psuSpec.depthMm * mmScale * 1.05)
    : psuSpec.sizeTier === "atx"
      ? 38
      : 30;
  const psuBoxY = isItxCase ? psuY : psuY + (maxPsuH - actualPsuH);

  const gpuTextFill =
    gpuSpec.selected && !gpuSpec.isIntegrated
      ? "#fef9c3"
      : gpuHovered
        ? "#facc15"
        : "#94a3b8";
  const psuTextFill = psuSpec.selected
    ? "#ffedd5"
    : psuHovered
      ? "#fb923c"
      : "#94a3b8";

  return (
    <>
      {/* GPU Bar (Yellow when selected, Gray dashed when empty) */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`GPU: ${gpuSpec.name} (${gpuSpec.sizeLabel})`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("GPU")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("GPU");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("GPU");
          }
        }}
      >
        <rect
          x={gpuX}
          y={gpuY}
          width={gpuSpec.selected && !gpuSpec.isIntegrated ? actualGpuWidthPx : maxGpuWidthPx}
          height={actualGpuHeightPx}
          rx={3}
          fill={gpuPalette.fill}
          stroke={gpuPalette.stroke}
          strokeWidth={gpuHovered ? 2.3 : 1.7}
          strokeDasharray={gpuPalette.dash}
          style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text
          x={
            gpuX +
            (gpuSpec.selected && !gpuSpec.isIntegrated
              ? actualGpuWidthPx / 2
              : maxGpuWidthPx / 2)
          }
          y={gpuY + actualGpuHeightPx / 2 + 3.5}
          textAnchor="middle"
          fontSize={8.5}
          fontWeight={800}
          fill={gpuTextFill}
          className="font-mono select-none"
        >
          {gpuSpec.selected
            ? gpuSpec.isIntegrated
              ? "GPU (iGPU Active)"
              : `GPU ${gpuSpec.lengthMm}mm (${gpuSpec.slotThickness} Slot)`
            : `GPU (Max: ${caseSpec.maxGpuMm}mm)`}
        </text>
      </g>

      {/* PSU Block (Orange when selected, Gray dashed when empty) */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`PSU: ${psuSpec.name} (${psuSpec.formFactorLabel} ${psuSpec.depthMm}mm)`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("PSU")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("PSU");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("PSU");
          }
        }}
      >
        <rect
          x={psuX}
          y={psuSpec.selected ? psuBoxY : psuY}
          width={psuSpec.selected ? actualPsuW : maxPsuW}
          height={psuSpec.selected ? actualPsuH : maxPsuH}
          rx={3}
          fill={psuPalette.fill}
          stroke={psuPalette.stroke}
          strokeWidth={psuHovered ? 2.3 : 1.7}
          strokeDasharray={psuPalette.dash}
          style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text
          x={psuX + (psuSpec.selected ? actualPsuW / 2 : maxPsuW / 2)}
          y={(psuSpec.selected ? psuBoxY + actualPsuH / 2 : psuY + maxPsuH / 2) - 2}
          textAnchor="middle"
          fontSize={7.8}
          fontWeight={800}
          fill={psuTextFill}
          className="font-mono select-none"
        >
          {psuSpec.selected ? `${psuSpec.formFactorLabel} PSU` : `PSU (${caseSpec.psuSupportLabel})`}
        </text>
        <text
          x={psuX + (psuSpec.selected ? actualPsuW / 2 : maxPsuW / 2)}
          y={(psuSpec.selected ? psuBoxY + actualPsuH / 2 : psuY + maxPsuH / 2) + 8}
          textAnchor="middle"
          fontSize={6.6}
          fontWeight={700}
          fill={psuTextFill}
          opacity={0.88}
          className="font-mono select-none"
        >
          {psuSpec.selected
            ? `${psuSpec.depthMm}mm • ${psuSpec.wattageLabel}`
            : `Max: ${caseSpec.maxPsuDepthMm}mm`}
        </text>
      </g>
    </>
  );
}
