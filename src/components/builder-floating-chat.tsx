import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, Bot, User, MessageSquare, X, PlusCircle, RotateCcw } from "lucide-react";
import { useTheme } from "@/context/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { ComponentData } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useUserProfile } from "@/context/user-profile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

export function BuilderFloatingChat({ build }: BuilderFloatingChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, loading } = useUserProfile();
    const { toast } = useToast();

    const {
        messages,
        status,
        setMessages,
        sendMessage,
    } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: {
                buildContext: build
            }
        }),
        onFinish: ({ messages: updatedMessages }) => {
            console.log("Chat finished, saving history...");
            localStorage.setItem('pc_chat_history_v2', JSON.stringify(updatedMessages));
            setTimerActive(false);
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

    // Trigger streaming greeting when chat is first opened and empty
    useEffect(() => {
        if (isOpen && messages.length === 0 && !isLoading && authUser) {
            sendMessage({
                text: 'SYSTEM_TRIGGER_GREETING'
            });
        }
    }, [isOpen, messages.length, isLoading, sendMessage, authUser]);

    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem('pc_chat_history_v2');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setElapsedTime(0);
        setTimerActive(true);
        sendMessage({ text: input });
        setInput("");
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-4 max-w-full">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[calc(100vw-2rem)] sm:w-[500px] z-50"
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
                                    <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 px-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-lg flex items-center gap-1.5 group/clear" title="Clear Chat History">
                                        <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover/clear:rotate-[-45deg]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors rounded-full">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className={cn(
                                "flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden transition-colors",
                                isDark ? "bg-gradient-to-b from-transparent to-black/20" : "bg-gradient-to-b from-transparent to-muted/20"
                            )}>
                                <ScrollArea className="flex-1 w-full min-w-0">
                                    <div className="flex flex-col gap-8 py-4 max-w-full overflow-x-hidden">
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
                                                                                {(() => {
                                                                                    const regex = /(?:^[ \t]*[-*+][ \t]+)?\*{0,2}\[[^\]]*\]\((?:add(?:-part(?::[^)]*)?)?)?\)?\*{0,2}(?:\s*-\s*)?/gm;
                                                                                    const cleanText = part.text
                                                                                        .replace(regex, '')
                                                                                        .replace(/\n\s*\n/g, '\n\n')
                                                                                        .trim();

                                                                                    return (
                                                                                        <ReactMarkdown
                                                                                            urlTransform={(url) => url}
                                                                                            components={{
                                                                                                p: ({ children }) => <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>,
                                                                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                                                                                            }}
                                                                                        >
                                                                                            {cleanText}
                                                                                        </ReactMarkdown>
                                                                                    );
                                                                                })()}

                                                                                {isLoading && i === messages.length - 1 && partIdx === msg.parts!.length - 1 && (
                                                                                    <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else if (part.type === 'tool-invocation') {
                                                                    const partAny = part as any;
                                                                    const isComplete = (partAny.state || partAny.toolInvocation?.state) === 'result';
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
                                                                            <span className="opacity-80 italic">{!isComplete ? 'Searching inventory database...' : 'Database scan complete.'}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Full-Width Recommendations Row (Outside the Indented Bubble Column) */}
                                                    {msg.parts?.map((part, partIdx) => {
                                                        if (part.type === 'text') {
                                                            const carouselRegex = /\[([^\]]+)\]\(add-part:([^)]+)\)/g;
                                                            const matches = Array.from(part.text.matchAll(carouselRegex)).slice(0, 4);

                                                            if (matches.length > 0) {
                                                                return (
                                                                    <div key={`carousel-${partIdx}`} className="mt-2 relative w-full max-w-full min-w-0">
                                                                        <Carousel className="w-full">
                                                                            <CarouselContent className="-ml-2">
                                                                                {matches.map((match, idx) => {
                                                                                    const partName = match[1];
                                                                                    const href = match[2];
                                                                                    const rawData = decodeURIComponent(href);
                                                                                    const dataParts = rawData.split('|');
                                                                                    const category = dataParts[0] || '';
                                                                                    const partId = dataParts[1] || undefined;
                                                                                    const partPrice = dataParts[2] || '';
                                                                                    const formattedPrice = !isNaN(Number(partPrice))
                                                                                        ? Number(partPrice).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                                                                        : partPrice;

                                                                                    let partImageUrl = dataParts[3]?.trim().replace(/^["']|["']$/g, '') || undefined;
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
                                                                                        <CarouselItem key={idx} className="pl-2 basis-[85%] sm:basis-[220px] shrink-0">
                                                                                            <div className={cn(
                                                                                                "rounded-3xl overflow-hidden shadow-2xl group/card transition-all flex flex-col h-full mb-2 border",
                                                                                                isDark ? "bg-white/5 border-white/10 hover:border-cyan-500/40 hover:shadow-cyan-500/10" : "bg-card border-border/60 hover:border-cyan-500/40 hover:shadow-cyan-500/10"
                                                                                            )}>
                                                                                                <div className={cn(
                                                                                                    "relative aspect-video w-full overflow-hidden transition-colors",
                                                                                                    isDark ? "bg-white/5" : "bg-muted/20"
                                                                                                )}>
                                                                                                    <img src={finalImage} alt={category} className={cn(
                                                                                                        "w-full h-full object-contain p-4 transition-transform duration-700 group-hover/card:scale-110 opacity-90",
                                                                                                        isDark ? "mix-blend-screen" : "mix-blend-multiply"
                                                                                                    )} />
                                                                                                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black text-cyan-400 uppercase tracking-widest">{category}</div>
                                                                                                </div>
                                                                                                <div className="p-4 flex flex-col gap-3 flex-1">
                                                                                                    <div className="flex flex-col gap-1">
                                                                                                        <h3 className={cn(
                                                                                                            "text-[13px] font-bold leading-tight line-clamp-2 min-h-[32px] transition-colors",
                                                                                                            isDark ? "text-white" : "text-foreground"
                                                                                                        )}>{partName}</h3>
                                                                                                        {partPrice && (
                                                                                                            <div className="text-[14px] font-black text-cyan-400 flex items-center gap-1">
                                                                                                                <span className="text-[10px] opacity-60 font-medium uppercase tracking-tighter">Price:</span>₱{formattedPrice}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex flex-col gap-2 mt-auto">
                                                                                                        <Button variant="secondary" size="sm" className="h-10 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none rounded-2xl shadow-lg shadow-blue-500/20 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 justify-center" onClick={(e) => { e.preventDefault(); const event = new CustomEvent('add-suggestion', { detail: { model: partName?.toString(), id: partId } }); window.dispatchEvent(event); }}>
                                                                                                            <PlusCircle className="w-4 h-4" /> Quick Add
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </CarouselItem>
                                                                                    );
                                                                                })}
                                                                            </CarouselContent>
                                                                            {matches.length > 1 && (
                                                                                <>
                                                                                    <CarouselPrevious className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-2xl z-20" />
                                                                                    <CarouselNext className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-2xl z-20" />
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
                                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10_rgba(6,182,212,0.8)]" style={{ animationDelay: '150ms' }}></span>
                                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10_rgba(6,182,212,0.8)]" style={{ animationDelay: '300ms' }}></span>
                                                    </div>
                                                    <div className="px-1 flex items-center gap-2">
                                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-400/60 animate-pulse">
                                                            {messages[messages.length - 1]?.role === 'assistant' ? 'Researching...' : 'Thinking...'}
                                                        </span>
                                                        {timerActive && (
                                                            <span className="text-[9px] font-mono text-cyan-500/80 font-bold bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10">
                                                                {elapsedTime}s
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className={cn(
                                "p-4 backdrop-blur-xl flex-none border-t relative z-10 transition-colors",
                                isDark ? "bg-black/40 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]" : "bg-muted/80 border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
                            )}>
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2 relative group">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask for advice or part recommendations..."
                                        className={cn(
                                            "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-400 text-sm pr-12 h-12 rounded-xl transition-all placeholder:text-zinc-500 shadow-inner group-hover:border-cyan-500/50",
                                            isDark ? "bg-black/60 border-cyan-500/30 text-white" : "bg-white border-border text-foreground"
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="absolute right-1 top-1 h-10 w-10 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95"
                                        disabled={!input.trim() || isLoading}
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
            >
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-0 border border-white/20 z-10"
                >
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </Button>
            </motion.div>
        </div>
    );
}