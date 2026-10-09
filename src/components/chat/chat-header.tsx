import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedXIcon } from "@/components/ui/animated-icons";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
    isDark: boolean;
    isAiKillSwitch: boolean;
    onClear: () => void;
    onClose: () => void;
}

export function ChatHeader({ isDark, isAiKillSwitch, onClear, onClose }: ChatHeaderProps) {
    return (
        <CardHeader className={cn(
            "py-3.5 px-5 flex flex-row items-center justify-between flex-none z-10 border-b shadow-sm backdrop-blur-md transition-colors",
            isDark ? "bg-black/30 border-white/10" : "bg-muted/40 border-border/40"
        )}>
            <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background",
                        isAiKillSwitch ? "bg-rose-500" : "bg-emerald-400 animate-pulse"
                    )} />
                </div>
                <div>
                    <CardTitle className="font-headline text-sm font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
                        Buildbot AI Assistant
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground font-mono">
                        {isAiKillSwitch ? "Offline (Disabled)" : "AI Assistant Ready"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <AnimatedIconButton
                    variant="ghost"
                    onClick={onClear}
                    className="h-8 px-2 group/clear text-muted-foreground hover:text-cyan-400"
                    title="Clear Chat History"
                    label="Clear"
                    icon={<AnimatedRotateIcon size={14} />}
                />
                <AnimatedIconButton
                    variant="ghost"
                    onClick={onClose}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    icon={<AnimatedXIcon size={16} />}
                />
            </div>
        </CardHeader>
    );
}
