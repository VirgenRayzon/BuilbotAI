import React from "react";
import { BrainCircuit, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionIcon, Badge, Text } from "@mantine/core";

interface ChatHeaderProps {
    isDark: boolean;
    isAiKillSwitch: boolean;
    buildPartCount: number;
    onClear: () => void;
    onClose: () => void;
}

export function ChatHeader({ isDark, isAiKillSwitch, buildPartCount, onClear, onClose }: ChatHeaderProps) {
    return (
        <div className={cn("py-3 px-4 flex items-center justify-between flex-none border-b", isDark ? "border-white/10" : "border-slate-200")}>
            <div className="flex items-center gap-2.5">
                <div className={cn("relative w-9 h-9 rounded-lg flex items-center justify-center", isDark ? "bg-cyan-500/15 text-cyan-300" : "bg-cyan-50 text-cyan-700")}>
                    <BrainCircuit className="w-4 h-4" />
                    <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2",
                        isDark ? "ring-[#111722]" : "ring-white",
                        isAiKillSwitch ? "bg-rose-500" : "bg-emerald-500"
                    )} />
                </div>
                <div>
                    <Text fw={700} size="sm" className={isDark ? "text-slate-100" : "text-slate-900"}>
                        Buildbot AI Assistant
                    </Text>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground">
                            {isAiKillSwitch ? "Assistant unavailable" : "Ready to help"}
                        </p>
                        {buildPartCount > 0 && (
                            <Badge size="xs" variant="light" color="cyan" tt="none">
                                Your Build · {buildPartCount} {buildPartCount === 1 ? "part" : "parts"}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={onClear}
                    aria-label="Clear chat history"
                    title="Clear chat history"
                ><RotateCcw size={16} /></ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={onClose}
                    aria-label="Close chat"
                ><X size={17} /></ActionIcon>
            </div>
        </div>
    );
}
