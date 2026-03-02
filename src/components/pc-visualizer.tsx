"use client";

import React from "react";
import { ComponentData } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONFIGS — Edit positions and sizes here per archetype.
// All values are in SVG user-units (roughly 1mm = 1 unit).
// "x" and "y" are relative to the TOP-LEFT corner of the case frame.
// ─────────────────────────────────────────────────────────────────────────────

const MOBO_SIZES = {
    EATX: { width: 330, height: 305, label: "E-ATX MOTHERBOARD" },
    ATX: { width: 244, height: 305, label: "ATX MOTHERBOARD" },
    MATX: { width: 244, height: 244, label: "MICRO-ATX MOTHERBOARD" },
    ITX: { width: 170, height: 170, label: "MINI-ITX MOTHERBOARD" },
};

const LAYOUT_CONFIGS = {

    // ── MINI-ITX TOWER ──────────────────────────────────────────────────────
    ITX: {
        label: "MINI-ITX TOWER",

        // Case frame size (the visible outer box)
        case: { width: 376, height: 292 },

        // Motherboard — top-left, Mini-ITX is 170x170mm
        mobo: { x: 15, y: 60, width: 170, height: 170, label: "MINI-ITX BOARD" },

        // PSU — top-right vertical block
        psu: { x: 270, y: 15, width: 90, height: 140, label: "PSU" },

        // GPU — bottom horizontal bar, anchored at bottom-left
        gpu: { x: 15, y: 280, width: 200, height: 45, label: "GPU" },

        // Cooler — centered on CPU socket area on the mobo
        // Offset is relative to mobo origin (mobo.x, mobo.y)
        cooler: { relX: 55, relY: 30, size: 55, label: "CPU COOLER" },

        // Bottom radiator — only visible when AIO is installed
        // x/y relative to case frame
        topRad: { x: 15, y: 10, width: 200, height: 40, label: "AIO RADIATOR" },
        frontRad: null, // No front radiator for ITX
    },

    // ── MICRO-ATX MID-TOWER ──────────────────────────────────────────────────
    MATX: {
        label: "MICRO-ATX MID-TOWER",

        case: { width: 400, height: 430 },

        // mATX board is 244x244mm
        mobo: { x: 15, y: 80, width: 244, height: 244, label: "mATX BOARD" },

        // ATX PSU — bottom-left inside shroud
        psu: { x: 15, y: 80, width: 150, height: 150, label: "PSU" },

        // GPU — starts at rear, sits below the lower PCIe slot zone
        gpu: { x: 15, y: 420, width: 260, height: 45, label: "GPU" },

        // Cooler — centered on CPU socket
        cooler: { relX: 85, relY: 35, size: 75, label: "AIR COOLER" },

        // Top radiator (240mm)
        topRad: { x: 20, y: 8, width: 240, height: 38, label: "TOP RADIATOR" },
        // Right side panel front radiator (240mm)
        frontRad: { x: 345, y: 80, width: 38, height: 240, label: "FRONT RADIATOR" },
    },

    // ── ATX MID-TOWER ────────────────────────────────────────────────────────
    ATX: {
        label: "ATX MID-TOWER",

        case: { width: 460, height: 500 },

        // Standard ATX board 244x305mm
        mobo: { x: 15, y: 75, width: 244, height: 305, label: "MOTHERBOARD" },

        // ATX PSU — sits in bottom shroud
        psu: { x: 15, y: 80, width: 150, height: 150, label: "PSU" },

        // GPU — below lower PCIe slots
        gpu: { x: 15, y: 450, width: 300, height: 50, label: "GPU" },

        // Cooler on mobo socket center
        cooler: { relX: 82, relY: 45, size: 80, label: "AIR COOLER" },

        // Top radiator (280mm)
        topRad: { x: 20, y: 8, width: 280, height: 40, label: "TOP RADIATOR" },
        // Front panel radiator (140mm)
        frontRad: { x: 400, y: 70, width: 38, height: 140, label: "FRONT RADIATOR" },
    },

    // ── E-ATX FULL-TOWER ─────────────────────────────────────────────────────
    EATX: {
        label: "E-ATX FULL-TOWER",

        case: { width: 560, height: 610 },

        // E-ATX board 330x305mm
        mobo: { x: 15, y: 75, width: 330, height: 305, label: "E-ATX BOARD" },

        // Large ATX/E-ATX PSU at bottom
        psu: { x: 15, y: 80, width: 150, height: 150, label: "E-ATX PSU" },

        // Multi-GPU capable long GPU bay
        gpu: { x: 15, y: 395, width: 390, height: 55, label: "GPU / MULTI-GPU BAY" },

        // Cooler is massive on EATX
        cooler: { relX: 115, relY: 50, size: 100, label: "CPU COOLER" },

        // Top radiator (360-420mm)
        topRad: { x: 15, y: 10, width: 420, height: 45, label: "TOP RADIATOR" },
        // Front panel radiator (280-420mm)
        frontRad: { x: 420, y: 90, width: 42, height: 420, label: "FRONT RADIATOR" },
    },
};

