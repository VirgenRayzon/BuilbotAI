import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { UIMessage, isToolUIPart, getToolName } from "ai";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatToolStatus } from "./chat-tool-status";
import { ChatRecommendationsCarousel } from "./chat-recommendations-carousel";
import { ChatTelemetryDrawer } from "./chat-telemetry-drawer";
import { ChatLoadingIndicator } from "./chat-loading-indicator";
import type { TelemetryInfo } from "./types";
import type { ComponentData } from "@/lib/types";
import { getRecommendationTurnPresentation, groupChatMessageParts } from "@/lib/chat-message-parts";

interface ChatMessageListProps {
    messages: UIMessage[];
    status: string;
    isLoading: boolean;
    elapsedTime: number;
    timerActive: boolean;
    isDark: boolean;
    telemetryState: Record<string, TelemetryInfo>;
    addedPartIds: Record<string, boolean>;
    hasBuildParts: boolean;
    build: Record<string, ComponentData | ComponentData[] | null> | null;
    onAddPart: (partName: string, partId: string) => void;
    onRetryMessage: (messageId: string, text: string) => void;
    retryDisabled: boolean;
}

export function ChatMessageList({
    messages,
    status,
    isLoading,
    isDark,
    telemetryState,
    addedPartIds,
    hasBuildParts,
    build,
    onAddPart,
    onRetryMessage,
    retryDisabled,
}: ChatMessageListProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [openTelemetryMsgId, setOpenTelemetryMsgId] = useState<string | null>(null);

    // Scroll only the message viewport. scrollIntoView also scrolls the outer
    // overflow-hidden chat panel and can hide its header and input.
    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
        viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }, [messages, status]);

    const filteredMessages = messages.filter(msg => {
        const text = msg.parts?.find(p => p.type === 'text')?.text;
        return text !== 'SYSTEM_TRIGGER_GREETING';
    });

    return (
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 w-full min-w-0">
            <div className="flex flex-col gap-5 pt-4 pb-12 max-w-full overflow-x-hidden px-1">
                {filteredMessages.map((msg, i) => {
                    const isLastAssistantMessage = i === filteredMessages.length - 1 && msg.role === 'assistant';
                    const hasTelemetry = !!telemetryState[msg.id];
                    const isTelemetryOpen = openTelemetryMsgId === msg.id;
                    const retryText = msg.role === 'user'
                        ? msg.parts?.map(part => part.type === 'text' ? part.text : '').join('').trim()
                        : '';
                    const recommendationTurn = msg.role === 'assistant'
                        ? getRecommendationTurnPresentation(msg.parts || [])
                        : null;
                    const displayParts = recommendationTurn?.displayParts ?? groupChatMessageParts(msg.parts || []);
                    const firstTextPartIndex = displayParts.findIndex(part => part.kind === 'text');

                    return (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                            className="grid grid-cols-1 gap-2.5 w-full max-w-full min-w-0 relative px-1"
                        >
                            {/* Message Row */}
                            <div className="w-full">
                                {displayParts.map((part, partIdx) => {
                                    if (part.kind === 'text') {
                                        return (
                                            <ChatMessageBubble
                                                key={part.firstPartIndex}
                                                role={msg.role}
                                                text={part.text}
                                                isStreaming={isLoading && isLastAssistantMessage && part.lastPartIndex === msg.parts!.length - 1}
                                                isDark={isDark}
                                                hasTelemetry={hasTelemetry}
                                                isTelemetryOpen={isTelemetryOpen}
                                                onToggleTelemetry={() => setOpenTelemetryMsgId(prev => prev === msg.id ? null : msg.id)}
                                                onRetry={partIdx === firstTextPartIndex && retryText
                                                    ? () => onRetryMessage(msg.id, retryText)
                                                    : undefined}
                                                retryDisabled={retryDisabled}
                                            />
                                        );
                                    } else if (part.kind === 'tool' && isToolUIPart(part.part)) {
                                        const toolName = getToolName(part.part);
                                        const isComplete = part.part.state === 'output-available';

                                        return (
                                            <div key={part.partIndex} className="pl-11 mt-1">
                                                <ChatToolStatus
                                                    toolName={toolName}
                                                    isComplete={isComplete}
                                                    isDark={isDark}
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Telemetry Diagnostics Drawer (Opened via "!" button) */}
                                {msg.role === 'assistant' && hasTelemetry && (
                                    <div className="pl-11">
                                        <ChatTelemetryDrawer
                                            telemetry={telemetryState[msg.id]}
                                            isDark={isDark}
                                            allTelemetry={Object.values(telemetryState)}
                                            isOpen={isTelemetryOpen}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Full-width interactive recommendation carousel */}
                            {recommendationTurn?.recommendationGroups.map(group => (
                                <ChatRecommendationsCarousel
                                    key={group.category}
                                    partsList={group.parts}
                                    isDark={isDark}
                                    addedPartIds={addedPartIds}
                                    hasBuildParts={hasBuildParts}
                                    build={build}
                                    onAddPart={onAddPart}
                                />
                            ))}
                        </motion.div>
                    );
                })}

                {/* Loading indicator with only the 3 bouncing dots */}
                {isLoading && (
                    <ChatLoadingIndicator isDark={isDark} />
                )}

            </div>
        </ScrollArea>
    );
}
