import React from "react";
import { cn } from "@/lib/utils";

interface ChatToolStatusProps {
    toolName: string;
    isComplete: boolean;
    isDark: boolean;
}

export function ChatToolStatus({ toolName, isComplete, isDark }: ChatToolStatusProps) {
    let statusLabel = 'Processing request...';
    if (toolName === 'searchInventory') {
        statusLabel = !isComplete ? 'Searching live catalog...' : 'Catalog search complete.';
    } else if (toolName === 'queryCompatibilityGuides') {
        statusLabel = !isComplete ? 'Checking compatibility guides...' : 'Compatibility rules loaded.';
    } else if (toolName === 'queryPartSpecifications') {
        statusLabel = !isComplete ? 'Retrieving hardware specifications...' : 'Part specifications loaded.';
    } else if (toolName === 'analyzeCurrentBuild') {
        statusLabel = !isComplete ? 'Analyzing your active build...' : 'Build analysis complete.';
    }

    return (
        <div className={cn(
            "py-1.5 px-3 rounded-xl text-[11px] shadow-sm w-fit flex items-center gap-2 border font-mono transition-colors",
            isDark ? "bg-black/40 text-cyan-400 border-cyan-500/20" : "bg-muted text-cyan-700 border-cyan-500/20"
        )}>
            {!isComplete ? (
                <div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/50 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
            )}
            <span className="opacity-90">{statusLabel}</span>
        </div>
    );
}
