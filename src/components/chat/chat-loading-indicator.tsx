import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatLoadingIndicatorProps {
    isDark: boolean;
}

export function ChatLoadingIndicator({ isDark }: ChatLoadingIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="flex gap-3 flex-row items-end px-1"
        >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400/50 blur-md animate-ping" />
                <Bot className="w-4 h-4 relative z-10" />
            </div>

            <div className={cn(
                "p-3.5 rounded-2xl backdrop-blur-md rounded-tl-sm border flex items-center gap-1.5 h-[38px] shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-colors",
                isDark ? "bg-white/5 border-cyan-500/30" : "bg-muted border-cyan-500/20"
            )}>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '300ms' }} />
            </div>
        </motion.div>
    );
}
