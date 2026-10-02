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

interface ChatMessageListProps {
    messages: UIMessage[];
    status: string;
    isLoading: boolean;
    elapsedTime: number;
    timerActive: boolean;
    isDark: boolean;
    telemetryState: Record<string, TelemetryInfo>;
    addedPartIds: Record<string, boolean>;
    onAddPart: (partName: string, partId: string) => void;
}

export function ChatMessageList({
    messages,
    status,
    isLoading,
    isDark,
    telemetryState,
    addedPartIds,
    onAddPart
}: ChatMessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [openTelemetryMsgId, setOpenTelemetryMsgId] = useState<string | null>(null);

    // Auto-scroll to bottom on new messages or streaming chunks
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, status]);

    const filteredMessages = messages.filter(msg => {
        const text = msg.parts?.find(p => p.type === 'text')?.text;
        return text !== 'SYSTEM_TRIGGER_GREETING';
    });

    return (
        <ScrollArea className="flex-1 w-full min-w-0">
            <div className="flex flex-col gap-5 pt-4 pb-12 max-w-full overflow-x-hidden px-1">
                {filteredMessages.map((msg, i) => {
                    const isLastAssistantMessage = i === filteredMessages.length - 1 && msg.role === 'assistant';
                    const hasTelemetry = !!telemetryState[msg.id];
                    const isTelemetryOpen = openTelemetryMsgId === msg.id;

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
                                {msg.parts?.map((part, partIdx) => {
                                    if (part.type === 'text') {
                                        return (
                                            <ChatMessageBubble
                                                key={partIdx}
                                                role={msg.role}
                                                text={part.text}
                                                isStreaming={isLoading && isLastAssistantMessage && partIdx === msg.parts!.length - 1}
                                                isDark={isDark}
                                                hasTelemetry={hasTelemetry}
                                                isTelemetryOpen={isTelemetryOpen}
                                                onToggleTelemetry={() => setOpenTelemetryMsgId(prev => prev === msg.id ? null : msg.id)}
                                            />
                                        );
                                    } else if (isToolUIPart(part)) {
                                        const partAny = part as any;
                                        const toolName = getToolName(partAny);
                                        const isComplete = partAny.state === 'output-available';

                                        return (
                                            <div key={partIdx} className="pl-11 mt-1">
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
                            {msg.parts?.map((part, partIdx) => {
                                const partAny = part as any;
                                if (isToolUIPart(part) && getToolName(partAny) === 'searchInventory' && partAny.state === 'output-available') {
                                    const partsList = partAny.output;
                                    return (
                                        <ChatRecommendationsCarousel
                                            key={`carousel-${partIdx}`}
                                            partsList={partsList}
                                            isDark={isDark}
                                            addedPartIds={addedPartIds}
                                            onAddPart={onAddPart}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </motion.div>
                    );
                })}

                {/* Loading indicator with only the 3 bouncing dots */}
                {isLoading && (
                    <ChatLoadingIndicator isDark={isDark} />
                )}

                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    );
}
