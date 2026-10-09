import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTheme } from "@/context/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedIconButton, AnimatedMessageIcon } from "./ui/animated-icons";
import { cn } from "@/lib/utils";
import type { BuilderFloatingChatProps } from "./chat/types";
import { useFloatingChat } from "./chat/hooks/use-floating-chat";
import { ChatHeader } from "./chat/chat-header";
import { ChatMessageList } from "./chat/chat-message-list";
import { ChatPresetChips } from "./chat/chat-preset-chips";
import { ChatInputBar } from "./chat/chat-input-bar";

export function BuilderFloatingChat({ build }: BuilderFloatingChatProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const {
        isOpen,
        toggleOpen,
        input,
        setInput,
        messages,
        status,
        isLoading,
        elapsedTime,
        timerActive,
        isAiKillSwitch,
        telemetryState,
        addedPartIds,
        hasUserMessages,
        hasBuildParts,
        handleSendMessage,
        handlePresetClick,
        handleClearChat,
        handleAddPart,
        stop,
    } = useFloatingChat(build);

    return (
        <div className={cn(
            "fixed right-4 sm:right-6 flex flex-col items-end gap-3 sm:gap-4 max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] transition-all duration-300",
            "bottom-20 sm:bottom-24 lg:bottom-6",
            isOpen ? "z-[60]" : "z-50"
        )}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="w-[calc(100vw-2rem)] sm:w-[420px] md:w-[440px]"
                    >
                        <Card className={cn(
                            "flex flex-col h-[65vh] sm:h-[540px] max-h-[calc(100dvh-7.5rem)] min-h-[360px] shadow-[0_10px_40px_rgba(6,182,212,0.15)] overflow-hidden backdrop-blur-2xl relative border rounded-2xl transition-colors duration-500",
                            isDark ? "border-cyan-500/30 bg-background/90" : "border-slate-200/80 bg-white/95"
                        )}>
                            {/* Ambient Glowing Background Orbs */}
                            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
                            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

                            {/* Header */}
                            <ChatHeader
                                isDark={isDark}
                                isAiKillSwitch={isAiKillSwitch}
                                onClear={handleClearChat}
                                onClose={toggleOpen}
                            />

                            {/* Scrollable Message List */}
                            <CardContent className={cn(
                                "flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden transition-colors",
                                isDark ? "bg-gradient-to-b from-transparent to-black/20" : "bg-gradient-to-b from-transparent to-muted/20"
                            )}>
                                <ChatMessageList
                                    messages={messages}
                                    status={status}
                                    isLoading={isLoading}
                                    elapsedTime={elapsedTime}
                                    timerActive={timerActive}
                                    isDark={isDark}
                                    telemetryState={telemetryState}
                                    addedPartIds={addedPartIds}
                                    onAddPart={handleAddPart}
                                />
                            </CardContent>

                            {/* Footer Input & Actions */}
                            <CardFooter className={cn(
                                "p-3.5 sm:p-4 backdrop-blur-xl flex-none border-t relative z-10 transition-colors flex flex-col gap-2.5",
                                isDark ? "bg-black/40 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]" : "bg-muted/80 border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
                            )}>
                                {/* Preset Chips (shown when conversation has no user messages) */}
                                <AnimatePresence>
                                    {!hasUserMessages && !isLoading && !isAiKillSwitch && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className="w-full"
                                        >
                                            <ChatPresetChips
                                                hasBuildParts={hasBuildParts}
                                                isDark={isDark}
                                                onPresetClick={handlePresetClick}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input Bar */}
                                <ChatInputBar
                                    input={input}
                                    setInput={setInput}
                                    onSubmit={handleSendMessage}
                                    onStop={stop}
                                    isLoading={isLoading}
                                    isAiKillSwitch={isAiKillSwitch}
                                    isDark={isDark}
                                />
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Trigger Button */}
            <div className="relative group">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 blur-sm opacity-50 group-hover:opacity-90 transition duration-300" />
                <AnimatedIconButton
                    onClick={toggleOpen}
                    className="h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-full p-0 shadow-[0_4px_20px_rgba(6,182,212,0.35)] border-white/20 bg-gradient-to-tr from-blue-600/95 to-cyan-600/95 backdrop-blur-xl [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-5.5 sm:[&>svg]:h-5.5"
                    icon={<AnimatedMessageIcon size={22} className="text-white" />}
                />
            </div>
        </div>
    );
}

export type { BuilderFloatingChatProps };