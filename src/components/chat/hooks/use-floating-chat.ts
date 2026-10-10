import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { ComponentData } from "@/lib/types";
import type { TelemetryInfo } from "../types";

const SLEEK_GREETINGS = [
    "Hi there! I am Buildbot AI, your PC building assistant. How can I help you choose parts or optimize your build today?",
    "Hello! Ready to check compatibility, analyze bottlenecks, or suggest upgrades for your PC build. What are you looking to build?",
    "Welcome! I'm Buildbot AI. Need advice on choosing components or balancing your setup? Ask me anything!"
];

export function useFloatingChat(build?: Record<string, ComponentData | ComponentData[] | null>) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [telemetryState, setTelemetryState] = useState<Record<string, TelemetryInfo>>({});

    const { authUser, profile, loading: profileLoading } = useUserProfile();
    const { toast } = useToast();

    // Measurement refs
    const requestStartRef = useRef<number>(0);
    const ttftRef = useRef<number>(0);
    const kbTimeRef = useRef<number>(0);

    // AI Kill Switch check from Firestore
    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    // Keep the serializable build details used by the server-side checks.
    const sanitizedBuild = useMemo(() => {
        if (!build) return null;
        const res: Record<string, any> = {};
        const serializePart = (item: ComponentData) => ({
            id: item.id,
            name: item.model || item.description,
            price: item.price,
            wattage: item.wattage,
            socket: item.socket,
            ramType: item.ramType,
            performanceTier: item.performanceTier,
            performanceScore: item.performanceScore,
            dimensions: item.dimensions,
            specifications: item.specifications,
        });
        for (const [key, value] of Object.entries(build)) {
            if (!value) continue;
            if (Array.isArray(value)) {
                if (value.length > 0) res[key] = value.map(serializePart);
            } else {
                res[key] = serializePart(value);
            }
        }
        return Object.keys(res).length > 0 ? res : null;
    }, [build]);

    const buildPartCount = sanitizedBuild
        ? Object.values(sanitizedBuild).reduce<number>((count, value) => count + (Array.isArray(value) ? value.length : 1), 0)
        : 0;
    const addedPartIds = useMemo(() => {
        const selected: Record<string, boolean> = {};
        Object.values(build || {}).forEach(value => {
            if (Array.isArray(value)) value.forEach(part => { selected[part.id] = true; });
            else if (value) selected[value.id] = true;
        });
        return selected;
    }, [build]);

    // useChat creates its Chat instance once. The transport must read these refs at
    // request time so restored or newly selected parts reach every new message.
    const requestContextRef = useRef({ profile, sanitizedBuild });
    requestContextRef.current = { profile, sanitizedBuild };

    // Close when other floating actions open
    useEffect(() => {
        const handleOpen = (e: any) => {
            if (e.detail?.type !== 'chat') {
                setIsOpen(false);
            }
        };
        window.addEventListener('floating-action-open', handleOpen);
        return () => window.removeEventListener('floating-action-open', handleOpen);
    }, []);

    // NOTE: Side effects (event dispatch) must stay OUTSIDE the setState updater.
    // Updaters run during render, so dispatching there triggers setState in other
    // floating components (e.g. BuilderFloatingAnalytics) mid-render.
    const toggleOpen = useCallback(() => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) {
            window.dispatchEvent(new CustomEvent('floating-action-open', { detail: { type: 'chat' } }));
        }
    }, [isOpen]);

    const {
        messages,
        status,
        setMessages,
        sendMessage,
        regenerate,
        stop,
    } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: () => {
                const { profile: currentProfile, sanitizedBuild: currentBuild } = requestContextRef.current;
                return {
                    userProfile: currentProfile ? {
                        displayName: currentProfile.name || "Customer",
                        email: currentProfile.email,
                        experienceLevel: (currentProfile as any).experienceLevel || "Intermediate",
                        preferences: (currentProfile as any).preferences || "None provided"
                    } : null,
                    currentBuild,
                };
            },
            fetch: async (api, options) => {
                const response = await fetch(api, options);
                if (requestStartRef.current > 0 && !ttftRef.current) {
                    ttftRef.current = Date.now() - requestStartRef.current;
                }
                const kbHeader = response.headers.get('x-kb-lookup-ms');
                if (kbHeader) {
                    kbTimeRef.current = parseInt(kbHeader, 10);
                }
                return response;
            }
        }),
        onFinish: ({ messages: updatedMessages }) => {
            try {
                localStorage.setItem('pc_chat_history_v2', JSON.stringify(updatedMessages));
            } catch (err) {
                console.error("Failed to save chat history to localStorage", err);
            }
            setTimerActive(false);

            // Compute and record telemetry
            const tat = requestStartRef.current > 0 ? Date.now() - requestStartRef.current : elapsedTime * 1000;
            const ttft = ttftRef.current || Math.min(2000, tat * 0.3);
            const kbTime = kbTimeRef.current || 0;

            const lastAssistantMessage = updatedMessages.filter(m => m.role === 'assistant').pop();
            if (lastAssistantMessage) {
                const msgId = lastAssistantMessage.id;
                const text = lastAssistantMessage.parts
                    ?.filter(p => p.type === 'text')
                    .map(p => (p as any).text || '')
                    .join('') || '';
                const charCount = text.length;
                const tokenEst = Math.max(1, Math.round(charCount / 4));
                const generationDurationSeconds = Math.max(0.1, (tat - ttft) / 1000);
                const tokensPerSec = parseFloat((tokenEst / generationDurationSeconds).toFixed(1));

                const newTelemetry: TelemetryInfo = {
                    kbLookupMs: kbTime,
                    ttftMs: ttft,
                    tatMs: tat,
                    tokensPerSecond: tokensPerSec,
                    tokensUsed: tokenEst,
                    timestamp: Date.now()
                };

                const savedTelemetry = localStorage.getItem('pc_chat_telemetry_v1');
                let telemetryMap: Record<string, TelemetryInfo> = {};
                if (savedTelemetry) {
                    try {
                        telemetryMap = JSON.parse(savedTelemetry);
                    } catch (e) {
                        console.error(e);
                    }
                }
                telemetryMap[msgId] = newTelemetry;
                try {
                    localStorage.setItem('pc_chat_telemetry_v1', JSON.stringify(telemetryMap));
                } catch (e) {
                    console.error("Failed to persist telemetry map", e);
                }
                setTelemetryState(telemetryMap);
            }
        },
        onError: (err) => {
            setTimerActive(false);
            const isConnectionError = err instanceof TypeError && /fetch|network/i.test(err.message);
            toast({
                variant: "destructive",
                title: isConnectionError ? "Can't connect to chat" : "Chat unavailable",
                description: isConnectionError
                    ? process.env.NODE_ENV === 'development'
                        ? "The app server isn't responding on port 9002. Start npm run dev and try again."
                        : "Check your connection and try again."
                    : err.message || "The AI service is temporarily unavailable. Please try again.",
            });
        }
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive) {
            const start = Date.now();
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - start) / 1000));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    // Restore cached history and telemetry on mount
    useEffect(() => {
        const savedTelemetry = localStorage.getItem('pc_chat_telemetry_v1');
        if (savedTelemetry) {
            try {
                setTelemetryState(JSON.parse(savedTelemetry));
            } catch (e) {
                console.error("Failed to parse telemetry history", e);
            }
        }

        const saved = localStorage.getItem('pc_chat_history_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const migrated = parsed.map((m: any) => {
                    if (!m.parts && (m.content || m.text)) {
                        return {
                            ...m,
                            parts: [{ type: 'text', text: m.content || m.text }]
                        };
                    }
                    return m;
                });
                setMessages(migrated);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
    }, [setMessages]);

    // Render local welcome greeting when chat is first opened and empty
    useEffect(() => {
        if (isOpen && messages.length === 0 && !isLoading && !isAiKillSwitch) {
            const randomGreeting = SLEEK_GREETINGS[Math.floor(Math.random() * SLEEK_GREETINGS.length)];
            const welcomeMsg: UIMessage = {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                parts: [{ type: 'text', text: randomGreeting }],
            };
            setMessages([welcomeMsg]);
            try {
                localStorage.setItem('pc_chat_history_v2', JSON.stringify([welcomeMsg]));
            } catch (e) {
                console.error(e);
            }
        }
    }, [isOpen, messages.length, isLoading, setMessages, isAiKillSwitch]);

    // Clear chat on logout
    useEffect(() => {
        if (!profileLoading && !authUser) {
            setMessages([]);
            localStorage.removeItem('pc_chat_history_v2');
        }
    }, [authUser, profileLoading, setMessages]);

    const handleClearChat = useCallback(() => {
        setMessages([]);
        localStorage.removeItem('pc_chat_history_v2');
        toast({
            title: "Chat Cleared",
            description: "Conversation history has been reset.",
        });
    }, [setMessages, toast]);

    const beginRequest = useCallback(() => {
        setElapsedTime(0);
        setTimerActive(true);
        requestStartRef.current = Date.now();
        ttftRef.current = 0;
        kbTimeRef.current = 0;
    }, []);

    const handleSendMessage = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI service is currently disabled by Administrator.",
                variant: "destructive"
            });
            return;
        }

        if (!input.trim() || isLoading) return;

        beginRequest();
        sendMessage({ text: input });
        setInput("");
    }, [beginRequest, input, isLoading, isAiKillSwitch, sendMessage, toast]);

    const handlePresetClick = useCallback((presetText: string) => {
        if (isLoading || isAiKillSwitch) return;
        beginRequest();
        sendMessage({ text: presetText });
    }, [beginRequest, isLoading, isAiKillSwitch, sendMessage]);

    const handleRetryMessage = useCallback((messageId: string, text: string) => {
        if (isLoading || isAiKillSwitch || !text.trim()) return;

        beginRequest();
        const latestUserMessage = [...messages].reverse().find(message => message.role === 'user');
        // Regenerating an older message discards later chat history in the SDK.
        // Re-send older prompts at the end so the rest of the conversation remains available.
        const retry = latestUserMessage?.id === messageId
            ? regenerate({ messageId })
            : sendMessage({ text });
        void retry.catch(() => setTimerActive(false));
    }, [beginRequest, isAiKillSwitch, isLoading, messages, regenerate, sendMessage]);

    const handleAddPart = useCallback((partName: string, partId: string) => {
        const event = new CustomEvent('add-suggestion', {
            detail: { model: partName, id: partId }
        });
        window.dispatchEvent(event);
    }, []);

    const hasUserMessages = messages.some(m => m.role === 'user');
    const hasBuildParts = sanitizedBuild !== null;

    return {
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
    };
}
