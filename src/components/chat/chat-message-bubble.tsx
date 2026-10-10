import React, { useState } from "react";
import { User, Bot, Copy, Check, RotateCcw } from "lucide-react";
import { ActionIcon } from "@mantine/core";
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
    onRetry?: () => void;
    retryDisabled?: boolean;
}

export function ChatMessageBubble({
    role,
    text,
    isStreaming,
    isDark,
    hasTelemetry,
    isTelemetryOpen,
    onToggleTelemetry,
    onRetry,
    retryDisabled = false,
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
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isUser
                    ? "bg-cyan-700 text-white"
                    : (isDark ? "bg-slate-700 text-slate-100" : "bg-slate-200 text-slate-700")
            )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={cn(
                "flex flex-col gap-1.5 flex-1 min-w-0 max-w-full group/bubble",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn("flex w-full items-center gap-1.5", isUser ? "justify-end" : "justify-start")}>
                    {isUser && onRetry && (
                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size={32}
                            onClick={onRetry}
                            disabled={retryDisabled}
                            aria-label="Try again"
                            title="Try again"
                            className="shrink-0"
                        >
                            <RotateCcw size={15} />
                        </ActionIcon>
                    )}
                    <div className={cn(
                    "p-3 rounded-xl text-sm leading-relaxed relative break-words w-fit min-w-0 max-w-[85%] sm:max-w-[80%] border",
                    isUser
                        ? 'bg-cyan-700 text-white rounded-tr-sm border-cyan-700'
                        : (isDark
                            ? 'bg-[#1b2432] text-slate-100 rounded-tl-sm border-white/10'
                            : 'bg-white text-slate-900 rounded-tl-sm border-slate-200')
                )}>
                    {/* Corner "!" button for telemetry logistics */}
                    {!isUser && hasTelemetry && !isStreaming && onToggleTelemetry && (
                        <button
                            type="button"
                            onClick={onToggleTelemetry}
                            className={cn(
                                "absolute top-2.5 right-2.5 w-4 h-4 rounded-full border text-[9px] font-mono font-black flex items-center justify-center transition-all duration-200 z-10 cursor-pointer",
                                isTelemetryOpen
                                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                                    : "border-slate-400/40 text-slate-400 hover:border-cyan-500 hover:text-cyan-500"
                            )}
                            title="Telemetry Logistics"
                        >
                            !
                        </button>
                    )}

                    <div className={cn(
                        "prose prose-p:leading-relaxed prose-sm max-w-full break-words overflow-hidden prose-pre:whitespace-pre-wrap prose-pre:break-words transition-colors",
                        isUser ? "prose-invert prose-a:text-white prose-strong:text-white" : isDark ? "prose-invert prose-a:text-cyan-300 prose-strong:text-slate-100" : "prose-slate prose-a:text-cyan-700 prose-strong:text-slate-900",
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
                                    <div className={cn("overflow-x-auto my-2 border rounded-lg", isDark || isUser ? "border-white/10" : "border-slate-200")}>
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
