import React from "react";
import { ActionIcon, Paper } from "@mantine/core";
import { useTheme } from "@/context/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedMessageIcon } from "./ui/animated-icons";
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
        buildPartCount,
        handleSendMessage,
        handlePresetClick,
        handleRetryMessage,
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
                        <Paper withBorder radius="lg" shadow="xl" className="h-[65vh] sm:h-[540px] max-h-[calc(100dvh-7.5rem)] min-h-[360px] overflow-hidden" style={{ display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#111722' : '#ffffff' }}>

                            {/* Header */}
                            <ChatHeader
                                isDark={isDark}
                                isAiKillSwitch={isAiKillSwitch}
                                buildPartCount={buildPartCount}
                                onClear={handleClearChat}
                                onClose={toggleOpen}
                            />

                            {/* Scrollable Message List */}
                            <div className={cn("flex-1 p-0 min-h-0 flex flex-col overflow-hidden", isDark ? "bg-[#0f1520]" : "bg-slate-50/70")}>
                                <ChatMessageList
                                    messages={messages}
                                    status={status}
                                    isLoading={isLoading}
                                    elapsedTime={elapsedTime}
                                    timerActive={timerActive}
                                    isDark={isDark}
                                    telemetryState={telemetryState}
                                    addedPartIds={addedPartIds}
                                    hasBuildParts={hasBuildParts}
                                    build={build || null}
                                    onAddPart={handleAddPart}
                                    onRetryMessage={handleRetryMessage}
                                    retryDisabled={isLoading || isAiKillSwitch}
                                />
                            </div>

                            {/* Footer Input & Actions */}
                            <div className={cn("p-3 flex-none border-t flex flex-col gap-2.5", isDark ? "bg-[#111722] border-white/10" : "bg-white border-slate-200")}>
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
                                />
                            </div>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Trigger Button */}
            <div>
                <ActionIcon
                    onClick={toggleOpen}
                    aria-label={isOpen ? "Close Buildbot chat" : "Open Buildbot chat"}
                    color="cyan"
                    radius="xl"
                    size={52}
                    className="shadow-lg"
                >
                    <AnimatedMessageIcon size={22} />
                </ActionIcon>
            </div>
        </div>
    );
}

export type { BuilderFloatingChatProps };
