import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "./ui/sparkle-button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, Bot, User, MessageSquare, X, PlusCircle, RotateCcw, Cpu, Monitor, HardDrive, Zap } from "lucide-react";
import { useTheme } from "@/context/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { ComponentData } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, isToolUIPart, getToolName } from "ai";
import { useUserProfile } from "@/context/user-profile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { 
    AnimatedIconButton, 
    AnimatedMessageIcon, 
    AnimatedXIcon, 
    AnimatedRotateIcon,
    AnimatedSendIcon
} from "./ui/animated-icons";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface BuilderFloatingChatProps {
    build?: Record<string, ComponentData | ComponentData[] | null>;
}

interface TelemetryInfo {
    kbLookupMs: number;
    ttftMs: number;
    tatMs: number;
    tokensPerSecond: number;
    tokensUsed: number;
    timestamp: number;
}

function TelemetryDrawer({ telemetry, msgId, isDark, allTelemetry }: { telemetry: TelemetryInfo; msgId: string; isDark: boolean; allTelemetry: TelemetryInfo[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Calculate average TAT
    const averageTat = allTelemetry.length > 0 
        ? allTelemetry.reduce((sum, item) => sum + item.tatMs, 0) / allTelemetry.length 
        : 0;
        
    const tatSeconds = telemetry.tatMs / 1000;
    const ttftSeconds = telemetry.ttftMs / 1000;
    const diff = averageTat > 0 ? (averageTat - telemetry.tatMs) / 1000 : 0;
    
    const isFaster = diff > 0;
    const diffText = diff !== 0 
        ? `${Math.abs(diff).toFixed(1)}s ${isFaster ? 'faster' : 'slower'} than average` 
        : 'On par with average';

    return (
        <div className="mt-2 w-full max-w-[85%] sm:max-w-[80%] text-[11px] font-sans">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 font-mono tracking-wider text-[10px]",
                    isDark 
                        ? "bg-black/30 border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/5"
                        : "bg-cyan-50/50 border-cyan-500/20 hover:border-cyan-500/50 text-cyan-700 hover:bg-cyan-50"
                )}
            >
                <span className="inline-block text-cyan-400">⚡</span>
                <span>Turnaround Time: {tatSeconds.toFixed(2)}s</span>
                <span className="opacity-50 font-sans">•</span>
                <span>{telemetry.tokensPerSecond} tok/s</span>
                <span className={cn("ml-1 transform transition-transform duration-200", isExpanded ? "rotate-180" : "")}>▼</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden mt-1.5"
                    >
                        <div className={cn(
                            "p-3 rounded-xl border backdrop-blur-md font-mono text-[10px] space-y-1.5 shadow-md",
                            isDark
                                ? "bg-black/60 border-cyan-500/20 text-zinc-300 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                                : "bg-white/95 border-cyan-500/10 text-zinc-600 shadow-sm"
                        )}>
                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                <span className="text-[10px] uppercase font-bold text-cyan-400/80">Diagnostic Metrics</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                    isFaster 
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                )}>
                                    {isFaster ? "Optimal" : "Nominal"}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 py-1">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 uppercase">TTFT (First Token)</span>
                                    <span className="font-semibold text-zinc-200">{ttftSeconds.toFixed(2)}s</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 uppercase">DB Lookup Delay</span>
                                    <span className="font-semibold text-zinc-200">{telemetry.kbLookupMs}ms</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 uppercase">Total Execution (Turnaround Time)</span>
                                    <span className="font-semibold text-zinc-200">{tatSeconds.toFixed(2)}s</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 uppercase">Generation Speed</span>
                                    <span className="font-semibold text-zinc-200">{telemetry.tokensPerSecond} tokens/s</span>
                                </div>
                                <div className="flex flex-col col-span-2 border-t border-white/5 pt-1.5 mt-0.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] text-zinc-500 uppercase">Tokens Used</span>
                                        <span className="font-semibold text-cyan-400">
                                            {telemetry.tokensUsed !== undefined 
                                                ? telemetry.tokensUsed 
                                                : Math.max(1, Math.round(telemetry.tokensPerSecond * Math.max(0.1, (telemetry.tatMs - telemetry.ttftMs) / 1000)))
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-1.5 border-t border-white/5 flex items-center gap-1 text-[9px] text-zinc-400 font-sans">
                                <span className={isFaster ? "text-emerald-400" : "text-amber-400"}>
                                    {isFaster ? "▲" : "▼"}
                                </span>
                                <span>{diffText}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function BuilderFloatingChat({ build }: BuilderFloatingChatProps) {
    const [isOpen, setIsOpen] = useState(false);

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

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            window.dispatchEvent(new CustomEvent('floating-action-open', { detail: { type: 'chat' } }));
        }
    };
    const [input, setInput] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading } = useUserProfile();
    const { toast } = useToast();

    // Refs for telemetry measurement
    const requestStartRef = useRef<number>(0);
    const ttftRef = useRef<number>(0);
    const kbTimeRef = useRef<number>(0);

    const [telemetryState, setTelemetryState] = useState<Record<string, TelemetryInfo>>({});

    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const {
        messages,
        status,
        setMessages,
        sendMessage,
    } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: {
                userProfile: profile ? {
                    displayName: profile.name || "Architect",
                    email: profile.email,
                    experienceLevel: (profile as any).experienceLevel || "Intermediate",
                    preferences: (profile as any).preferences || "None provided"
                } : null
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
            console.log("Chat finished, saving history...");
            localStorage.setItem('pc_chat_history_v2', JSON.stringify(updatedMessages));
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
                localStorage.setItem('pc_chat_telemetry_v1', JSON.stringify(telemetryMap));
                setTelemetryState(telemetryMap);
            }
        },
        onError: (err) => {
            console.error("Chat error:", err);
            setTimerActive(false);
            toast({
                variant: "destructive",
                title: "Connection Interrupted",
                description: err.message || "The AI service is temporarily unavailable or timed out. Please try again.",
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
    }, [timerActive, isLoading]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, status]);

    // Clear chat on logout
    useEffect(() => {
        if (!loading && !authUser) {
            setMessages([]);
            localStorage.removeItem('pc_chat_history_v2');
        }
    }, [authUser, loading, setMessages]);

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
                console.error("Failed to parse chat history");
            }
        }
    }, [setMessages]);

    // Render local welcome greeting when chat is first opened and empty
    useEffect(() => {
        if (isOpen && messages.length === 0 && !isLoading && !isAiKillSwitch) {
            const SLEEK_GREETINGS = [
                "System initialized. Welcome, Architect. I am Buildbot AI, your hardware synthesis consultant. How shall we optimize your build today?",
                "Liaison active. Buildbot AI online. Ready to analyze compatibility, bottleneck constraints, and recommend peak-tier hardware configurations. What component are we looking for?",
                "Interface online. I am Buildbot AI, your dedicated PC builder consultant. Ready to assist in selecting compatible components and resolving bottleneck anomalies. How can I help you build today?"
            ];
            const randomGreeting = SLEEK_GREETINGS[Math.floor(Math.random() * SLEEK_GREETINGS.length)];
            const welcomeMsg: UIMessage = {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                parts: [{ type: 'text', text: randomGreeting }],
            };
            setMessages([welcomeMsg]);
            localStorage.setItem('pc_chat_history_v2', JSON.stringify([welcomeMsg]));
        }
    }, [isOpen, messages.length, isLoading, setMessages, isAiKillSwitch]);

    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem('pc_chat_history_v2');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }

        if (!input.trim() || isLoading) return;

        setElapsedTime(0);
        setTimerActive(true);
        requestStartRef.current = Date.now();
        ttftRef.current = 0;
        kbTimeRef.current = 0;
        sendMessage({ text: input });
        setInput("");
    };

    const handlePresetClick = (presetText: string) => {
        if (isLoading || isAiKillSwitch) return;
        setElapsedTime(0);
        setTimerActive(true);
        requestStartRef.current = Date.now();
        ttftRef.current = 0;
        kbTimeRef.current = 0;
        sendMessage({ text: presetText });
    };

    // Show presets only when chat is fresh (just the welcome message, no user messages)
    const hasUserMessages = messages.some(m => m.role === 'user');

    return (
        <div className={cn(
            "fixed left-6 flex flex-col items-start gap-4 max-w-[calc(100vw-3rem)] transition-all duration-300",
            "bottom-24 lg:bottom-6", 
            isOpen ? "z-[60]" : "z-50"
        )}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[calc(100vw-2rem)] sm:w-[500px]"
                    >
                        <Card className={cn(
                            "flex flex-col h-[60vh] sm:h-[800px] max-h-[800px] shadow-[0_10px_50px_rgba(6,182,212,0.25)] overflow-hidden backdrop-blur-2xl relative border rounded-2xl transition-colors duration-500",
                            isDark ? "border-cyan-500/40 bg-background/80" : "border-cyan-500/20 bg-white/90"
                        )}>
                            {/* Animated Background Orbs */}
                            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse z-10"></div>

                            <CardHeader className={cn(
                                "py-4 px-5 flex flex-row items-center justify-between flex-none z-10 border-b shadow-sm backdrop-blur-md transition-colors",
                                isDark ? "bg-black/20 border-white/10" : "bg-muted/40 border-border/40"
                            )}>
                                <CardTitle className="font-headline text-md flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-600 font-bold tracking-tight">
                                    <BrainCircuit className="w-5 h-5 text-blue-500" /> Buildbot AI Interface
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <AnimatedIconButton 
                                        variant="ghost" 
                                        onClick={handleClearChat} 
                                        className="h-8 px-2 group/clear" 
                                        title="Clear Chat History"
                                        label="Clear"
                                        icon={<AnimatedRotateIcon size={14} />}
                                    />
                                    <AnimatedIconButton 
                                        variant="ghost" 
                                        onClick={() => setIsOpen(false)} 
                                        className="h-8 w-8"
                                        icon={<AnimatedXIcon size={16} />}
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className={cn(
                                "flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden transition-colors",
                                isDark ? "bg-gradient-to-b from-transparent to-black/20" : "bg-gradient-to-b from-transparent to-muted/20"
                            )}>
                                <ScrollArea className="flex-1 w-full min-w-0">
                                    <div className="flex flex-col gap-8 pt-4 pb-12 max-w-full overflow-x-hidden">
                                        {messages
                                            .filter(msg => {
                                                const text = msg.parts?.find(p => p.type === 'text')?.text;
                                                return text !== 'SYSTEM_TRIGGER_GREETING';
                                            })
                                            .map((msg, i) => (
                                                <motion.div
                                                    key={msg.id || i}
                                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                    className="grid grid-cols-1 gap-3 w-full max-w-full min-w-0 relative px-1"
                                                >
                                                    {/* Message Content Row (Avatar + Bubbles) */}
                                                    <div className={`flex gap-3 w-full min-w-0 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-cyan-500/30 ring-2 ring-cyan-500/20' : 'bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-blue-500/30 ring-2 ring-blue-500/20'}`}>
                                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                        </div>

                                                        <div className={`flex flex-col gap-3 flex-1 min-w-0 max-w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                            {msg.parts?.map((part, partIdx) => {
                                                                if (part.type === 'text') {
                                                                    return (
                                                                        <div
                                                                            key={partIdx}
                                                                            className={cn(
                                                                                "p-4 rounded-2xl text-sm leading-relaxed shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 break-words w-fit max-w-[85%] sm:max-w-[80%]",
                                                                                msg.role === 'user'
                                                                                    ? (isDark
                                                                                        ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/20 text-cyan-50 rounded-tr-sm border border-cyan-500/40 backdrop-blur-md'
                                                                                        : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm shadow-cyan-500/20 border border-cyan-400/30')
                                                                                    : (isDark
                                                                                        ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 backdrop-blur-xl text-blue-50 rounded-tl-sm border border-blue-500/30'
                                                                                        : 'bg-white border border-border/60 text-foreground rounded-tl-sm shadow-sm hover:border-blue-500/30')
                                                                            )}
                                                                        >
                                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out pointer-events-none"></div>

                                                                            <div className={cn(
                                                                                "prose prose-p:leading-snug prose-sm max-w-full break-words overflow-hidden prose-pre:whitespace-pre-wrap prose-pre:break-words transition-colors",
                                                                                isDark ? "prose-invert prose-a:text-cyan-400 prose-strong:text-blue-300" : "prose-slate prose-a:text-blue-600 prose-strong:text-blue-800"
                                                                            )}>
                                                                                <ReactMarkdown
                                                                                    urlTransform={(url) => url}
                                                                                    components={{
                                                                                        p: ({ children }) => <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>,
                                                                                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                                                                                    }}
                                                                                >
                                                                                    {part.text}
                                                                                </ReactMarkdown>

                                                                                {isLoading && i === messages.length - 1 && partIdx === msg.parts!.length - 1 && (
                                                                                    <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else if (isToolUIPart(part)) {
                                                                    const partAny = part as any;
                                                                    const toolName = getToolName(partAny);
                                                                    const isComplete = partAny.state === 'output-available';
                                                                    
                                                                    let statusLabel = 'Processing request...';
                                                                    if (toolName === 'searchInventory') {
                                                                        statusLabel = !isComplete ? 'Searching live catalog...' : 'Catalog search complete.';
                                                                    } else if (toolName === 'queryCompatibilityGuides') {
                                                                        statusLabel = !isComplete ? 'Checking compatibility guides...' : 'Compatibility rules loaded.';
                                                                    } else if (toolName === 'queryPartSpecifications') {
                                                                        statusLabel = !isComplete ? 'Retrieving hardware specifications...' : 'Part specifications loaded.';
                                                                    }

                                                                    return (
                                                                        <div key={partIdx} className={cn(
                                                                            "py-2 px-4 rounded-xl text-xs shadow-sm w-fit flex items-center gap-2 border transition-colors",
                                                                            isDark ? "bg-black/40 text-cyan-400 border-cyan-500/20" : "bg-muted text-cyan-700 border-cyan-500/20"
                                                                        )}>
                                                                            {!isComplete ? (
                                                                                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                                                                            ) : (
                                                                                <div className="w-3 h-3 rounded-full bg-cyan-500/50 flex items-center justify-center shrink-0">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                                                                </div>
                                                                            )}
                                                                            <span className="opacity-80 italic">{statusLabel}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                            {msg.role === 'assistant' && telemetryState[msg.id] && (
                                                                <TelemetryDrawer
                                                                    telemetry={telemetryState[msg.id]}
                                                                    msgId={msg.id}
                                                                    isDark={isDark}
                                                                    allTelemetry={Object.values(telemetryState)}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Full-Width Recommendations Row (Outside the Indented Bubble Column) */}
                                                    {msg.parts?.map((part, partIdx) => {
                                                        const partAny = part as any;
                                                        if (isToolUIPart(part) && getToolName(partAny) === 'searchInventory' && partAny.state === 'output-available') {
                                                             const partsList = partAny.output;
                                                             
                                                             if (partsList && !partsList.error && Array.isArray(partsList) && partsList.length > 0) {
                                                                 const recommendations = partsList.slice(0, 4);
                                                                 return (
                                                                     <div key={`carousel-${partIdx}`} className="mt-3 mb-1 relative w-[94%] mx-auto min-w-0 px-1">
                                                                         <Carousel className="w-full">
                                                                             <CarouselContent className="-ml-2">
                                                                                 {recommendations.map((partItem: any, idx) => {
                                                                                     const partName = partItem.name;
                                                                                     const partId = partItem.id;
                                                                                     const partPrice = partItem.price;
                                                                                     const category = partItem.category || '';
                                                                                     const formattedPrice = typeof partPrice === 'number'
                                                                                         ? partPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                                                                         : partPrice;

                                                                                     let partImageUrl = partItem.imageUrl || undefined;
                                                                                     if (partImageUrl && partImageUrl.includes('firebasestorage.googleapis.com') && partImageUrl.includes('/o/') && partImageUrl.includes('?')) {
                                                                                         const urlParts = partImageUrl.split('/o/');
                                                                                         const afterO = urlParts[1].split('?');
                                                                                         const path = afterO[0];
                                                                                         const query = afterO[1];
                                                                                         if (path.includes('/')) {
                                                                                             const encodedPath = path.split('/').join('%2F');
                                                                                             partImageUrl = `${urlParts[0]}/o/${encodedPath}?${query}`;
                                                                                         }
                                                                                     }

                                                                                     const placeholderImage = PlaceHolderImages.find(p => p.id.toLowerCase() === category.toLowerCase())?.imageUrl || PlaceHolderImages.find(p => p.id === 'case')?.imageUrl;
                                                                                     const finalImage = partImageUrl && partImageUrl.startsWith('http') ? partImageUrl : placeholderImage;

                                                                                     return (
                                                                                         <CarouselItem key={idx} className="pl-2 basis-[80%] sm:basis-[200px] shrink-0 h-full">
                                                                                             <div className={cn(
                                                                                                 "rounded-xl overflow-hidden shadow-lg group/card transition-all duration-300 flex flex-col h-[260px] border relative cursor-pointer",
                                                                                                 isDark 
                                                                                                     ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_24px_rgba(6,182,212,0.2)]" 
                                                                                                     : "bg-gradient-to-b from-card to-muted/30 border-border/60 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                                                                             )}>
                                                                                                 {/* Premium gloss shine sweep animation */}
                                                                                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover/card:animate-shinesweep pointer-events-none z-10"></div>
                                                                                                 <div className={cn(
                                                                                                     "relative w-full h-[150px] overflow-hidden flex items-center justify-center shrink-0",
                                                                                                     isDark ? "bg-white/[0.03]" : "bg-muted/20"
                                                                                                 )}>
                                                                                                     <img src={finalImage} alt={partName || category} className={cn(
                                                                                                         "max-w-full max-h-full object-contain p-2 transition-transform duration-500 group-hover/card:scale-110",
                                                                                                         isDark ? "opacity-95" : "opacity-90 mix-blend-multiply"
                                                                                                     )} />
                                                                                                     {/* Bottom gradient vignette for depth */}
                                                                                                     <div className={cn(
                                                                                                         "absolute inset-x-0 bottom-0 h-8 pointer-events-none",
                                                                                                         isDark ? "bg-gradient-to-t from-black/40 to-transparent" : "bg-gradient-to-t from-white/60 to-transparent"
                                                                                                     )}></div>
                                                                                                     <div className="absolute top-1.5 right-1.5 px-1.5 py-px bg-black/70 backdrop-blur-sm rounded-md border border-white/10 text-[8px] font-black text-cyan-400 uppercase tracking-widest">{category}</div>
                                                                                                 </div>
                                                                                                 
                                                                                                 {/* Info section — compact and clean */}
                                                                                                 <div className="px-2.5 pt-2 pb-2 flex flex-col gap-1.5 flex-1 justify-between min-h-0">
                                                                                                     <div className="flex flex-col gap-0.5 min-h-0">
                                                                                                         <h3 className={cn(
                                                                                                             "text-[11px] font-bold leading-tight line-clamp-2 min-h-[28px] transition-colors",
                                                                                                             isDark ? "text-zinc-200 group-hover/card:text-white" : "text-zinc-800 group-hover/card:text-foreground"
                                                                                                         )} title={partName}>{partName}</h3>
                                                                                                         
                                                                                                         {partPrice > 0 && (
                                                                                                             <div className="text-[13px] font-black text-cyan-400 tabular-nums tracking-tight">₱{formattedPrice}</div>
                                                                                                         )}
                                                                                                     </div>
                                                                                                     
                                                                                                     <Button variant="secondary" size="sm" className="h-7 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none rounded-lg shadow-md shadow-cyan-500/15 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all duration-200 hover:scale-[1.02] active:scale-95 justify-center" onClick={(e) => { e.preventDefault(); const event = new CustomEvent('add-suggestion', { detail: { model: partName?.toString(), id: partId } }); window.dispatchEvent(event); }}>
                                                                                                         <PlusCircle className="w-3 h-3" /> Add
                                                                                                     </Button>
                                                                                                 </div>
                                                                                             </div>
                                                                                         </CarouselItem>
                                                                                     );
                                                                                 })}
                                                                             </CarouselContent>
                                                                             {recommendations.length > 1 && (
                                                                                 <>
                                                                                     <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-2xl z-20 flex items-center justify-center rounded-full" />
                                                                                     <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-2xl z-20 flex items-center justify-center rounded-full" />
                                                                                 </>
                                                                             )}
                                                                         </Carousel>
                                                                     </div>
                                                                 );
                                                             }
                                                         }
                                                         return null;
                                                     })}
                                                </motion.div>
                                            ))}

                                        {isLoading && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="flex gap-3 flex-row items-end"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse relative">
                                                    <div className="absolute inset-0 rounded-full bg-cyan-400/50 blur-md animate-ping"></div>
                                                    <Bot className="w-4 h-4 relative z-10" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className={cn(
                                                        "p-4 rounded-2xl backdrop-blur-md rounded-tl-sm border flex items-center gap-1.5 h-[42px] shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-colors",
                                                        isDark ? "bg-white/5 border-cyan-500/30" : "bg-muted border-cyan-500/20"
                                                    )}>
                                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '0ms' }}></span>
                                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '150ms' }}></span>
                                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '300ms' }}></span>
                                                    </div>
                                                    <div className="px-1 flex flex-col gap-2 mt-2 w-full max-w-[85%]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-400/60">
                                                                {messages[messages.length - 1]?.role === 'assistant' ? 'Researching...' : 'Thinking...'}
                                                            </span>
                                                            {timerActive && (
                                                                <span className="text-[9px] font-mono text-cyan-500/80 font-bold bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10">
                                                                    {elapsedTime}s
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[9px] font-mono border border-cyan-500/10 bg-cyan-500/5 rounded-lg p-2 backdrop-blur-md max-w-full overflow-x-auto">
                                                            {[
                                                                { label: "Connecting", icon: "⚡" },
                                                                { label: "Ingesting Context", icon: "🔍" },
                                                                { label: "Scanning Catalog", icon: "📚" },
                                                                { label: "Streaming Advice", icon: "✍️" }
                                                            ].map((step, idx) => {
                                                                const activeStepIndex = status === 'streaming' 
                                                                    ? 3 
                                                                    : elapsedTime < 1.5 
                                                                        ? 0 
                                                                        : elapsedTime < 3.0 
                                                                            ? 1 
                                                                            : 2;
                                                                const isActive = idx === activeStepIndex;
                                                                const isCompleted = idx < activeStepIndex;
                                                                return (
                                                                    <div key={idx} className="flex items-center gap-1 shrink-0">
                                                                        <span className={cn(
                                                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                                            isActive ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" : isCompleted ? "bg-cyan-500" : "bg-zinc-700"
                                                                        )} />
                                                                        <span className={cn(
                                                                            "transition-colors duration-300 text-[8px]",
                                                                            isActive ? "text-cyan-400 font-bold" : isCompleted ? "text-cyan-500/80 hidden sm:inline" : "text-zinc-600 hidden sm:inline"
                                                                        )}>
                                                                            {step.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className={cn(
                                "p-4 backdrop-blur-xl flex-none border-t relative z-10 transition-colors flex flex-col gap-3",
                                isDark ? "bg-black/40 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]" : "bg-muted/80 border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
                            )}>
                                {/* Preset message chips — shown only when conversation is fresh */}
                                <AnimatePresence>
                                    {!hasUserMessages && !isLoading && !isAiKillSwitch && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                            className="w-full overflow-hidden"
                                        >
                                            <div className="flex flex-wrap gap-1.5 w-full">
                                                {[
                                                    { text: "Recommend me a GPU", icon: <Monitor className="w-3 h-3" /> },
                                                    { text: "Best CPU for gaming?", icon: <Cpu className="w-3 h-3" /> },
                                                    { text: "SSD vs HDD for my build", icon: <HardDrive className="w-3 h-3" /> },
                                                    { text: "Check part compatibility", icon: <Zap className="w-3 h-3" /> },
                                                ].map((preset, idx) => (
                                                    <motion.button
                                                        key={preset.text}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.06, duration: 0.2 }}
                                                        onClick={() => handlePresetClick(preset.text)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer",
                                                            isDark
                                                                ? "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                                                                : "bg-white border-border/60 text-zinc-600 hover:bg-cyan-50 hover:border-cyan-400/40 hover:text-cyan-700"
                                                        )}
                                                    >
                                                        {preset.icon}
                                                        {preset.text}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2 relative group">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={isAiKillSwitch ? "AI is disabled by Administrator" : "Ask for advice or part recommendations..."}
                                        disabled={isAiKillSwitch}
                                        className={cn(
                                            "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-400 text-sm pr-12 h-12 rounded-xl transition-all placeholder:text-zinc-500 shadow-inner group-hover:border-cyan-500/50",
                                            isDark ? "bg-black/60 border-cyan-500/30 text-white" : "bg-white border-border text-foreground",
                                            isAiKillSwitch && "opacity-50 cursor-not-allowed"
                                        )}
                                    />
                                    <SparkleButton
                                        type="submit"
                                        className="absolute right-1 top-1 h-10 w-10 min-w-[40px] px-0"
                                        disabled={!input.trim() || isLoading || isAiKillSwitch}
                                        isLoading={isLoading}
                                    >
                                        <AnimatedSendIcon size={18} active={!isLoading && input.trim().length > 0} />
                                    </SparkleButton>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <AnimatedIconButton
                    onClick={toggleOpen}
                    className="h-14 w-14 sm:h-16 sm:w-16 p-0 shadow-[0_0_40px_rgba(6,182,212,0.5)] border-white/20 bg-gradient-to-tr from-blue-600/90 to-cyan-600/90 backdrop-blur-xl"
                    icon={<AnimatedMessageIcon size={28} className="text-white" />}
                />
            </div>
        </div>
    );
}