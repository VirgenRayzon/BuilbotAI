import React from "react";
import { Input } from "@/components/ui/input";
import { SparkleButton } from "@/components/ui/sparkle-button";
import { AnimatedSendIcon } from "@/components/ui/animated-icons";
import { Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
    input: string;
    setInput: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onStop: () => void;
    isLoading: boolean;
    isAiKillSwitch: boolean;
    isDark: boolean;
}

export function ChatInputBar({
    input,
    setInput,
    onSubmit,
    onStop,
    isLoading,
    isAiKillSwitch,
    isDark
}: ChatInputBarProps) {
    return (
        <form onSubmit={onSubmit} className="flex w-full gap-2 relative group items-center">
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAiKillSwitch ? "AI is disabled by Administrator" : "Ask for advice or part recommendations..."}
                disabled={isAiKillSwitch}
                className={cn(
                    "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-400 text-sm pr-20 h-12 rounded-xl transition-all placeholder:text-zinc-500 shadow-inner group-hover:border-cyan-500/50",
                    isDark ? "bg-black/60 border-cyan-500/30 text-white" : "bg-white border-border text-foreground",
                    isAiKillSwitch && "opacity-50 cursor-not-allowed"
                )}
            />

            <div className="absolute right-1.5 flex items-center gap-1">
                {isLoading && (
                    <button
                        type="button"
                        onClick={onStop}
                        className="h-9 w-9 rounded-lg flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all hover:scale-105 active:scale-95"
                        title="Stop generating"
                    >
                        <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                )}

                <SparkleButton
                    type="submit"
                    className="h-9 w-9 min-w-[36px] px-0"
                    disabled={!input.trim() || isLoading || isAiKillSwitch}
                    isLoading={isLoading}
                >
                    <AnimatedSendIcon size={17} active={!isLoading && input.trim().length > 0} />
                </SparkleButton>
            </div>
        </form>
    );
}