// ─────────────────────────────────────────────────────────────────────────────

function extractDimension(val: any, index: number = 0): number | null {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        if (lowerVal.includes('slot')) {
            const num = parseFloat(lowerVal.match(/(\d+(\.\d+)?)/)?.[0] || "");
            if (!isNaN(num)) return num;
        }
        const matches = val.match(/(\d+(\.\d+)?)/g);
        if (matches && matches[index]) return parseFloat(matches[index]);
    }
    return null;
}

function getActualDimension(part: ComponentData | null, type: 'GPU' | 'Cooler' | 'PSU', aspect: 'primary' | 'secondary' = 'primary'): number {
    if (!part) return 0;

    if (part.dimensions) {
        if (type === 'Cooler') return part.dimensions.height;
        if (aspect === 'primary') return Math.max(part.dimensions.depth || 0, part.dimensions.width || 0);
        else return part.dimensions.height || 0;
    }

    const specs = part.specifications || {};
    const keys = Object.keys(specs);
    const findValue = (synonyms: string[], targetIndex: number = 0) => {
        const foundKey = keys.find(k => synonyms.some(s => k.toLowerCase() === s.toLowerCase()));
        return foundKey ? extractDimension(specs[foundKey], targetIndex) : null;
    };

    if (type === 'GPU') {
        if (aspect === 'primary') {
            return findValue(['Length', 'Card Length', 'Max Length', 'GPU Length', 'Depth', 'GPU Depth', 'Length (mm)', 'Dimensions'], 0) || 0;
        } else {
            let slotCount = findValue(['Slot', 'Slot Size', 'Expansion Slots'], 0);
            if (slotCount !== null && slotCount < 6) return slotCount * 22;
            let thickness = findValue(['Thickness', 'Width', 'Card Width', 'Height'], 0);
            if (thickness !== null) {
                if (thickness > 100) return 66;
                return thickness;
            }
            let dim3 = findValue(['Dimensions'], 2);
            if (dim3) return dim3;
            return 50;
        }
    } else if (type === 'Cooler') {
        return findValue(['Height', 'Cooler Height', 'Max Height', 'CPU Cooler Height', 'Height (mm)'], 0) || 0;
    } else if (type === 'PSU') {
        return findValue(['Length', 'PSU Length', 'Max Length', 'Max PSU Length', 'Depth', 'PSU Depth', 'PSU Dimensions'], 0) || 0;
    }

    return 0;
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const caseData = build["Case"] as ComponentData | null;
    const moboData = build["Motherboard"] as ComponentData | null;
    const gpuData = build["GPU"] as ComponentData | null;
    const coolerData = build["Cooler"] as ComponentData | null;
    const psuData = build["PSU"] as ComponentData | null;

    const hasCase = !!caseData;

    // ── Detect AIO ──────────────────────────────────────────────────────────
    const coolerModel = coolerData?.model?.toLowerCase() || "";
    const radiatorSize = coolerData?.specifications?.["Radiator Size"] as string;
    const isAio = coolerModel.includes("aio") || coolerModel.includes("liquid") || (radiatorSize && radiatorSize.includes("mm"));

    // ── Determine Archetype (Strictly Case-First) ──────────────────────────
    const moboFF = (moboData?.specifications?.["Form Factor"] as string)?.toUpperCase() || "";
    const caseFF = (caseData?.specifications?.["Mobo Support"] as string)?.toUpperCase() || "";
    const caseType = (caseData?.specifications?.["Type"] as string)?.toUpperCase() || "";

    let archetype: keyof typeof LAYOUT_CONFIGS = 'ATX';

    // 1. Check Case support first to define the chassis frame and layout
    if (caseFF.includes("E-ATX") || caseFF.includes("EATX")) archetype = 'EATX';
    else if (caseFF.includes("MATX") || caseFF.includes("MICRO")) archetype = 'MATX';
    else if (caseFF.includes("ITX")) archetype = 'ITX';
    else if (caseFF.includes("ATX")) archetype = 'ATX';
    // 2. Fallback to Case Type (e.g. "ATX Mid Tower")
    else if (caseType.includes("E-ATX") || caseType.includes("EATX")) archetype = 'EATX';
    else if (caseType.includes("MATX") || caseType.includes("MICRO")) archetype = 'MATX';
    else if (caseType.includes("ITX") || caseType.includes("SFF")) archetype = 'ITX';
    else if (caseType.includes("ATX")) archetype = 'ATX';
    // 3. Fallback to motherboard size only if Case has no data
    else if (!hasCase || (!caseFF && !caseType)) {
        if (moboFF.includes("E-ATX") || moboFF.includes("EATX")) archetype = 'EATX';
        else if (moboFF.includes("MATX") || moboFF.includes("MICRO")) archetype = 'MATX';
        else if (moboFF.includes("ITX")) archetype = 'ITX';
        else if (moboFF.includes("ATX")) archetype = 'ATX';
    }

    // ── Determine Motherboard Size ──────────────────────────────────────────
    let moboW = 244;
    let moboH = 305;
    let moboLabel = "MOTHERBOARD";

    if (moboFF.includes("E-ATX") || moboFF.includes("EATX")) {
        moboW = MOBO_SIZES.EATX.width; moboH = MOBO_SIZES.EATX.height; moboLabel = MOBO_SIZES.EATX.label;
    } else if (moboFF.includes("MATX") || moboFF.includes("MICRO")) {
        moboW = MOBO_SIZES.MATX.width; moboH = MOBO_SIZES.MATX.height; moboLabel = MOBO_SIZES.MATX.label;
    } else if (moboFF.includes("ITX")) {
        moboW = MOBO_SIZES.ITX.width; moboH = MOBO_SIZES.ITX.height; moboLabel = MOBO_SIZES.ITX.label;
    } else {
        moboW = MOBO_SIZES.ATX.width; moboH = MOBO_SIZES.ATX.height; moboLabel = MOBO_SIZES.ATX.label;
    }

    // ── Get Layout Config ────────────────────────────────────────────────────
    const cfg = LAYOUT_CONFIGS[archetype];

    // ── Dynamic CPU Cooler Position (Upper Middle of Board) ──────────────────
    const coolerRelX = (moboW - cfg.cooler.size) / 2;
    const coolerRelY = moboH * 0.12;

    // ── Real part dimensions (override config defaults if data available) ───
    const actualGpuLength = getActualDimension(gpuData, 'GPU', 'primary') || 0;
    const actualPsuLength = getActualDimension(psuData, 'PSU') || 0;

    // Extract actual radiator size (e.g., 240 from "240mm")
    const actualRadSize = parseInt(String(radiatorSize || coolerData?.model || "").match(/(\d+)/)?.[0] || "0");

    const gpuDisplayWidth = actualGpuLength || cfg.gpu.width;
    const actualGpuThickness = getActualDimension(gpuData, 'GPU', 'secondary') || 0;
    const gpuDisplayHeight = actualGpuThickness || cfg.gpu.height;

    const psuDisplayWidth = (!cfg.psu.height || cfg.psu.height <= cfg.psu.width)
        ? (actualPsuLength || cfg.psu.width)
        : cfg.psu.width; // Keep SFX block shape for ITX

    // Dynamic Radiator Dimensions
    const topRadDisplayWidth = (isAio && actualRadSize > 0) ? actualRadSize : (cfg.topRad?.width || 0);
    const frontRadDisplayHeight = (isAio && actualRadSize > 0) ? actualRadSize : (cfg.frontRad?.height || 0);

    // ── Case dimensions (real data wins over config) ─────────────────────────
    const caseW = (caseData?.dimensions?.depth) || cfg.case.width;
    const caseH = (caseData?.dimensions?.height) || cfg.case.height;

    // ── Clearance check: does GPU exceed case depth? ─────────────────────────
    const gpuAbsX = cfg.gpu.x + gpuDisplayWidth;
    const gpuBlocked = gpuAbsX > caseW - 10;

    const padding = 50;
    const svgW = caseW + padding * 2;
    const svgH = caseH + padding * 0;

    // Helper: absolute SVG coordinate from case-relative coord
    const cx = (relX: number) => padding + relX;
    const cy = (relY: number) => padding + relY;

    const springConfig = { type: "spring", stiffness: 300, damping: 30 };

    return (
        <div className="w-full h-[450px] bg-[#0c0f14] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center font-sans shadow-2xl">
            {/* Top Gradient Edge - Matched to Analytics height and colors */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500" />

            {/* HUD overlay */}
            <div className="absolute top-5 left-5 z-10 flex flex-col gap-1.5 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <motion.h3
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[13px] font-headline font-bold text-cyan-400 tracking-[0.15em] uppercase"
                    >
                        Clearance Preview
                    </motion.h3>
                </div>

                <div className="flex flex-col gap-1 ml-6">
                    <motion.span
                        key={cfg.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[11px] text-white/70 tracking-wider font-medium uppercase"
                    >
                        {cfg.label}
                    </motion.span>
                    <AnimatePresence mode="wait">
                        {caseData && (
                            <motion.span
                                key={caseData.id || caseData.model}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="text-[10px] text-white/40 font-medium tracking-tight"
                            >
                                {caseData.model}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${svgW} ${svgH}`}
                preserveAspectRatio="xMidYMid meet"
                className="drop-shadow-[0_0_30px_rgba(34,211,238,0.05)]"
            >
                <defs>
                    {/* --- Advanced Filters --- */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.8 0" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                    </filter>

                    {/* --- Patterns --- */}
                    {/* HUD / Background Grid */}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                    </pattern>

                    {/* Radiator / Fan pattern */}
                    <pattern id="fanPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="8" fill="none" stroke="#a855f7" strokeOpacity="0.1" strokeWidth="0.5" />
                        <path d="M 10 2 L 10 18 M 2 10 L 18 10" stroke="#a855f7" strokeOpacity="0.05" strokeWidth="0.5" />
                        <circle cx="10" cy="10" r="2" fill="#a855f7" fillOpacity="0.05" />
                    </pattern>

                    {/* Circuitry / Tech pattern for GPU/Mobo */}
                    <pattern id="techPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 0 5 L 10 5 L 15 10 L 15 20 M 20 0 L 20 10 L 25 15" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none" />
                        <rect x="5" y="15" width="2" height="2" fill="rgba(255,255,255,0.06)" rx="0.5" />
                        <rect x="22" y="5" width="3" height="3" fill="rgba(34, 211, 238, 0.05)" rx="0.5" />
                    </pattern>

                    {/* PSU / Chassis Ventilation pattern */}
                    <pattern id="ventPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.08)" />
                        <circle cx="6" cy="6" r="1.2" fill="rgba(255,255,255,0.08)" />
                    </pattern>

                    {/* RAM Slots Pattern */}
                    <pattern id="ramPattern" width="12" height="60" patternUnits="userSpaceOnUse">
                        <rect x="2" y="0" width="3" height="60" rx="1" fill="rgba(255,255,255,0.05)" />
                        <rect x="7" y="0" width="3" height="60" rx="1" fill="rgba(255,255,255,0.05)" />
                    </pattern>

                    {/* PCIe Slot Pattern */}
                    <pattern id="pciePattern" width="180" height="15" patternUnits="userSpaceOnUse">
                        <rect x="0" y="2" width="180" height="4" rx="1" fill="rgba(255,255,255,0.1)" />
                        <rect x="0" y="8" width="100" height="4" rx="1" fill="rgba(255,255,255,0.05)" />
                    </pattern>

                    {/* Component Gradients */}
                    <linearGradient id="moboGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="gpuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6b21a8" stopOpacity={0.1} />
                    </linearGradient>

                    <linearGradient id="psuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="coolerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="radGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6b21a8" stopOpacity={0.15} />
                    </linearGradient>

                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" opacity="0.4" />
                    </pattern>
                </defs>

                {/* BACKGROUND GRID */}
                <rect x="0" y="0" width={svgW} height={svgH} fill="url(#grid)" />

                {/* ── CASE FRAME ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {hasCase && (
                        <motion.rect
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                width: caseW,
                                height: caseH,
                                x: padding,
                                y: padding
                            }}
                            transition={springConfig}
                            rx={12}
                            fill="#141417"
                            stroke="#3a3a3a"
                            strokeWidth={2}
                        />
                    )}
                </AnimatePresence>

                {/* Case size label */}
                {hasCase && (
                    <motion.text
                        animate={{ x: padding + caseW - 8, y: padding + caseH - 8 }}
                        transition={springConfig}
                        fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" fontWeight="bold"
                        className="uppercase tracking-widest font-mono"
                    >
                        {caseW}×{caseH}mm
                    </motion.text>
                )}

                {hasCase && (
                    <>
                        {/* ── TOP RADIATOR (Purple) ── */}
                        <AnimatePresence>
                            {cfg.topRad && isAio && (
                                <motion.g
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, x: cx(cfg.topRad.x), y: cy(cfg.topRad.y) }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={springConfig}
                                >
                                    <motion.rect
                                        animate={{ width: topRadDisplayWidth }}
                                        transition={springConfig}
                                        height={cfg.topRad.height}
                                        rx={4} fill="url(#radGrad)"
                                        stroke="#a855f7" strokeOpacity={0.3} strokeWidth={1}
                                    />
                                    <motion.rect
                                        animate={{ width: topRadDisplayWidth }}
                                        transition={springConfig}
                                        height={cfg.topRad.height}
                                        rx={4} fill="url(#fanPattern)"
                                        opacity={0.4}
                                    />
                                    <motion.text
                                        animate={{ x: topRadDisplayWidth / 2 }}
                                        transition={springConfig}
                                        y={cfg.topRad.height / 2 + 4}
                                        fill="#a855f7" fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {actualRadSize > 0 ? `${actualRadSize}mm RADIATOR` : cfg.topRad.label}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* ── FRONT / SIDE RADIATOR (Purple) ─────────────────────── */}
                        <AnimatePresence>
                            {cfg.frontRad && isAio && (
                                <motion.g
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: cx(cfg.frontRad.x), y: cy(cfg.frontRad.y) }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={springConfig}
                                >
                                    <motion.rect
                                        animate={{ height: frontRadDisplayHeight }}
                                        transition={springConfig}
                                        width={cfg.frontRad.width}
                                        rx={4} fill="url(#radGrad)"
                                        stroke="#a855f7" strokeOpacity={0.3} strokeWidth={1}
                                    />
                                    <motion.rect
                                        animate={{ height: frontRadDisplayHeight }}
                                        transition={springConfig}
                                        width={cfg.frontRad.width}
                                        rx={4} fill="url(#fanPattern)"
                                        opacity={0.4}
                                    />
                                    <motion.text
                                        animate={{ y: frontRadDisplayHeight / 2 }}
                                        transition={springConfig}
                                        x={cfg.frontRad.width / 2}
                                        fill="#a855f7" fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                        transform={`rotate(90, ${cfg.frontRad.width / 2}, ${frontRadDisplayHeight / 2})`}
                                    >
                                        {actualRadSize > 0 ? `${actualRadSize}mm RADIATOR` : cfg.frontRad.label}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* ── MOTHERBOARD (Blue) ─────────────────────────────────── */}
                        <AnimatePresence>
                            {moboData && (
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1, x: cx(cfg.mobo.x), y: cy(cfg.mobo.y) }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={springConfig}
                                >
                                    {/* Main PCB */}
                                    <motion.rect
                                        animate={{ width: moboW, height: moboH }}
                                        transition={springConfig}
                                        rx={4} fill="url(#moboGrad)"
                                        stroke="#3b82f6" strokeOpacity={0.4} strokeWidth={1}
                                    />
                                    {/* Subtle Tech Overlay */}
                                    <motion.rect
                                        animate={{ width: moboW, height: moboH }}
                                        transition={springConfig}
                                        fill="url(#techPattern)" opacity={0.3} rx={4}
                                    />
                                    {/* Chipset Area Detail */}
                                    <motion.rect
                                        animate={{ x: moboW * 0.6, y: moboH * 0.5, width: moboW * 0.15, height: moboW * 0.15 }}
                                        fill="rgba(0,0,0,0.3)" stroke="#22d3ee" strokeOpacity={0.1} rx={2}
                                    />

                                    {/* RAM Slots - placed to the right of cooler area */}
                                    <motion.rect
                                        animate={{ x: coolerRelX + cfg.cooler.size + 10, y: coolerRelY - 10 }}
                                        width={12} height={60}
                                        fill="url(#ramPattern)"
                                        transition={springConfig}
                                    />

                                    {/* PCIe Slots - bottom area */}
                                    <motion.rect
                                        animate={{ x: 15, y: moboH - 80 }}
                                        width={moboW - 60} height={15}
                                        fill="url(#pciePattern)"
                                        transition={springConfig}
                                    />
                                    <motion.rect
                                        animate={{ x: 15, y: moboH - 40 }}
                                        width={moboW - 80} height={15}
                                        fill="url(#pciePattern)"
                                        transition={springConfig}
                                    />

                                    <motion.text
                                        animate={{ x: moboW / 2, y: moboH - 12 }}
                                        transition={springConfig}
                                        fill="#22d3ee" fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {moboLabel}
                                    </motion.text>
                                    <motion.text
                                        animate={{ x: moboW / 2, y: moboH - 24 }}
                                        transition={springConfig}
                                        fill="#22d3ee" fontSize="9" textAnchor="middle" opacity={0.5}
                                        className="font-mono tracking-tight"
                                    >
                                        {moboW}×{moboH}mm
                                    </motion.text>

                                    {/* ── CPU COOLER (Green) ── */}
                                    <AnimatePresence>
                                        {coolerData && (
                                            <motion.g
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1, x: coolerRelX, y: coolerRelY }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                transition={springConfig}
                                            >
                                                {isAio ? (
                                                    <motion.g animate={{ x: cfg.cooler.size / 2, y: cfg.cooler.size / 2 }}>
                                                        <motion.circle
                                                            animate={{ r: cfg.cooler.size / 2 }}
                                                            transition={springConfig}
                                                            fill="url(#coolerGrad)"
                                                            stroke="#22d3ee" strokeOpacity={0.3} strokeWidth={1}
                                                        />
                                                        {/* Pump Center Detail */}
                                                        <motion.circle r={cfg.cooler.size * 0.25} fill="rgba(0,0,0,0.4)" stroke="#22d3ee" strokeOpacity={0.2} />
                                                        <motion.circle r={cfg.cooler.size * 0.08} fill="#22d3ee" opacity={0.3} />
                                                    </motion.g>
                                                ) : (
                                                    <motion.g>
                                                        <motion.rect
                                                            animate={{ width: cfg.cooler.size, height: cfg.cooler.size }}
                                                            transition={springConfig}
                                                            rx={4} fill="url(#coolerGrad)"
                                                            stroke="#22d3ee" strokeOpacity={0.3} strokeWidth={1}
                                                        />
                                                        {/* Fan Hub Detail */}
                                                        <motion.circle
                                                            animate={{ cx: cfg.cooler.size / 2, cy: cfg.cooler.size / 2 }}
                                                            r={cfg.cooler.size * 0.2} fill="rgba(0,0,0,0.4)" stroke="#22d3ee" strokeOpacity={0.15}
                                                        />
                                                    </motion.g>
                                                )}
                                                <text
                                                    x={cfg.cooler.size / 2} y={cfg.cooler.size / 2 - 4}
                                                    fill="#22d3ee" fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                                    className="uppercase tracking-widest font-headline"
                                                >
                                                    {isAio ? "AIO" : "AIR"}
                                                </text>
                                                <text
                                                    x={cfg.cooler.size / 2} y={cfg.cooler.size / 2 + 10}
                                                    fill="#22d3ee" fontSize="9" textAnchor="middle" opacity={0.6}
                                                    className="uppercase tracking-widest font-mono"
                                                >
                                                    {cfg.cooler.label}
                                                </text>
                                            </motion.g>
                                        )}
                                    </AnimatePresence>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* ── GPU (Yellow) ─────────────────────────────────────────── */}
                        <AnimatePresence>
                            {gpuData && (
                                <motion.g
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{
                                        opacity: 1,
                                        x: cx(cfg.gpu.x),
                                        y: cy(cfg.gpu.y - gpuDisplayHeight)
                                    }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={springConfig}
                                >
                                    {/* Shroud */}
                                    <motion.rect
                                        animate={{ width: gpuDisplayWidth, height: gpuDisplayHeight }}
                                        transition={springConfig}
                                        rx={6}
                                        fill={gpuBlocked ? "url(#diagonalHatch)" : "url(#gpuGrad)"}
                                        stroke={gpuBlocked ? "#ef4444" : "#eab308"}
                                        strokeWidth={1}
                                    />

                                    {!gpuBlocked && (
                                        <>
                                            {/* GPU Fans - 3 fans for long cards, 2 for short */}
                                            <motion.circle
                                                animate={{ cx: gpuDisplayWidth * 0.2, cy: gpuDisplayHeight * 0.5 }}
                                                r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.2)" stroke="rgba(234, 179, 8, 0.1)"
                                            />
                                            <motion.circle
                                                animate={{ cx: gpuDisplayWidth * 0.5, cy: gpuDisplayHeight * 0.5 }}
                                                r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.2)" stroke="rgba(234, 179, 8, 0.1)"
                                            />
                                            {gpuDisplayWidth > 200 && (
                                                <motion.circle
                                                    animate={{ cx: gpuDisplayWidth * 0.8, cy: gpuDisplayHeight * 0.5 }}
                                                    r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.2)" stroke="rgba(234, 179, 8, 0.1)"
                                                />
                                            )}
                                        </>
                                    )}

                                    <motion.text
                                        animate={{ y: gpuDisplayHeight / 2 - 4 }}
                                        transition={springConfig}
                                        x={14}
                                        fill={gpuBlocked ? "#ef4444" : "#a855f7"}
                                        fontSize="11" fontWeight="bold" opacity={0.9}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {archetype === 'EATX' ? "GPU / MULTI-GPU BAY" : cfg.gpu.label}
                                    </motion.text>
                                    <motion.text
                                        animate={{ y: gpuDisplayHeight / 2 + 11 }}
                                        transition={springConfig}
                                        x={14}
                                        fill={gpuBlocked ? "#ef4444" : "#a855f7"}
                                        fontSize="9" opacity={0.7}
                                        className="font-mono"
                                    >
                                        {actualGpuLength > 0
                                            ? `${actualGpuLength}mm × ${actualGpuThickness || gpuDisplayHeight}mm${gpuBlocked ? " — BLOCKED ⚠" : ""}`
                                            : `DEFAULT ${gpuDisplayWidth}mm`}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* ── PSU (Orange) ─────────────────────────────────────────── */}
                        <AnimatePresence>
                            {psuData && (
                                <motion.g
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, x: cx(cfg.psu.x), y: cy(cfg.psu.y) }}
                                    exit={{ opacity: 0, y: 50 }}
                                    transition={springConfig}
                                >
                                    {/* Body */}
                                    <motion.rect
                                        animate={{ width: psuDisplayWidth, height: cfg.psu.height }}
                                        transition={springConfig}
                                        rx={6} fill="url(#psuGrad)"
                                        stroke="#f97316" strokeOpacity={0.4} strokeWidth={1}
                                    />
                                    {/* Ventilation Pattern */}
                                    <motion.rect
                                        animate={{ width: psuDisplayWidth, height: cfg.psu.height }}
                                        fill="url(#ventPattern)" opacity={0.4} rx={6}
                                    />
                                    {/* PSU Fan Grill */}
                                    <motion.circle
                                        animate={{ cx: psuDisplayWidth * 0.5, cy: cfg.psu.height * 0.5 }}
                                        r={cfg.psu.height * 0.4} fill="rgba(0,0,0,0.3)" stroke="rgba(249, 115, 22, 0.1)"
                                    />
                                    <motion.circle
                                        animate={{ cx: psuDisplayWidth * 0.5, cy: cfg.psu.height * 0.5 }}
                                        r={cfg.psu.height * 0.1} fill="rgba(249, 115, 22, 0.1)"
                                    />

                                    <motion.text
                                        animate={{ x: psuDisplayWidth / 2, y: cfg.psu.height / 2 - 4 }}
                                        transition={springConfig}
                                        fill="#22d3ee" fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {cfg.psu.label}
                                    </motion.text>
                                    <AnimatePresence>
                                        {actualPsuLength > 0 && (
                                            <motion.text
                                                key="psu-length"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.6, x: psuDisplayWidth / 2, y: cfg.psu.height / 2 + 11 }}
                                                exit={{ opacity: 0 }}
                                                transition={springConfig}
                                                fill="#22d3ee" fontSize="10" textAnchor="middle"
                                                className="font-mono"
                                            >
                                                {actualPsuLength}mm
                                            </motion.text>
                                        )}
                                    </AnimatePresence>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* ── REAR I/O STRIP ──────────────────────────────────────── */}
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={springConfig}
                        >
                            <motion.line
                                animate={{
                                    x1: cx(3), y1: cy(cfg.mobo.y + 10),
                                    x2: cx(3), y2: cy(cfg.mobo.y + cfg.mobo.height - 10)
                                }}
                                transition={springConfig}
                                stroke="#333" strokeWidth={6} strokeLinecap="round"
                            />
                            {/* Generic Port Details */}
                            <motion.circle animate={{ cx: cx(3), cy: cy(cfg.mobo.y + 20) }} r={1.5} fill="#555" transition={springConfig} />
                            <motion.circle animate={{ cx: cx(3), cy: cy(cfg.mobo.y + 30) }} r={1.5} fill="#555" transition={springConfig} />
                            <motion.rect
                                animate={{ x: cx(3) - 1.5, y: cy(cfg.mobo.y + 45), width: 3, height: 10 }}
                                fill="#444" rx={0.5} transition={springConfig}
                            />
                        </motion.g>
                    </>
                )}
            </svg>

            {/* Empty State */}
            <AnimatePresence>
                {!hasCase && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 backdrop-blur-[2px]"
                    >
                        <p className="text-[11px] font-bold text-white tracking-[0.2em] uppercase bg-black/80 px-6 py-3 rounded-full border border-white/5 shadow-2xl">
                            Select a PC Case to begin clearance preview
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
