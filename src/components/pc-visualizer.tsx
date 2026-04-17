"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import { ComponentData } from "@/lib/types";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONFIGS — Edit positions and sizes here per archetype.
// ─────────────────────────────────────────────────────────────────────────────

const MOBO_SIZES = {
    EATX: { width: 330, height: 305, slots: 2, topSlotOffset: 200, label: "E-ATX MOTHERBOARD" },
    ATX: { width: 244, height: 305, slots: 2, topSlotOffset: 200, label: "ATX MOTHERBOARD" },
    MATX: { width: 244, height: 244, slots: 1, topSlotOffset: 180, label: "MICRO-ATX MOTHERBOARD" },
    ITX: { width: 170, height: 170, slots: 1, topSlotOffset: 150, label: "MINI-ITX MOTHERBOARD" },
};

const LAYOUT_CONFIGS = {
    ITX: {
        label: "MINI-ITX TOWER",
        case: { width: 376, height: 292 },
        mobo: { x: 15, y: 10, width: 170, height: 170, label: "MINI-ITX BOARD" },
        psu: { x: 240, y: 15, width: 90, height: 140, label: "PSU" },
        gpu: { x: 15, width: 200, height: 45, label: "GPU" },
        cooler: { relX: 55, relY: 30, size: 55, label: "CPU COOLER" },
        topRad: { x: 15, y: 10, width: 200, height: 40, label: "AIO RADIATOR" },
        frontRad: null,
    },
    MATX: {
        label: "MICRO-ATX MID-TOWER",
        case: { width: 400, height: 430 },
        mobo: { x: 15, y: 80, width: 244, height: 244, label: "mATX BOARD" },
        psu: { x: 15, y: 80, width: 150, height: 150, label: "PSU" },
        gpu: { x: 15, width: 260, height: 45, label: "GPU" },
        cooler: { relX: 85, relY: 35, size: 75, label: "AIR COOLER" },
        topRad: { x: 8, y: 8, width: 240, height: 38, label: "TOP RADIATOR" },
        frontRad: { x: 330, y: 40, width: 38, height: 240, label: "FRONT RADIATOR" },
    },
    ATX: {
        label: "ATX MID-TOWER",
        case: { width: 460, height: 500 },
        mobo: { x: 15, y: 75, width: 244, height: 305, label: "MOTHERBOARD" },
        psu: { x: 15, y: 80, width: 150, height: 150, label: "PSU" },
        gpu: { x: 15, width: 300, height: 50, label: "GPU" },
        cooler: { relX: 82, relY: 45, size: 80, label: "AIR COOLER" },
        topRad: { x: 20, y: 8, width: 280, height: 40, label: "TOP RADIATOR" },
        frontRad: { x: 400, y: 70, width: 38, height: 140, label: "FRONT RADIATOR" },
    },
    EATX: {
        label: "E-ATX FULL-TOWER",
        case: { width: 560, height: 610 },
        mobo: { x: 15, y: 75, width: 330, height: 305, label: "E-ATX BOARD" },
        psu: { x: 15, y: 80, width: 150, height: 150, label: "E-ATX PSU" },
        gpu: { x: 15, width: 390, height: 55, label: "GPU / MULTI-GPU BAY" },
        cooler: { relX: 115, relY: 50, size: 100, label: "CPU COOLER" },
        topRad: { x: 15, y: 10, width: 420, height: 45, label: "TOP RADIATOR" },
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

    const specs = part.specifications || {};
    const keys = Object.keys(specs);
    const findValue = (synonyms: string[], targetIndex: number = 0) => {
        const foundKey = keys.find(k => synonyms.some(s => k.toLowerCase() === s.toLowerCase()));
        return foundKey ? extractDimension(specs[foundKey], targetIndex) : null;
    };

    if (type === 'GPU') {
        if (aspect === 'primary') {
            const rawLength = findValue(['Length (Depth) (mm)', 'Length', 'Card Length', 'Max Length', 'GPU Length', 'Depth', 'GPU Depth', 'Length (mm)', 'Dimensions'], 0);
            if (rawLength !== null) return Math.round(rawLength);
            return part.dimensions ? Math.round(Math.max(part.dimensions.depth || 0, part.dimensions.width || 0)) : 0;
        } else {
            let slotCount = findValue(['Slot Thickness', 'Slot', 'Slot Size', 'Expansion Slots'], 0);
            if (slotCount !== null && slotCount < 6) {
                return Math.ceil(slotCount) * 22;
            }
            let thickness = findValue(['Thickness', 'Width', 'Card Width', 'Height'], 0);
            if (thickness !== null) {
                if (thickness > 100) return 66;
                return Math.round(thickness);
            }
            if (part.dimensions && part.dimensions.height && part.dimensions.height < 100) return Math.round(part.dimensions.height);
            return 50;
        }
    } else if (type === 'Cooler') {
        const specHeight = findValue(['Height', 'Cooler Height', 'Max Height', 'CPU Cooler Height', 'Height (mm)'], 0);
        if (specHeight !== null) return specHeight;
        return part.dimensions?.height || 0;
    } else if (type === 'PSU') {
        const specLength = findValue(['Length', 'PSU Length', 'Max Length', 'Max PSU Length', 'Depth', 'PSU Depth', 'PSU Dimensions'], 0);
        if (specLength !== null) return specLength;
        return part.dimensions ? Math.max(part.dimensions.depth || 0, part.dimensions.width || 0) : 0;
    }

    return 0;
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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

    if (caseFF.includes("E-ATX") || caseFF.includes("EATX")) archetype = 'EATX';
    else if (caseFF.includes("MATX") || caseFF.includes("MICRO")) archetype = 'MATX';
    else if (caseFF.includes("ITX")) archetype = 'ITX';
    else if (caseFF.includes("ATX")) archetype = 'ATX';
    else if (caseType.includes("E-ATX") || caseType.includes("EATX")) archetype = 'EATX';
    else if (caseType.includes("MATX") || caseType.includes("MICRO")) archetype = 'MATX';
    else if (caseType.includes("ITX") || caseType.includes("SFF")) archetype = 'ITX';
    else if (caseType.includes("ATX")) archetype = 'ATX';
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

    const currentMoboConfig = (moboFF.includes("E-ATX") || moboFF.includes("EATX")) ? MOBO_SIZES.EATX :
        (moboFF.includes("MATX") || moboFF.includes("MICRO")) ? MOBO_SIZES.MATX :
            (moboFF.includes("ITX")) ? MOBO_SIZES.ITX : MOBO_SIZES.ATX;

    const cfg = LAYOUT_CONFIGS[archetype];

    // ── Dynamic CPU Cooler Position ──────────────────
    const coolerRelX = (moboW - cfg.cooler.size) / 2;
    const coolerRelY = moboH * 0.12;

    const actualGpuLength = getActualDimension(gpuData, 'GPU', 'primary') || 0;
    const actualPsuLength = getActualDimension(psuData, 'PSU') || 0;
    const radiatorSizeVal = String(radiatorSize || coolerData?.model || "");
    const actualRadSize = parseInt(radiatorSizeVal.match(/(\d+)/)?.[0] || "0");

    const gpuDisplayWidth = actualGpuLength || cfg.gpu.width;
    const actualGpuThickness = getActualDimension(gpuData, 'GPU', 'secondary') || 0;
    const gpuDisplayHeight = actualGpuThickness || cfg.gpu.height;

    const psuDisplayWidth = (!cfg.psu.height || cfg.psu.height <= cfg.psu.width)
        ? (actualPsuLength || cfg.psu.width)
        : (actualPsuLength || 130);

    const psuDisplayHeight = (!cfg.psu.height || cfg.psu.height <= cfg.psu.width)
        ? cfg.psu.height
        : psuDisplayWidth;

    const topRadDisplayWidth = (isAio && actualRadSize > 0) ? actualRadSize : (cfg.topRad?.width || 0);
    const frontRadDisplayHeight = (isAio && actualRadSize > 0) ? actualRadSize : (cfg.frontRad?.height || 0);

    const topSlotOffset = currentMoboConfig.topSlotOffset;
    const gpuY = cfg.mobo.y + topSlotOffset;

    const caseW = (caseData?.dimensions?.depth) || cfg.case.width;
    const caseH = (caseData?.dimensions?.height) || cfg.case.height;

    const gpuAbsX = cfg.gpu.x + gpuDisplayWidth;
    const gpuBlocked = gpuAbsX > caseW - 10;

    const paddingX = 50;
    const paddingTop = 130;
    const paddingBottom = 50;
    const svgW = caseW + paddingX * 2;
    const svgH = caseH + paddingTop + paddingBottom;

    const containerAspectRatio = `${svgW} / ${svgH}`;

    const cx = (relX: number) => paddingX + relX;
    const cy = (relY: number) => paddingTop + relY;

    const springConfig = { type: "spring", stiffness: 300, damping: 30 };

    // Theme Palettes
    const colors = {
        bg: isDark ? "#0c0f14" : "#f8fafc",
        case: isDark ? "#141417" : "#ffffff",
        caseStroke: isDark ? "#3a3a3a" : "#e2e8f0",
        mobo: isDark ? "#22d3ee" : "#0ea5e9",
        gpu: isDark ? "#a855f7" : "#8b5cf6",
        psu: isDark ? "#3b82f6" : "#2563eb",
        cooler: isDark ? "#22d3ee" : "#0ea5e9",
        text: isDark ? "rgba(255,255,255,0.5)" : "rgba(15, 23, 42, 0.6)",
        textStrong: isDark ? "#ffffff" : "#0f172a",
        grid: isDark ? "rgba(255,255,255,0.02)" : "rgba(15, 23, 42, 0.04)",
        tech: isDark ? "rgba(255,255,255,0.04)" : "rgba(15, 23, 42, 0.06)",
        glass: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.2)",
        reflection: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)"
    };

    return (
        <div
            className={cn(
                "w-full rounded-2xl border relative overflow-hidden flex items-center justify-center font-sans shadow-2xl transition-all duration-500",
                isDark ? "bg-[#0c0f14] border-white/5 shadow-black/40" : "bg-slate-50 border-slate-200 shadow-slate-200/50"
            )}
            style={{ aspectRatio: containerAspectRatio }}
        >
            {/* Top Gradient Edge */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r via-purple-500 animate-pulse z-20",
                isDark ? "from-primary to-primary" : "from-blue-500 to-blue-500"
            )} />

            {/* Neural Scan Beam */}
            <motion.div
                className={cn(
                    "absolute inset-x-0 h-[2px] z-30 pointer-events-none opacity-40",
                    isDark ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                )}
                animate={{
                    top: ["0%", "100%", "0%"],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <div className="absolute top-[3%] left-[3%] z-10 flex flex-col gap-0.5 pointer-events-none">
                <motion.span
                    key={cfg.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                        "text-[10px] md:text-[13px] font-headline font-bold tracking-[0.15em] uppercase",
                        isDark ? "text-cyan-400" : "text-blue-600"
                    )}
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
                            className={cn(
                                "text-[8px] md:text-[10px] font-medium tracking-tight",
                                isDark ? "text-white/50" : "text-slate-500"
                            )}
                        >
                            {caseData.model}
                        </motion.span>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {hasCase && (
                        <motion.span
                            key={`${caseW}x${caseH}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className={cn(
                                "text-[7px] md:text-[9px] font-mono tracking-widest",
                                isDark ? "text-white/30" : "text-slate-400"
                            )}
                        >
                            {caseW}&thinsp;×&thinsp;{caseH}&thinsp;mm
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${svgW} ${svgH}`}
                preserveAspectRatio="xMidYMid meet"
                className={cn(
                    "transition-all duration-700",
                    isDark ? "drop-shadow-[0_0_30px_rgba(34,211,238,0.05)]" : "drop-shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                )}
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values={`0 0 0 0 ${isDark ? 0.13 : 0.23}  0 0 0 0 ${isDark ? 0.82 : 0.64}  0 0 0 0 ${isDark ? 0.93 : 0.96}  0 0 0 0.8 0`} result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                    </filter>

                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke={colors.grid} strokeWidth="0.5" />
                    </pattern>

                    <pattern id="fanPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="8" fill="none" stroke={colors.gpu} strokeOpacity="0.1" strokeWidth="0.5" />
                        <path d="M 10 2 L 10 18 M 2 10 L 18 10" stroke={colors.gpu} strokeOpacity="0.05" strokeWidth="0.5" />
                        <circle cx="10" cy="10" r="2" fill={colors.gpu} fillOpacity="0.05" />
                    </pattern>

                    <pattern id="techPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 0 5 L 10 5 L 15 10 L 15 20 M 20 0 L 20 10 L 25 15" stroke={colors.tech} strokeWidth="0.5" fill="none" />
                        <rect x="5" y="15" width="2" height="2" fill={colors.tech} rx="0.5" />
                        <rect x="22" y="5" width="3" height="3" fill={colors.tech} rx="0.5" />
                    </pattern>

                    <pattern id="ventPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.2" fill={colors.tech} />
                        <circle cx="6" cy="6" r="1.2" fill={colors.tech} />
                    </pattern>

                    <pattern id="ramPattern" width="12" height="60" patternUnits="userSpaceOnUse">
                        <rect x="2" y="0" width="3" height="60" rx="1" fill={colors.tech} />
                        <rect x="7" y="0" width="3" height="60" rx="1" fill={colors.tech} />
                    </pattern>

                    <pattern id="pciePattern" width="180" height="15" patternUnits="userSpaceOnUse">
                        <rect x="0" y="2" width="180" height="4" rx="1" fill={colors.tech} />
                        <rect x="0" y="8" width="100" height="4" rx="1" fill={colors.tech} />
                    </pattern>

                    <linearGradient id="moboGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.mobo} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={colors.mobo} stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="gpuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.gpu} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={colors.gpu} stopOpacity={0.1} />
                    </linearGradient>

                    <linearGradient id="psuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.psu} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.psu} stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="coolerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.cooler} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.cooler} stopOpacity={0.05} />
                    </linearGradient>

                    <linearGradient id="radGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.gpu} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={colors.gpu} stopOpacity={0.15} />
                    </linearGradient>

                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" opacity="0.4" />
                    </pattern>

                    <linearGradient id="reflectionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.reflection} stopOpacity={1} />
                        <stop offset="30%" stopColor={colors.reflection} stopOpacity={0} />
                        <stop offset="70%" stopColor={colors.reflection} stopOpacity={0} />
                        <stop offset="100%" stopColor={colors.reflection} stopOpacity={0.5} />
                    </linearGradient>
                </defs>

                <rect x="0" y="0" width={svgW} height={svgH} fill="url(#grid)" />

                <AnimatePresence>
                    {hasCase && (
                        <motion.rect
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                width: caseW,
                                height: caseH,
                                x: paddingX,
                                y: paddingTop
                            }}
                            transition={springConfig}
                            rx={12}
                            fill={colors.case}
                            stroke={colors.caseStroke}
                            strokeWidth={2}
                        />
                    )}
                </AnimatePresence>

                {hasCase && (
                    <>
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
                                        stroke={colors.gpu} strokeOpacity={0.3} strokeWidth={1}
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
                                        fill={colors.gpu} fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {actualRadSize > 0 ? `${actualRadSize}mm` : cfg.topRad.label}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

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
                                        stroke={colors.gpu} strokeOpacity={0.3} strokeWidth={1}
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
                                        fill={colors.gpu} fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                        transform={`rotate(90, ${cfg.frontRad.width / 2}, ${frontRadDisplayHeight / 2})`}
                                    >
                                        {actualRadSize > 0 ? `${actualRadSize}mm` : cfg.frontRad.label}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {moboData && (
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1, x: cx(cfg.mobo.x), y: cy(cfg.mobo.y) }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={springConfig}
                                >
                                    <motion.rect
                                        animate={{ width: moboW, height: moboH }}
                                        transition={springConfig}
                                        rx={4} fill="url(#moboGrad)"
                                        stroke={colors.mobo} strokeOpacity={0.4} strokeWidth={1}
                                    />
                                    <motion.rect
                                        animate={{ width: moboW, height: moboH }}
                                        transition={springConfig}
                                        fill="url(#techPattern)" opacity={0.3} rx={4}
                                    />
                                    <motion.rect
                                        animate={{ x: moboW * 0.6, y: moboH * 0.5, width: moboW * 0.15, height: moboW * 0.15 }}
                                        fill="rgba(0,0,0,0.2)" stroke={colors.mobo} strokeOpacity={0.1} rx={2}
                                    />

                                    <motion.rect
                                        animate={{ x: coolerRelX + cfg.cooler.size + 10, y: coolerRelY - 10 }}
                                        width={12} height={60}
                                        fill="url(#ramPattern)"
                                        transition={springConfig}
                                    />

                                    <motion.rect
                                        animate={{ x: 15, y: topSlotOffset }}
                                        width={moboW - 60} height={10}
                                        fill="url(#pciePattern)"
                                        transition={springConfig}
                                    />
                                    {currentMoboConfig.slots > 1 && (
                                        <motion.rect
                                            animate={{ x: 15, y: topSlotOffset + 40 }}
                                            width={moboW - 80} height={10}
                                            fill="url(#pciePattern)"
                                            transition={springConfig}
                                        />
                                    )}

                                    <motion.text
                                        animate={{ x: moboW / 2, y: moboH - 12 }}
                                        transition={springConfig}
                                        fill={colors.mobo} fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        {moboLabel}
                                    </motion.text>
                                    <motion.text
                                        animate={{ x: moboW / 2, y: moboH - 24 }}
                                        transition={springConfig}
                                        fill={colors.mobo} fontSize="9" textAnchor="middle" opacity={0.5}
                                        className="font-mono tracking-tight"
                                    >
                                        {moboW}×{moboH}mm
                                    </motion.text>

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
                                                            stroke={colors.mobo} strokeOpacity={0.3} strokeWidth={1}
                                                        />
                                                        <motion.circle r={cfg.cooler.size * 0.25} fill="rgba(0,0,0,0.4)" stroke={colors.mobo} strokeOpacity={0.2} />
                                                        <motion.circle r={cfg.cooler.size * 0.08} fill={colors.mobo} opacity={0.3} />
                                                    </motion.g>
                                                ) : (
                                                    <motion.g>
                                                        <motion.rect
                                                            animate={{ width: cfg.cooler.size, height: cfg.cooler.size }}
                                                            transition={springConfig}
                                                            rx={4} fill="url(#coolerGrad)"
                                                            stroke={colors.mobo} strokeOpacity={0.3} strokeWidth={1}
                                                        />
                                                        <motion.circle
                                                            animate={{ cx: cfg.cooler.size / 2, cy: cfg.cooler.size / 2 }}
                                                            r={cfg.cooler.size * 0.2} fill="rgba(0,0,0,0.4)" stroke={colors.mobo} strokeOpacity={0.15}
                                                        />
                                                    </motion.g>
                                                )}
                                                <text
                                                    x={cfg.cooler.size / 2} y={cfg.cooler.size / 2 + 3}
                                                    fill={colors.mobo} fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                                    className="uppercase tracking-widest font-headline"
                                                >
                                                    {isAio ? "AIO" : "AIR"}
                                                </text>
                                            </motion.g>
                                        )}
                                    </AnimatePresence>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {gpuData && (
                                <motion.g
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{
                                        opacity: 1,
                                        x: cx(cfg.gpu.x),
                                        y: cy(gpuY)
                                    }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={springConfig}
                                >
                                    <motion.rect
                                        animate={{ width: gpuDisplayWidth, height: gpuDisplayHeight }}
                                        transition={springConfig}
                                        rx={6}
                                        fill={gpuBlocked ? "url(#diagonalHatch)" : "url(#gpuGrad)"}
                                        stroke={gpuBlocked ? "#ef4444" : colors.gpu}
                                        strokeWidth={1}
                                    />

                                    {!gpuBlocked && (
                                        <>
                                            <motion.circle
                                                animate={{ cx: gpuDisplayWidth * 0.2, cy: gpuDisplayHeight * 0.5 }}
                                                r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.15)" stroke={colors.gpu} strokeOpacity={0.1}
                                            />
                                            <motion.circle
                                                animate={{ cx: gpuDisplayWidth * 0.5, cy: gpuDisplayHeight * 0.5 }}
                                                r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.15)" stroke={colors.gpu} strokeOpacity={0.1}
                                            />
                                            {gpuDisplayWidth > 200 && (
                                                <motion.circle
                                                    animate={{ cx: gpuDisplayWidth * 0.8, cy: gpuDisplayHeight * 0.5 }}
                                                    r={gpuDisplayHeight * 0.35} fill="rgba(0,0,0,0.15)" stroke={colors.gpu} strokeOpacity={0.1}
                                                />
                                            )}
                                        </>
                                    )}

                                    <motion.text
                                        animate={{ y: gpuDisplayHeight / 2 - 2 }}
                                        transition={springConfig}
                                        x={14}
                                        fill={gpuBlocked ? "#ef4444" : colors.gpu}
                                        fontSize="11" fontWeight="bold" opacity={0.9}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        GPU
                                    </motion.text>
                                    <motion.text
                                        animate={{ y: gpuDisplayHeight / 2 + 10 }}
                                        transition={springConfig}
                                        x={14}
                                        fill={gpuBlocked ? "#ef4444" : colors.gpu}
                                        fontSize="8" opacity={0.7}
                                        className="font-mono tracking-tighter"
                                    >
                                        {actualGpuLength > 0 ? `${actualGpuLength}mm` : `${gpuDisplayWidth}mm`}
                                        {gpuBlocked && " ⚠"}
                                    </motion.text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {psuData && (
                                <motion.g
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, x: cx(cfg.psu.x), y: cy(cfg.psu.y) }}
                                    exit={{ opacity: 0, y: 50 }}
                                    transition={springConfig}
                                >
                                    <motion.rect
                                        animate={{ width: psuDisplayWidth, height: psuDisplayHeight }}
                                        transition={springConfig}
                                        rx={6} fill="url(#psuGrad)"
                                        stroke={colors.psu} strokeOpacity={0.4} strokeWidth={1}
                                    />
                                    <motion.rect
                                        animate={{ width: psuDisplayWidth, height: psuDisplayHeight }}
                                        fill="url(#ventPattern)" opacity={0.4} rx={6}
                                    />
                                    <motion.circle
                                        animate={{ cx: psuDisplayWidth * 0.5, cy: psuDisplayHeight * 0.5 }}
                                        r={psuDisplayHeight * 0.4} fill="rgba(0,0,0,0.2)" stroke={colors.psu} strokeOpacity={0.1}
                                    />

                                    <motion.text
                                        animate={{ x: psuDisplayWidth / 2, y: psuDisplayHeight / 2 + 4 }}
                                        transition={springConfig}
                                        fill={colors.psu} fontSize="11" fontWeight="bold" textAnchor="middle" opacity={0.8}
                                        className="uppercase tracking-widest font-headline"
                                    >
                                        PSU
                                    </motion.text>
                                    <AnimatePresence>
                                        {actualPsuLength > 0 && (
                                            <motion.text
                                                key="psu-length"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.6, x: psuDisplayWidth / 2, y: psuDisplayHeight / 2 + 15 }}
                                                exit={{ opacity: 0 }}
                                                transition={springConfig}
                                                fill={colors.psu} fontSize="9" textAnchor="middle"
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

                        {/* ── CASE GLASS & REFLECTIONS ── */}
                        <motion.rect
                            animate={{
                                width: caseW - 10,
                                height: caseH - 10,
                                x: paddingX + 5,
                                y: paddingTop + 5
                            }}
                            rx={10}
                            fill="url(#reflectionGrad)"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth={0.5}
                            className="pointer-events-none"
                        />
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
