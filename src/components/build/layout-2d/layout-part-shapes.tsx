"use client";

import React from "react";
import type {
  BuildLayoutViewModel,
  CategoryHealthStatus,
  CoreLayoutCategory,
} from "@/lib/build-layout-specs";

export interface ShapeInteractionProps {
  hoveredCategory: CoreLayoutCategory | null;
  onHover: (category: CoreLayoutCategory | null) => void;
  onSelect: (category: CoreLayoutCategory) => void;
}

export function getRadiatorVisualDims(
  radMm: number,
  isItxCase: boolean
): { lengthPx: number; thicknessPx: number } {
  const pxPerMm = isItxCase ? 0.58 : 2 / 3;
  const lengthPx = Math.round(radMm * pxPerMm);
  const thicknessPx = radMm === 280 || radMm === 420 ? 24 : 21;
  return { lengthPx, thicknessPx };
}

export function getStrokePalette(
  selected: boolean,
  status: CategoryHealthStatus,
  isHovered: boolean,
  accentStroke: string,
  accentFill: string
) {
  if (status === "critical") {
    return {
      stroke: "#f43f5e",
      fill: isHovered ? "rgba(244, 63, 94, 0.28)" : "rgba(244, 63, 94, 0.18)",
      dash: selected ? undefined : "4 3",
    };
  }
  if (status === "warning") {
    return {
      stroke: "#f59e0b",
      fill: isHovered ? "rgba(245, 158, 11, 0.26)" : "rgba(245, 158, 11, 0.16)",
      dash: selected ? undefined : "4 3",
    };
  }
  if (!selected) {
    return {
      stroke: isHovered ? accentStroke : "rgba(148, 163, 184, 0.48)",
      fill: isHovered ? accentFill : "rgba(148, 163, 184, 0.04)",
      dash: "4 3",
    };
  }
  return {
    stroke: accentStroke,
    fill: isHovered ? accentFill.replace("0.18", "0.28").replace("0.22", "0.32") : accentFill,
    dash: undefined,
  };
}

interface MotherboardShapeProps extends ShapeInteractionProps {
  vm: BuildLayoutViewModel;
  moboX: number;
  moboY: number;
  moboW: number;
  moboH: number;
  isItxCase: boolean;
}

