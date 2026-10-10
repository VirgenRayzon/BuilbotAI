import React from "react";
import { ActionIcon, TextInput } from "@mantine/core";
import { AnimatedSendIcon } from "@/components/ui/animated-icons";
import { Square } from "lucide-react";

interface ChatInputBarProps {
    input: string;
    setInput: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onStop: () => void;
    isLoading: boolean;
    isAiKillSwitch: boolean;
}

export function ChatInputBar({
    input,
    setInput,
    onSubmit,
    onStop,
    isLoading,
    isAiKillSwitch,
}: ChatInputBarProps) {
    return (
        <form onSubmit={onSubmit} className="w-full">
            <TextInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Message Buildbot AI"
                placeholder={isAiKillSwitch ? "AI is currently unavailable" : "Ask about your build or parts..."}
                disabled={isAiKillSwitch}
                radius="md"
                size="md"
                rightSectionWidth={isLoading ? 76 : 42}
                rightSection={<div className="flex items-center gap-1 pr-1">
                {isLoading && (
                    <ActionIcon
                        type="button"
                        onClick={onStop}
                        variant="light"
                        color="red"
                        size="sm"
                        aria-label="Stop generating"
                        title="Stop generating"
                    >
                        <Square size={13} fill="currentColor" />
                    </ActionIcon>
                )}
                <ActionIcon
                    type="submit"
                    disabled={!input.trim() || isLoading || isAiKillSwitch}
                    loading={isLoading}
                    color="cyan"
                    size="sm"
                    aria-label="Send message"
                >
                    <AnimatedSendIcon size={17} active={!isLoading && input.trim().length > 0} />
                </ActionIcon>
                </div>}
            />
        </form>
    );
}
