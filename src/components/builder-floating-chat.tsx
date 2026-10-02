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
            "fixed left-6 flex flex-col items-start gap-4 max-w-[calc(100vw-3rem)] transition-all duration-300",
            "bottom-24 lg:bottom-6",
            isOpen ? "z-[60]" : "z-50"
        )}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="w-[calc(100vw-2rem)] sm:w-[500px]"
                    >
                        <Card className={cn(
                            "flex flex-col h-[60vh] sm:h-[800px] max-h-[800px] shadow-[0_10px_50px_rgba(6,182,212,0.25)] overflow-hidden backdrop-blur-2xl relative border rounded-2xl transition-colors duration-500",
                            isDark ? "border-cyan-500/40 bg-background/85" : "border-cyan-500/20 bg-white/95"
                        )}>
                            {/* Ambient Glowing Background Orbs */}
                            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
                            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse z-10" />

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
            <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                <AnimatedIconButton
                    onClick={toggleOpen}
                    className="h-14 w-14 sm:h-16 sm:w-16 p-0 shadow-[0_0_40px_rgba(6,182,212,0.5)] border-white/20 bg-gradient-to-tr from-blue-600/90 to-cyan-600/90 backdrop-blur-xl"
                    icon={<AnimatedMessageIcon size={28} className="text-white" />}
                />
            </div>
        </div>
    );
}

export type { BuilderFloatingChatProps };