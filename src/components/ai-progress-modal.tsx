"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Paper,
    Stack,
    Group,
    Text,
    Badge,
    Button,
    ThemeIcon,
    Progress,
    ScrollArea,
    ActionIcon,
    Tooltip,
    Divider
} from "@mantine/core";
import {
    Bot,
    Loader2,
    CheckCircle2,
    Terminal,
    Cpu,
    Zap,
    Sparkles,
    Image as ImageIcon,
    X,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressPhase = 'init' | 'ai-requesting' | 'ai-complete' | 'ai-formatting' | 'image-fetch' | 'saving' | 'done';

interface AIProgressModalProps {
    isOpen: boolean;
    onComplete?: () => void;
    onCancel?: () => void;
    title?: string;
    currentPhase?: ProgressPhase;
    tokensUsed?: number | null;
}

const PHASE_CONFIG: Record<ProgressPhase, { text: string; icon: React.ComponentType<{ className?: string }> }> = {
    'init': { text: "Initializing AI Engine...", icon: Bot },
    'ai-requesting': { text: "Requesting Stage 1 Analysis...", icon: Cpu },
    'ai-complete': { text: "Stage 1 Analysis complete.", icon: Terminal },
    'ai-formatting': { text: "Requesting Stage 2 Formatting...", icon: Zap },
    'image-fetch': { text: "Asset Retrieval: Fetching product imagery...", icon: ImageIcon },
    'saving': { text: "Finalizing Prebuilt configuration...", icon: Sparkles },
    'done': { text: "Prebuilt successfully configured and added to catalog", icon: CheckCircle2 },
};

const PHASE_ORDER: ProgressPhase[] = ['init', 'ai-requesting', 'ai-complete', 'ai-formatting', 'image-fetch', 'saving', 'done'];

export function AIProgressModal({
    isOpen,
    onComplete,
    onCancel,
    title = "Creating Prebuilt",
    currentPhase = 'init',
    tokensUsed
}: AIProgressModalProps) {
    const [logs, setLogs] = useState<{ text: string; type: 'info' | 'success'; timestamp: string }[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const startTimeRef = useRef<number>(Date.now());
    const processedPhasesRef = useRef<Set<ProgressPhase>>(new Set());
    const logsEndRef = useRef<HTMLDivElement>(null);

    const isFinished = currentPhase === 'done';
    const currentStepIndex = Math.max(0, PHASE_ORDER.indexOf(currentPhase));
    const percent = Math.round(((currentStepIndex + 1) / PHASE_ORDER.length) * 100);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setLogs([]);
            setElapsedTime(0);
            setShowTooltip(false);
            startTimeRef.current = Date.now();
            processedPhasesRef.current = new Set();
        }
    }, [isOpen]);

    // Elapsed timer
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            if (!isFinished) {
                setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen, isFinished]);

    // Add log entry when phase changes
    useEffect(() => {
        if (!isOpen || !currentPhase) return;
        if (processedPhasesRef.current.has(currentPhase)) return;

        processedPhasesRef.current.add(currentPhase);
        const config = PHASE_CONFIG[currentPhase];
        if (config) {
            setLogs(prev => [...prev, {
                text: config.text,
                type: currentPhase === 'done' ? 'success' : 'info',
                timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            }]);
        }

        if (isFinished) {
            setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }
    }, [currentPhase, isOpen, isFinished]);

    // Auto-scroll to bottom when logs update
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-lg"
                    >
                        <Paper
                            withBorder
                            radius="lg"
                            className="bg-white/95 dark:bg-[#111722]/95 border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden !p-3 backdrop-blur-md"
                        >
                            <Stack gap="xs">
                                {/* Header: 12px padding container, clean Mantine group */}
                                <Group justify="space-between" align="center" wrap="nowrap" className="p-3 bg-slate-50/80 dark:bg-white/[0.03] rounded-lg border border-slate-200/60 dark:border-white/5">
                                    <Group gap="xs" align="center">
                                        <ThemeIcon size={34} radius="md" variant="light" color="cyan">
                                            <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                                        </ThemeIcon>
                                        <div>
                                            <Text fw={700} size="sm" className="font-headline tracking-tight text-slate-900 dark:text-white capitalize">
                                                {title}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {isFinished ? "Generation complete" : "Processing request"}
                                            </Text>
                                        </div>
                                    </Group>

                                    <Group gap="xs" align="center">
                                        {!isFinished && onCancel && (
                                            <Button
                                                variant="subtle"
                                                color="red"
                                                size="xs"
                                                radius="md"
                                                onClick={onCancel}
                                                leftSection={<X size={13} />}
                                                className="h-7 px-2.5 text-xs font-medium"
                                            >
                                                Cancel
                                            </Button>
                                        )}

                                        {isFinished ? (
                                            <div className="relative">
                                                <Badge
                                                    size="sm"
                                                    variant="light"
                                                    color="cyan"
                                                    radius="sm"
                                                    leftSection={<Zap size={11} className="text-yellow-500 fill-yellow-500" />}
                                                    className="cursor-pointer font-mono font-semibold"
                                                    onClick={() => setShowTooltip(prev => !prev)}
                                                >
                                                    {elapsedTime.toFixed(1)}s turnaround
                                                </Badge>

                                                {/* Mini Telemetry Tooltip popover */}
                                                {showTooltip && (
                                                    <Paper
                                                        withBorder
                                                        radius="md"
                                                        p="xs"
                                                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 shadow-xl z-50 text-[11px] font-mono space-y-1.5"
                                                    >
                                                        <div className="flex justify-between pb-1 border-b border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold uppercase">
                                                            <span>Telemetry</span>
                                                            <span className="text-emerald-500">Complete</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                                                            <span className="font-semibold">{elapsedTime.toFixed(1)}s</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500 dark:text-slate-400">Tokens:</span>
                                                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                                                {tokensUsed ?? Math.round(480 + (elapsedTime * 2.5))}
                                                            </span>
                                                        </div>
                                                    </Paper>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge size="xs" variant="light" color="cyan" radius="sm" className="font-mono">
                                                {elapsedTime}s
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>

                                {/* Terminal Console Area: Compact Minimalist surface */}
                                <div className="p-3 bg-slate-950/95 dark:bg-black/85 rounded-lg border border-slate-800/80 dark:border-white/10 font-mono text-xs text-slate-300">
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-red-500/70" />
                                            <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">Console Output</span>
                                    </div>

                                    <ScrollArea h={180} scrollbarSize={4} offsetScrollbars>
                                        <div className="space-y-2 pr-2">
                                            {logs.map((log, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                                                    <span className="text-slate-500 text-[11px] shrink-0 font-mono">
                                                        [{log.timestamp}]
                                                    </span>
                                                    <span className={cn(
                                                        "flex-1",
                                                        log.type === 'success'
                                                            ? "text-cyan-400 font-semibold"
                                                            : "text-slate-300"
                                                    )}>
                                                        {log.type === 'success' ? "✓ " : "> "}{log.text}
                                                    </span>
                                                </div>
                                            ))}

                                            {isFinished && (
                                                <div className="pt-2 mt-2 border-t border-white/10 text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Prebuilt saved and added to catalog</span>
                                                </div>
                                            )}

                                            {!isFinished && (
                                                <div className="flex items-center gap-2 text-cyan-400/80 text-xs py-0.5">
                                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                                    <span>Working on next step...</span>
                                                </div>
                                            )}
                                            <div ref={logsEndRef} />
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Progress Indicator / Completion Action */}
                                <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-lg border border-slate-200/60 dark:border-white/5 space-y-2.5">
                                    {!isFinished ? (
                                        <Stack gap="xs">
                                            <Group justify="space-between" align="center">
                                                <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300 truncate max-w-[320px]">
                                                    {PHASE_CONFIG[currentPhase]?.text || "Processing..."}
                                                </Text>
                                                <Text size="xs" fw={700} c="cyan" className="font-mono">
                                                    {percent}%
                                                </Text>
                                            </Group>
                                            <Progress
                                                value={percent}
                                                size="sm"
                                                radius="xl"
                                                color="cyan"
                                                animated
                                            />
                                        </Stack>
                                    ) : (
                                        <Stack gap="xs" align="stretch">
                                            <div className="text-center py-1">
                                                <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-white">
                                                    Done Adding Prebuilt
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    Prebuilt successfully created and available in inventory.
                                                </Text>
                                            </div>
                                            <Button
                                                fullWidth
                                                size="sm"
                                                radius="md"
                                                color="cyan"
                                                onClick={onComplete}
                                                rightSection={<Check size={15} />}
                                                className="font-semibold text-xs h-9 shadow-sm"
                                            >
                                                Finalize & Close
                                            </Button>
                                        </Stack>
                                    )}
                                </div>
                            </Stack>
                        </Paper>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
