import React from "react";
import { cn } from "@/lib/utils";
import type { ChatPartSpecifications } from "@/lib/chat-part-specifications";

interface ChatToolStatusProps {
    toolName: string;
    isComplete: boolean;
    isDark: boolean;
    output?: unknown;
}

export function ChatToolStatus({ toolName, isComplete, isDark, output }: ChatToolStatusProps) {
    const result = toolName === 'queryPartSpecifications' && output && typeof output === 'object'
        ? output as Partial<ChatPartSpecifications>
        : null;
    const webSources = result?.source === 'web' && Array.isArray(result.sources)
        ? result.sources.filter(source => typeof source?.title === 'string' && typeof source?.url === 'string' && source.url.startsWith('https://'))
        : [];
    let statusLabel = 'Processing request...';
    if (toolName === 'searchInventory') {
        statusLabel = !isComplete ? 'Searching live catalog...' : 'Catalog search complete.';
    } else if (toolName === 'queryCompatibilityGuides') {
        statusLabel = !isComplete ? 'Checking compatibility guides...' : 'Compatibility rules loaded.';
    } else if (toolName === 'queryPartSpecifications') {
        statusLabel = !isComplete ? 'Checking specifications and sources...'
            : result?.source === 'web' ? 'Checked with Google Search.'
            : result?.source === 'vector' ? 'Local specifications found.'
            : 'Exact specifications unavailable.';
    } else if (toolName === 'analyzeCurrentBuild') {
        statusLabel = !isComplete ? 'Analyzing your active build...' : 'Build analysis complete.';
    }

    return (
        <div className="max-w-full space-y-2">
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
        {webSources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-1">
                {webSources.map(source => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"
                        className={cn('rounded-md border px-2 py-1.5 text-[11px] underline break-all',
                            isDark ? 'border-white/10 text-cyan-300' : 'border-slate-200 text-cyan-700')}>
                        {source.title}
                    </a>
                ))}
            </div>
        )}
        {result?.source === 'web' && result.searchSuggestionHtml && (
            <iframe title="Google Search suggestions" srcDoc={result.searchSuggestionHtml}
                sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer"
                className="h-16 w-full border-0" />
        )}
        </div>
    );
}
