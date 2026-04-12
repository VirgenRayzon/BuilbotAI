"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, Bot, User, MessageSquare, X, PlusCircle, Cpu, Sparkles, Eraser, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { ComponentData } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface Message {
    role: 'bot' | 'user';
    text: string;
}

interface BuilderFloatingChatProps {
    build?: Record<string, ComponentData | ComponentData[] | null>;
}

export function BuilderFloatingChat({ build }: BuilderFloatingChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const defaultMessages: Message[] = [
        { role: 'bot', text: 'Initialize sequence... Hello Architect. I am your Buildbot AI Assistant.' },
        { role: 'bot', text: 'I am monitoring your component selection. Ask me anything or let me suggest parts for your current build.' }
    ];
    
    const [messages, setMessages] = useState<Message[]>(defaultMessages);
    const [isLoaded, setIsLoaded] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('pc_chat_history');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('pc_chat_history', JSON.stringify(messages));
        }
    }, [messages, isLoaded]);



    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', text: userMsg }],
                    buildContext: build
                })
            });

            if (!response.ok) {
                throw new Error("Failed to communicate with AI.");
            }

            if (!response.body) return;

            // Prepare for streaming response
            setMessages(prev => [...prev, { role: 'bot', text: '' }]);
            setIsTyping(false); // Hide typing indicator because streaming starts

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                aiText += chunk;
                
                // Update the last message progressively
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'bot', text: aiText };
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to AI Assistant." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[350px] sm:w-[450px]"
                    >
                        <Card className="flex flex-col h-[600px] border-cyan-500/40 shadow-[0_10px_50px_rgba(6,182,212,0.25)] overflow-hidden bg-background/80 backdrop-blur-2xl relative border rounded-2xl">
                            {/* Animated Background Orbs */}
                            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
                            
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse z-10"></div>
                            
                            <CardHeader className="py-4 px-5 bg-black/20 flex flex-row items-center justify-between flex-none z-10 border-b border-white/10 shadow-sm backdrop-blur-md">
                                <CardTitle className="font-headline text-md flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-tight">
                                    <BrainCircuit className="w-5 h-5 text-blue-400" /> Buildbot AI Interface
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setMessages(defaultMessages);
                                        localStorage.removeItem('pc_chat_history');
                                    }} className="h-8 px-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-lg flex items-center gap-1.5 group/clear" title="Clear Chat History">
                                        <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover/clear:rotate-[-45deg]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors rounded-full">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden bg-gradient-to-b from-transparent to-black/20">
                                <ScrollArea className="flex-1 p-5" ref={scrollRef}>
                                    <div className="space-y-5 pb-6">
                                        {messages.map((msg, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                className={`flex gap-3 relative px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-cyan-500/30 ring-2 ring-cyan-500/20' : 'bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-blue-500/30 ring-2 ring-blue-500/20'}`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                                                    msg.role === 'user' 
                                                    ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/20 text-cyan-50 rounded-tr-sm border border-cyan-500/40 backdrop-blur-md' 
                                                    : 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 backdrop-blur-xl text-blue-50 rounded-tl-sm border border-blue-500/30'
                                                }`}>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out pointer-events-none"></div>
                                                    {msg.role === 'user' ? (
                                                        <p>{msg.text}</p>
                                                    ) : (
                                                        <div className="prose prose-invert prose-p:leading-snug prose-sm max-w-none prose-a:text-cyan-400 prose-strong:text-blue-300">
                                                            <ReactMarkdown 
                                                                urlTransform={(url) => url}
                                                                components={{
                                                                p: ({ children }) => {
                                                                    return <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>;
                                                                },
                                                                a: ({ href, children }) => {
                                                                    if (href?.startsWith('add-part:')) {
                                                                        const rawData = decodeURIComponent(href.replace('add-part:', ''));
                                                                        const parts = rawData.split('|');
                                                                        const category = parts[0] || '';
                                                                        const partId = parts[1] || undefined;
                                                                        const partPrice = parts[2] || '';
                                                                        const partImageUrl = parts[3] || undefined;
                                                                        const partName = children;
                                                                        
                                                                        const placeholderImage = PlaceHolderImages.find(p => p.id.toLowerCase() === category.toLowerCase())?.imageUrl || PlaceHolderImages.find(p => p.id === 'case')?.imageUrl;
                                                                        const finalImage = partImageUrl || placeholderImage;

                                                                         return (
                                                                            <div className="my-5 bg-black/40 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl group/card transition-all hover:border-blue-500/40 hover:shadow-blue-500/20 hover:scale-[1.01] relative aspect-square max-w-[400px] mx-auto">
                                                                                <img src={finalImage} alt={category} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover/card:scale-110" />
                                                                                
                                                                                {/* Content Overlay */}
                                                                                <div className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-3">
                                                                                    <div className="flex flex-col gap-0.5">
                                                                                        <div className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">{partName || children}</div>
                                                                                        {partPrice && (
                                                                                            <div className="text-[13px] font-black text-cyan-400 drop-shadow-md tracking-tight">{partPrice}</div>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    <Button 
                                                                                        variant="secondary" 
                                                                                        size="sm" 
                                                                                        className="h-9 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none rounded-xl shadow-lg shadow-blue-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all group-hover/card:scale-105 active:scale-95 w-full justify-center"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            const event = new CustomEvent('add-suggestion', { detail: { model: partName?.toString(), id: partId } });
                                                                                            window.dispatchEvent(event);
                                                                                        }}
                                                                                    >
                                                                                        <PlusCircle className="w-4 h-4" />
                                                                                        Quick Add to Build
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                                                }
                                                            }}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {isTyping && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="flex gap-3 flex-row px-1"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-700 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse relative">
                                                    <div className="absolute inset-0 rounded-full bg-cyan-400/50 blur-md animate-ping"></div>
                                                    <Bot className="w-4 h-4 relative z-10" />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md rounded-tl-sm border border-cyan-500/30 flex items-center gap-1.5 h-[42px] shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 bg-black/40 backdrop-blur-xl flex-none border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] relative z-10">
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2 relative group">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask for advice or part recommendations..."
                                        className="bg-black/60 border-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-400 text-sm pr-12 h-12 rounded-xl transition-all placeholder:text-zinc-500 shadow-inner group-hover:border-cyan-500/50"
                                    />
                                    <Button 
                                        type="submit" 
                                        size="icon" 
                                        className="absolute right-1 top-1 h-10 w-10 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95" 
                                        disabled={!input.trim()}
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
                                    className="relative h-16 w-16 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-0 border border-white/20 z-10"
                                >
                                    <MessageSquare className="w-7 h-7 text-white" />
                                </Button>
                            </motion.div>
        </div>
    );
}