export function MotherboardShape({
  vm,
  moboX,
  moboY,
  moboW,
  moboH,
  isItxCase,
  hoveredCategory,
  onHover,
  onSelect,
}: MotherboardShapeProps) {
  const { moboSpec, categoryStatus } = vm;
  const isHovered = hoveredCategory === "Motherboard";
  const palette = getStrokePalette(
    moboSpec.selected,
    categoryStatus.Motherboard.status,
    isHovered,
    "#3b82f6",
    "rgba(59, 130, 246, 0.16)"
  );

  const labelY = isItxCase ? moboY + moboH - 48 : moboY + moboH - 10;
  const textFill = moboSpec.selected || isHovered ? "#60a5fa" : "#94a3b8";

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Motherboard: ${moboSpec.name} (${moboSpec.formFactorLabel} ${moboSpec.heightMm}×${moboSpec.widthMm}mm)`}
      className="cursor-pointer focus:outline-none"
      onMouseEnter={() => onHover("Motherboard")}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Motherboard");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect("Motherboard");
        }
      }}
    >
      <rect
        x={moboX}
        y={moboY}
        width={moboW}
        height={moboH}
        rx={4}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={isHovered ? 2.4 : 1.9}
        strokeDasharray={palette.dash}
        style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />

      <text
        x={moboX + 10}
        y={labelY}
        fontSize={10}
        fontWeight={800}
        fill={textFill}
        className="font-mono uppercase select-none"
      >
        {moboSpec.selected ? moboSpec.formFactorLabel : "Motherboard"}
      </text>
      <text
        x={moboX + moboW - 8}
        y={labelY}
        textAnchor="end"
        fontSize={7.5}
        fontWeight={700}
        fill={textFill}
        opacity={0.85}
        className="font-mono select-none"
      >
        {moboSpec.heightMm}×{moboSpec.widthMm}mm
      </text>
    </g>
  );
}

interface CpuAndCoolerShapeProps extends ShapeInteractionProps {
  vm: BuildLayoutViewModel;
  socketCenterX: number;
  socketCenterY: number;
  radZoneX: number;
  radZoneY: number;
  mmScale: number;
  isItxCase: boolean;
}

export function CpuAndCoolerShapes({
  vm,
  socketCenterX,
  socketCenterY,
  radZoneX,
  radZoneY,
  mmScale,
  isItxCase,
  hoveredCategory,
  onHover,
  onSelect,
}: CpuAndCoolerShapeProps) {
  const { cpuSpec, coolerSpec, caseSpec, categoryStatus } = vm;
  const cpuHovered = hoveredCategory === "CPU";
  const coolerHovered = hoveredCategory === "Cooler";

  // CPU uses brown/amber (#d97706) when selected, gray dashed when unselected
  const cpuPalette = getStrokePalette(
    cpuSpec.selected,
    categoryStatus.CPU.status,
    cpuHovered,
    "#d97706",
    "rgba(217, 119, 6, 0.22)"
  );
  // Air Cooler uses Green (#22c55e) and AIO Radiator + AIO Block use Purple (#a855f7)
  const coolerPalette = getStrokePalette(
    coolerSpec.selected,
    categoryStatus.Cooler.status,
    coolerHovered,
    "#22c55e",
    "rgba(34, 197, 94, 0.20)"
  );
  const isAioSelected = coolerSpec.selected && coolerSpec.mode === "aio";
  const radPalette = getStrokePalette(
    isAioSelected,
    categoryStatus.Cooler.status,
    coolerHovered,
    "#a855f7",
    "rgba(168, 85, 247, 0.22)"
  );

  const socketW = Math.round(cpuSpec.widthMm * mmScale * 0.85);
  const socketH = Math.round(cpuSpec.heightMm * mmScale * 0.85);

  const heightBoost = Math.max(0.82, Math.min(1.22, coolerSpec.towerHeightMm / 155));
  const airW = Math.round(coolerSpec.footprintWidthMm * mmScale * 0.62 * heightBoost);
  const airH = Math.round(coolerSpec.footprintHeightMm * mmScale * 0.66 * heightBoost);
  const towerCircleR = Math.round(Math.max(airW, airH) * 0.56);

  const actualRadMm = isAioSelected
    ? (coolerSpec.radiatorMm ?? caseSpec.maxRadiatorMm)
    : caseSpec.maxRadiatorMm;
  const { lengthPx: radW, thicknessPx: radH } = getRadiatorVisualDims(
    actualRadMm,
    isItxCase
  );

  const activeCoolerPalette = isAioSelected ? radPalette : coolerPalette;
  const coolerTextFill = !coolerSpec.selected
    ? coolerHovered
      ? "#4ade80"
      : "#94a3b8"
    : isAioSelected
      ? "#f3e8ff"
      : "#4ade80";

  return (
    <>
      {/* Top Radiator Mount Zone (Purple when AIO selected, Gray dashed when empty) */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`Radiator Mount: ${isAioSelected ? `${actualRadMm}mm AIO` : `Max ${caseSpec.maxRadiatorMm}mm`}`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("Cooler")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Cooler");
        }}
      >
        <rect
          x={radZoneX}
          y={radZoneY}
          width={radW}
          height={radH}
          rx={3}
          fill={radPalette.fill}
          stroke={radPalette.stroke}
          strokeWidth={coolerHovered ? 2.2 : 1.7}
          strokeDasharray={radPalette.dash}
          style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text
          x={radZoneX + radW / 2}
          y={radZoneY + radH / 2 + 3}
          textAnchor="middle"
          fontSize={8}
          fontWeight={800}
          fill={isAioSelected ? "#f3e8ff" : coolerHovered ? "#c084fc" : "#94a3b8"}
          className="font-mono select-none"
        >
          {isAioSelected
            ? `Radiator (${actualRadMm}mm)`
            : `Radiator (Max: ${caseSpec.maxRadiatorMm}mm)`}
        </text>
      </g>

      {/* Cooler Shape: Circle in Tower Cases, Square in ITX Case */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`Cooler: ${coolerSpec.name} (${coolerSpec.sizeLabel})`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("Cooler")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Cooler");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("Cooler");
          }
        }}
      >
        {isAioSelected && (
          <path
            d={`M ${socketCenterX} ${socketCenterY - 18} C ${socketCenterX - 10} ${radZoneY + radH + 14}, ${radZoneX + 28} ${radZoneY + radH + 14}, ${radZoneX + 28} ${radZoneY + radH}`}
            fill="none"
            stroke="#a855f7"
            strokeWidth={1.8}
          />
        )}
        {isItxCase ? (
          <rect
            x={socketCenterX - (coolerSpec.selected ? airW / 2 : 34)}
            y={socketCenterY - (coolerSpec.selected ? airH / 2 : 30)}
            width={coolerSpec.selected ? airW : 68}
            height={coolerSpec.selected ? airH : 60}
            rx={3}
            fill={activeCoolerPalette.fill}
            stroke={activeCoolerPalette.stroke}
            strokeWidth={coolerHovered ? 2.2 : 1.8}
            strokeDasharray={activeCoolerPalette.dash}
            style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        ) : (
          <circle
            cx={socketCenterX}
            cy={socketCenterY}
            r={coolerSpec.selected ? (isAioSelected ? 28 : towerCircleR) : 34}
            fill={activeCoolerPalette.fill}
            stroke={activeCoolerPalette.stroke}
            strokeWidth={coolerHovered ? 2.2 : 1.8}
            strokeDasharray={activeCoolerPalette.dash}
            style={{ transition: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        )}
        <text
          x={socketCenterX}
          y={socketCenterY - (isItxCase ? 19 : 22)}
          textAnchor="middle"
          fontSize={7.2}
          fontWeight={800}
          fill={coolerTextFill}
          className="font-mono select-none"
        >
          {!coolerSpec.selected
            ? `Cooler (Max ${caseSpec.maxCoolerHeightMm}mm)`
            : isAioSelected
              ? "AIO Block"
              : `${coolerSpec.towerHeightMm}mm`}
        </text>
      </g>

      {/* CPU Square Inside Cooler (Brown when selected, Gray dashed when empty) */}
      <g
        role="button"
        tabIndex={0}
        aria-label={`CPU: ${cpuSpec.name} (${cpuSpec.socketLabel})`}
        className="cursor-pointer focus:outline-none"
        onMouseEnter={() => onHover("CPU")}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("CPU");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("CPU");
          }
        }}
      >
        <rect
          x={socketCenterX - socketW / 2}
          y={socketCenterY - socketH / 2}
          width={socketW}
          height={socketH}
          rx={2}
          fill={cpuPalette.fill}
          stroke={cpuPalette.stroke}
          strokeWidth={cpuHovered ? 2.1 : 1.6}
          strokeDasharray={cpuPalette.dash}
          style={{ transition: "all 240ms ease" }}
        />
        <text
          x={socketCenterX}
          y={socketCenterY + 3}
          textAnchor="middle"
          fontSize={7.5}
          fontWeight={800}
          fill={cpuSpec.selected || cpuHovered ? "#fbbf24" : "#94a3b8"}
          className="font-mono uppercase select-none"
        >
          {cpuSpec.selected ? cpuSpec.socketLabel : "CPU"}
        </text>
      </g>
    </>
  );
}
