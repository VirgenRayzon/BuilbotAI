import React, { useState } from "react";
import { User, Bot, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessageBubbleProps {
    role: 'user' | 'assistant' | 'system' | string;
    text: string;
    isStreaming: boolean;
    isDark: boolean;
    hasTelemetry?: boolean;
    isTelemetryOpen?: boolean;
    onToggleTelemetry?: () => void;
}

export function ChatMessageBubble({
    role,
    text,
    isStreaming,
    isDark,
    hasTelemetry,
    isTelemetryOpen,
    onToggleTelemetry
}: ChatMessageBubbleProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isUser = role === 'user';

    return (
        <div className={`flex gap-3 w-full min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ring-2",
                isUser
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-cyan-500/30 ring-cyan-500/20"
                    : "bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-blue-500/30 ring-blue-500/20"
            )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={cn(
                "flex flex-col gap-1.5 flex-1 min-w-0 max-w-full group/bubble",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 break-words w-fit max-w-[85%] sm:max-w-[80%]",
                    isUser
                        ? (isDark
                            ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/20 text-cyan-50 rounded-tr-sm border border-cyan-500/40 backdrop-blur-md'
                            : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm shadow-cyan-500/20 border border-cyan-400/30')
                        : (isDark
                            ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 backdrop-blur-xl text-blue-50 rounded-tl-sm border border-blue-500/30'
                            : 'bg-white border border-border/60 text-foreground rounded-tl-sm shadow-sm hover:border-blue-500/30')
                )}>
                    {/* Hover shimmer shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out pointer-events-none" />

                    {/* Corner "!" button for telemetry logistics */}
                    {!isUser && hasTelemetry && !isStreaming && onToggleTelemetry && (
                        <button
                            type="button"
                            onClick={onToggleTelemetry}
                            className={cn(
                                "absolute top-2.5 right-2.5 w-4 h-4 rounded-full border text-[9px] font-mono font-black flex items-center justify-center transition-all duration-200 z-10 cursor-pointer",
                                isTelemetryOpen
                                    ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)] scale-110"
                                    : "border-cyan-500/30 text-cyan-400/70 hover:text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 opacity-70 hover:opacity-100"
                            )}
                            title="Telemetry Logistics"
                        >
                            !
                        </button>
                    )}

                    <div className={cn(
                        "prose prose-p:leading-relaxed prose-sm max-w-full break-words overflow-hidden prose-pre:whitespace-pre-wrap prose-pre:break-words transition-colors",
                        isDark ? "prose-invert prose-a:text-cyan-400 prose-strong:text-blue-300" : "prose-slate prose-a:text-blue-600 prose-strong:text-blue-800",
                        !isUser && hasTelemetry && !isStreaming && "pr-4"
                    )}>
                        <ReactMarkdown
                            urlTransform={(url) => url}
                            components={{
                                p: ({ children }) => <div className="mb-2 last:mb-0 leading-relaxed">{children}</div>,
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-300 transition-colors">
                                        {children}
                                    </a>
                                ),
                                table: ({ children }) => (
                                    <div className="overflow-x-auto my-2 border rounded-lg border-white/10">
                                        <table className="min-w-full text-xs">{children}</table>
                                    </div>
                                )
                            }}
                        >
                            {text}
                        </ReactMarkdown>

                        {isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                        )}
                    </div>
                </div>

                {/* Bubble Footer Actions */}
                {!isUser && text && !isStreaming && (
                    <div className="flex items-center gap-2 px-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-cyan-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5 font-mono"
                            title="Copy response"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>

                        {hasTelemetry && onToggleTelemetry && (
                            <button
                                type="button"
                                onClick={onToggleTelemetry}
                                className={cn(
                                    "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer",
                                    isTelemetryOpen ? "text-cyan-400 font-bold" : "text-muted-foreground hover:text-cyan-400"
                                )}
                                title="Telemetry Logistics"
                            >
                                <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-bold">!</span>
                                <span>Telemetry</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
