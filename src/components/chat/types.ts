import type { ComponentData } from "@/lib/types";

export interface BuilderFloatingChatProps {
    build?: Record<string, ComponentData | ComponentData[] | null>;
}

export interface TelemetryInfo {
    kbLookupMs: number;
    ttftMs: number;
    tatMs: number;
    tokensPerSecond: number;
    tokensUsed: number;
    timestamp: number;
}

export interface PresetOption {
    text: string;
    icon: React.ReactNode;
}
